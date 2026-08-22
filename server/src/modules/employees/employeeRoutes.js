import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../config/database.js';
import { requireAuth, requireManager, isManager, resolveEmployeeId } from '../../middleware/authentication.js';
import { validatePassword } from '../authentication/authRoutes.js';

const router = express.Router();
router.use(requireAuth);

/** SRS 3.3.2 - employees may edit only these; managers may edit everything below. */
const EMPLOYEE_EDITABLE = ['phone', 'address', 'photo'];
const MANAGER_EDITABLE = [
  'name', 'email', 'phone', 'address', 'dept_id',
  'designation', 'join_date', 'status', 'bank', 'photo',
];

const gross = (s) => (s ? s.basic + s.hra + s.da + s.ta : 0);
const deductions = (s) => (s ? s.pf + s.esi + s.tax : 0);
export const netPay = (s) => gross(s) - deductions(s);

export function salaryView(s) {
  if (!s) return null;
  return {
    basic: s.basic, hra: s.hra, da: s.da, ta: s.ta,
    pf: s.pf, esi: s.esi, tax: s.tax,
    effectiveFrom: s.effective_from,
    gross: gross(s), totalDeductions: deductions(s), net: netPay(s),
  };
}

/** Annual entitlement per leave type; Unpaid is deliberately uncapped. */
function leaveBalance(employeeId) {
  const s = db.prepare('SELECT key, value FROM settings').all()
    .reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
  const quota = { Paid: Number(s.paid_leave_quota || 12), Sick: Number(s.sick_leave_quota || 12) };
  const year = new Date().getFullYear();

  const used = db.prepare(
    `SELECT type, COALESCE(SUM(days), 0) AS n FROM leaves
     WHERE employee_id = ? AND status = 'approved'
       AND CAST(substr(from_date, 1, 4) AS INTEGER) = ?
     GROUP BY type`
  ).all(employeeId, year).reduce((acc, r) => ({ ...acc, [r.type]: r.n }), {});

  return {
    year,
    Paid: { quota: quota.Paid, used: used.Paid || 0, remaining: quota.Paid - (used.Paid || 0) },
    Sick: { quota: quota.Sick, used: used.Sick || 0, remaining: quota.Sick - (used.Sick || 0) },
    Unpaid: { quota: null, used: used.Unpaid || 0, remaining: null },
  };
}

export function employeeView(emp) {
  const salary = db.prepare('SELECT * FROM salary_structure WHERE employee_id = ?').get(emp.id);
  const documents = db.prepare(
    'SELECT id, title, kind, uploaded_on FROM documents WHERE employee_id = ?'
  ).all(emp.id);
  const dept = emp.dept_id
    ? db.prepare('SELECT id, name FROM departments WHERE id = ?').get(emp.dept_id)
    : null;
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(emp.user_id);

  return {
    id: emp.id, empCode: emp.emp_code, name: emp.name, email: emp.email,
    phone: emp.phone, address: emp.address, bank: emp.bank,
    deptId: emp.dept_id, department: dept ? dept.name : '',
    designation: emp.designation, joinDate: emp.join_date, status: emp.status,
    photo: emp.photo, role: user ? user.role : null,
    salary: salaryView(salary), documents,
    leaveBalance: leaveBalance(emp.id),
  };
}

// GET /api/employees - SRS 3.2.2 admin employee list
router.get('/', requireManager, (req, res) => {
  const q = `%${(req.query.search || '').toLowerCase()}%`;
  const rows = db.prepare(
    `SELECT e.* FROM employees e
     LEFT JOIN departments d ON d.id = e.dept_id
     WHERE lower(e.name) LIKE ? OR lower(e.emp_code) LIKE ?
        OR lower(COALESCE(d.name, '')) LIKE ? OR lower(e.designation) LIKE ?
     ORDER BY e.name`
  ).all(q, q, q, q);
  res.json({ employees: rows.map(employeeView) });
});

