import express from 'express';
import { db, getSettings } from '../../config/database.js';
import { requireAuth, requireManager, isManager, resolveEmployeeId } from '../../middleware/authentication.js';
import { toISODate } from '../../utils/dateHelpers.js';

const router = express.Router();
router.use(requireAuth);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const monthName = (m) => MONTHS[m - 1] || String(m);

/** Weekdays in the given month — the default divisor for a day's pay. */
function workingDaysIn(year, month) {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

const monthBounds = (year, month) => ({
  from: toISODate(new Date(year, month - 1, 1)),
  to: toISODate(new Date(year, month, 0)),
});

/**
 * Loss of pay for one employee in one month.
 *
 * Absent days and half-days always cost pay. A day marked `leave` only costs
 * pay when it falls inside an approved *Unpaid* leave — approved Paid and Sick
 * leave is, by definition, paid.
 */
function lossOfPay(employeeId, year, month) {
  const { from, to } = monthBounds(year, month);

  const rows = db.prepare(
    `SELECT date, status FROM attendance
     WHERE employee_id = ? AND date BETWEEN ? AND ?`
  ).all(employeeId, from, to);

  const unpaidRanges = db.prepare(
    `SELECT from_date, to_date FROM leaves
     WHERE employee_id = ? AND status = 'approved' AND type = 'Unpaid'
       AND NOT (to_date < ? OR from_date > ?)`
  ).all(employeeId, from, to);

  const isUnpaidDay = (date) => unpaidRanges.some((r) => date >= r.from_date && date <= r.to_date);

  let lop = 0;
  const breakdown = { absent: 0, halfDay: 0, unpaidLeave: 0 };

  for (const r of rows) {
    if (r.status === 'absent') { lop += 1; breakdown.absent += 1; }
    else if (r.status === 'half-day') { lop += 0.5; breakdown.halfDay += 1; }
    else if (r.status === 'leave' && isUnpaidDay(r.date)) { lop += 1; breakdown.unpaidLeave += 1; }
  }

  return { lop, breakdown };
}

/** Compute (but do not persist) one employee's payroll for a month. */
export function computePayroll(employee, year, month) {
  const s = db.prepare('SELECT * FROM salary_structure WHERE employee_id = ?').get(employee.id);
  if (!s) return null;

  const settings = getSettings();
  const configured = Number(settings.working_days_per_month || 0);
  const workingDays = configured > 0 ? configured : workingDaysIn(year, month);

  const gross = s.basic + s.hra + s.da + s.ta;
  const { lop, breakdown } = lossOfPay(employee.id, year, month);

  const perDay = workingDays > 0 ? gross / workingDays : 0;
  const lopAmount = Math.round(perDay * lop);
  const statutory = s.pf + s.esi + s.tax;
  const totalDeductions = statutory + lopAmount;

  return {
    employeeId: employee.id,
    basic: s.basic, hra: s.hra, da: s.da, ta: s.ta,
    gross,
    pf: s.pf, esi: s.esi, tax: s.tax,
    lopDays: lop, lopAmount, lopBreakdown: breakdown,
    totalDeductions,
    net: Math.max(0, gross - totalDeductions),
    workingDays,
    paidDays: Math.max(0, workingDays - lop),
  };
}

function payrollView(r) {
  return {
    id: r.id, employeeId: r.employee_id, name: r.name, empCode: r.emp_code,
    department: r.dept_name || '', designation: r.designation || '',
    month: r.month, year: r.year, monthName: monthName(r.month),
    basic: r.basic, hra: r.hra, da: r.da, ta: r.ta, gross: r.gross,
    pf: r.pf, esi: r.esi, tax: r.tax,
    lopDays: r.lop_days, lopAmount: r.lop_amount,
    totalDeductions: r.total_deductions, net: r.net,
    workingDays: r.working_days, paidDays: r.paid_days,
    status: r.status, processedOn: r.processed_on,
  };
}

const WITH_EMPLOYEE = `
  SELECT p.*, e.name, e.emp_code, e.designation, d.name AS dept_name
  FROM payroll p
  JOIN employees e ON e.id = p.employee_id
  LEFT JOIN departments d ON d.id = e.dept_id`;

// POST /api/payroll/run — one-click monthly payroll for every active employee
router.post('/run', requireManager, (req, res) => {
  const month = Number(req.body?.month);
  const year = Number(req.body?.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Month must be between 1 and 12' });
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Year looks wrong' });
  }

  const employees = db.prepare(
    `SELECT e.* FROM employees e
     JOIN salary_structure s ON s.employee_id = e.id
     WHERE e.status = 'active'`
  ).all();

  if (employees.length === 0) {
    return res.status(400).json({ error: 'No active employees have a salary structure assigned' });
  }

  const upsert = db.prepare(
    `INSERT INTO payroll (employee_id, month, year, basic, hra, da, ta, gross,
                          pf, esi, tax, lop_days, lop_amount, total_deductions, net,
                          working_days, paid_days, status, processed_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processed', datetime('now'))
     ON CONFLICT(employee_id, month, year) DO UPDATE SET
       basic=excluded.basic, hra=excluded.hra, da=excluded.da, ta=excluded.ta,
       gross=excluded.gross, pf=excluded.pf, esi=excluded.esi, tax=excluded.tax,
       lop_days=excluded.lop_days, lop_amount=excluded.lop_amount,
       total_deductions=excluded.total_deductions, net=excluded.net,
       working_days=excluded.working_days, paid_days=excluded.paid_days,
       status='processed', processed_on=datetime('now')`
  );

  let processed = 0;
  let totalNet = 0;
  for (const emp of employees) {
    const p = computePayroll(emp, year, month);
    if (!p) continue;
    upsert.run(emp.id, month, year, p.basic, p.hra, p.da, p.ta, p.gross,
      p.pf, p.esi, p.tax, p.lopDays, p.lopAmount, p.totalDeductions, p.net,
      p.workingDays, p.paidDays);
    processed++;
    totalNet += p.net;
  }

  res.status(201).json({
    message: `Payroll processed for ${processed} employee${processed === 1 ? '' : 's'} — ${monthName(month)} ${year}`,
    processed, totalNet, month, year,
  });
});

// GET /api/payroll?month=&year= — managers see everyone, employees see themselves
router.get('/', (req, res) => {
  let employeeId = null;
  if (req.query.employeeId) {
    employeeId = resolveEmployeeId(req, req.query.employeeId);
    if (!employeeId) return res.status(403).json({ error: 'You can only view your own payroll' });
  } else if (!isManager(req.user)) {
    if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
    employeeId = req.employee.id;
  }

  const where = [];
  const params = [];
  if (employeeId) { where.push('p.employee_id = ?'); params.push(employeeId); }
  if (req.query.month) { where.push('p.month = ?'); params.push(Number(req.query.month)); }
  if (req.query.year) { where.push('p.year = ?'); params.push(Number(req.query.year)); }

  const sql = `${WITH_EMPLOYEE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''}
               ORDER BY p.year DESC, p.month DESC, e.name`;
  const rows = db.prepare(sql).all(...params);

  res.json({
    payroll: rows.map(payrollView),
    totals: {
      count: rows.length,
      gross: rows.reduce((a, r) => a + r.gross, 0),
      deductions: rows.reduce((a, r) => a + r.total_deductions, 0),
      net: rows.reduce((a, r) => a + r.net, 0),
    },
  });
});

// GET /api/payroll/periods — which months have been processed
router.get('/periods', requireManager, (req, res) => {
  const rows = db.prepare(
    `SELECT year, month, COUNT(*) AS employees, SUM(net) AS net
     FROM payroll GROUP BY year, month ORDER BY year DESC, month DESC`
  ).all();
  res.json({ periods: rows.map((r) => ({ ...r, monthName: monthName(r.month) })) });
});

// GET /api/payroll/payslip/:employeeId/:year/:month — full payslip document
router.get('/payslip/:employeeId/:year/:month', (req, res) => {
  const employeeId = resolveEmployeeId(req, req.params.employeeId);
  if (!employeeId) return res.status(403).json({ error: 'You can only view your own payslip' });

  const row = db.prepare(`${WITH_EMPLOYEE} WHERE p.employee_id = ? AND p.year = ? AND p.month = ?`)
    .get(employeeId, Number(req.params.year), Number(req.params.month));

  if (!row) return res.status(404).json({ error: 'No payslip exists for that period yet' });

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  const settings = getSettings();

  res.json({
    payslip: payrollView(row),
    employee: {
      name: emp.name, empCode: emp.emp_code, email: emp.email,
      designation: emp.designation, joinDate: emp.join_date, bank: emp.bank,
    },
    company: {
      name: settings.company_name,
      address: settings.company_address,
    },
  });
});

// PUT /api/payroll/:id/paid — mark a processed run as paid out
router.put('/:id/paid', requireManager, (req, res) => {
  const row = db.prepare('SELECT * FROM payroll WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Payroll record not found' });
  if (row.status === 'paid') return res.status(409).json({ error: 'This payroll was already marked paid' });

  db.prepare("UPDATE payroll SET status = 'paid' WHERE id = ?").run(row.id);
  res.json({ payroll: payrollView(db.prepare(`${WITH_EMPLOYEE} WHERE p.id = ?`).get(row.id)) });
});

export default router;
