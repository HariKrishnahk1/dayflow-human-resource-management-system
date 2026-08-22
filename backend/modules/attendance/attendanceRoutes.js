import express from 'express';
import { db } from '../../../database/index.js';
import { requireAuth, requireManager, isManager, resolveEmployeeId } from '../../middleware/authentication.js';
import { today, nowTime, weekRange } from '../../utils/dateHelpers.js';

const router = express.Router();
router.use(requireAuth);

export const STATUSES = ['present', 'absent', 'half-day', 'leave'];
const HALF_DAY_HOURS = 4;

function hoursBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1, s1] = checkIn.split(':').map(Number);
  const [h2, m2, s2] = checkOut.split(':').map(Number);
  return ((h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1)) / 3600;
}

const rowView = (r) => ({
  id: r.id, employeeId: r.employee_id, date: r.date,
  checkIn: r.check_in, checkOut: r.check_out, status: r.status,
  hours: Number(hoursBetween(r.check_in, r.check_out).toFixed(2)),
});

// POST /api/attendance/check-in - SRS 3.4.1
router.post('/check-in', (req, res) => {
  if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
  const date = today();

  const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
    .get(req.employee.id, date);
  if (existing && existing.check_in) {
    return res.status(409).json({ error: `Already checked in today at ${existing.check_in}` });
  }

  db.prepare(
    `INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, 'present')
     ON CONFLICT(employee_id, date) DO UPDATE SET check_in = excluded.check_in, status = 'present'`
  ).run(req.employee.id, date, nowTime());

  const row = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(req.employee.id, date);
  res.status(201).json({ attendance: rowView(row) });
});

// POST /api/attendance/check-out - SRS 3.4.1
router.post('/check-out', (req, res) => {
  if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
  const date = today();

  const row = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(req.employee.id, date);
  if (!row || !row.check_in) return res.status(409).json({ error: 'You have not checked in today' });
  if (row.check_out) return res.status(409).json({ error: `Already checked out today at ${row.check_out}` });

  const checkOut = nowTime();
  // A short day is recorded as half-day; anything longer stays present.
  const status = hoursBetween(row.check_in, checkOut) < HALF_DAY_HOURS ? 'half-day' : 'present';
  db.prepare('UPDATE attendance SET check_out = ?, status = ? WHERE id = ?').run(checkOut, status, row.id);

  res.json({ attendance: rowView(db.prepare('SELECT * FROM attendance WHERE id = ?').get(row.id)) });
});

// GET /api/attendance/today
router.get('/today', (req, res) => {
  if (!req.employee) return res.json({ attendance: null });
  const row = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
    .get(req.employee.id, today());
  res.json({ attendance: row ? rowView(row) : null });
});

// GET /api/attendance?employeeId=&view=daily|weekly&date=&from=&to=  - SRS 3.4.2
router.get('/', (req, res) => {
  const { view = 'weekly', date = today() } = req.query;

  // Managers may omit employeeId to pull the whole organisation.
  let employeeId = null;
  if (req.query.employeeId) {
    employeeId = resolveEmployeeId(req, req.query.employeeId);
    if (!employeeId) return res.status(403).json({ error: 'You can only view your own attendance' });
  } else if (!isManager(req.user)) {
    if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
    employeeId = req.employee.id;
  }

  let from, to;
  if (req.query.from && req.query.to) {
    from = req.query.from; to = req.query.to;
  } else if (view === 'daily') {
    from = date; to = date;
  } else {
    ({ from, to } = weekRange(date));
  }

  const params = [from, to];
  let sql = `SELECT a.*, e.name, e.emp_code FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             WHERE a.date BETWEEN ? AND ?`;
  if (employeeId) { sql += ' AND a.employee_id = ?'; params.push(employeeId); }
  sql += ' ORDER BY a.date DESC, e.name';

  const rows = db.prepare(sql).all(...params);
  const summary = STATUSES.reduce((acc, s) => ({ ...acc, [s]: rows.filter((r) => r.status === s).length }), {});

  res.json({
    view, from, to, summary,
    records: rows.map((r) => ({ ...rowView(r), name: r.name, empCode: r.emp_code })),
  });
});

// PUT /api/attendance/:id - manager correction of a status
router.put('/:id', requireManager, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}` });
  }
  const row = db.prepare('SELECT * FROM attendance WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Attendance record not found' });

  db.prepare('UPDATE attendance SET status = ? WHERE id = ?').run(status, row.id);
  res.json({ attendance: rowView(db.prepare('SELECT * FROM attendance WHERE id = ?').get(row.id)) });
});

// POST /api/attendance/mark - manager marks a day for an employee
router.post('/mark', requireManager, (req, res) => {
  const { employeeId, date, status } = req.body || {};
  if (!employeeId || !date) return res.status(400).json({ error: 'employeeId and date are required' });
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}` });
  }
  if (!db.prepare('SELECT 1 FROM employees WHERE id = ?').get(Number(employeeId))) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  db.prepare(
    `INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT(employee_id, date) DO UPDATE SET status = excluded.status`
  ).run(Number(employeeId), date, status);

  const row = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(Number(employeeId), date);
  res.status(201).json({ attendance: rowView(row) });
});

export default router;