// POST /api/employees - admin adds an employee (creates their login too)
router.post('/', requireManager, (req, res) => {
  const {
    empCode, name, email, password, role = 'employee',
    phone = '', address = '', deptId = null, designation = '', joinDate = null, bank = '',
  } = req.body || {};

  if (!empCode || !String(empCode).trim()) return res.status(400).json({ error: 'Employee ID is required' });
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ error: pwError });
  if (!['employee', 'hr', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const code = String(empCode).trim().toUpperCase();
  const mail = String(email).trim().toLowerCase();

  if (db.prepare('SELECT 1 FROM users WHERE emp_code = ?').get(code)) {
    return res.status(409).json({ error: 'That Employee ID is already registered' });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(mail)) {
    return res.status(409).json({ error: 'That email is already registered' });
  }
  if (deptId && !db.prepare('SELECT 1 FROM departments WHERE id = ?').get(Number(deptId))) {
    return res.status(400).json({ error: 'That department does not exist' });
  }

  // Admin-created accounts are pre-verified — HR has already vetted the person.
  const userId = db.prepare(
    `INSERT INTO users (emp_code, email, password_hash, role, verified) VALUES (?, ?, ?, ?, 1)`
  ).run(code, mail, bcrypt.hashSync(password, 10), role).lastInsertRowid;

  const empId = db.prepare(
    `INSERT INTO employees (user_id, emp_code, name, email, phone, address, dept_id, designation, join_date, bank)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')), ?)`
  ).run(userId, code, String(name).trim(), mail, phone, address,
        deptId ? Number(deptId) : null, designation, joinDate, bank).lastInsertRowid;

  db.prepare('INSERT INTO salary_structure (employee_id) VALUES (?)').run(empId);

  res.status(201).json({ employee: employeeView(db.prepare('SELECT * FROM employees WHERE id = ?').get(empId)) });
});

// GET /api/employees/:id - SRS 3.3.1
router.get('/:id', (req, res) => {
  const id = resolveEmployeeId(req, req.params.id);
  if (!id) return res.status(403).json({ error: 'You can only view your own profile' });

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json({ employee: employeeView(emp) });
});

// PUT /api/employees/:id - SRS 3.3.2
router.put('/:id', (req, res) => {
  const id = resolveEmployeeId(req, req.params.id);
  if (!id) return res.status(403).json({ error: 'You can only edit your own profile' });

  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const allowed = isManager(req.user) ? MANAGER_EDITABLE : EMPLOYEE_EDITABLE;
  const supplied = Object.keys(req.body || {});
  const updates = supplied.filter((k) => allowed.includes(k));
  const rejected = supplied.filter((k) => !allowed.includes(k));

  if (rejected.length && !isManager(req.user)) {
    return res.status(403).json({
      error: `Employees may only change: ${EMPLOYEE_EDITABLE.join(', ')}. Contact HR to change ${rejected.join(', ')}.`,
    });
  }
  if (!updates.length) return res.status(400).json({ error: 'No editable fields supplied' });

  if (updates.includes('dept_id') && req.body.dept_id) {
    if (!db.prepare('SELECT 1 FROM departments WHERE id = ?').get(Number(req.body.dept_id))) {
      return res.status(400).json({ error: 'That department does not exist' });
    }
  }

  const setClause = updates.map((k) => `${k} = ?`).join(', ');
  const values = updates.map((k) => (k === 'dept_id' ? (req.body[k] ? Number(req.body[k]) : null) : req.body[k]));
  db.prepare(`UPDATE employees SET ${setClause} WHERE id = ?`).run(...values, id);

  res.json({ employee: employeeView(db.prepare('SELECT * FROM employees WHERE id = ?').get(id)) });
});

// PUT /api/employees/:id/salary - SRS 3.6.2 admin payroll control
router.put('/:id/salary', requireManager, (req, res) => {
  const id = Number(req.params.id);
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const fields = ['basic', 'hra', 'da', 'ta', 'pf', 'esi', 'tax'];
  const values = {};
  for (const f of fields) {
    const v = Number(req.body?.[f] ?? 0);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: `${f} must be a non-negative number` });
    values[f] = v;
  }

  db.prepare(
    `INSERT INTO salary_structure (employee_id, basic, hra, da, ta, pf, esi, tax, effective_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))
     ON CONFLICT(employee_id) DO UPDATE SET
       basic=excluded.basic, hra=excluded.hra, da=excluded.da, ta=excluded.ta,
       pf=excluded.pf, esi=excluded.esi, tax=excluded.tax,
       effective_from=excluded.effective_from`
  ).run(id, values.basic, values.hra, values.da, values.ta, values.pf, values.esi, values.tax);

  res.json({ employee: employeeView(emp) });
});

// GET /api/employees/:id/leave-balance
router.get('/:id/leave-balance', (req, res) => {
  const id = resolveEmployeeId(req, req.params.id);
  if (!id) return res.status(403).json({ error: 'You can only view your own leave balance' });
  res.json({ balance: leaveBalance(id) });
});

export { leaveBalance };
export default router;
