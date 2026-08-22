import express from 'express';
import { db } from '../../config/database.js';
import { requireAuth, requireManager, isManager, resolveEmployeeId } from '../../middleware/authentication.js';
import { eachDate, inclusiveDays } from '../../utils/dateHelpers.js';

const router = express.Router();
router.use(requireAuth);

export const LEAVE_TYPES = ['Paid', 'Sick', 'Unpaid'];

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

const rowView = (r) => ({
  id: r.id, employeeId: r.employee_id, name: r.name, empCode: r.emp_code,
  type: r.type, from: r.from_date, to: r.to_date, days: r.days,
  remarks: r.remarks, status: r.status, adminComment: r.admin_comment,
  appliedOn: r.applied_on,
});

const withEmployee = `SELECT l.*, e.name, e.emp_code FROM leaves l JOIN employees e ON e.id = l.employee_id`;

// POST /api/leaves - SRS 3.5.1 apply for leave
router.post('/', (req, res) => {
  if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
  const { type, from, to, remarks = '' } = req.body || {};

  if (!LEAVE_TYPES.includes(type)) return res.status(400).json({ error: `Leave type must be one of: ${LEAVE_TYPES.join(', ')}` });
  if (!isDate(from) || !isDate(to)) return res.status(400).json({ error: 'Valid from and to dates are required (yyyy-mm-dd)' });
  if (to < from) return res.status(400).json({ error: 'The end date cannot fall before the start date' });

  const days = inclusiveDays(from, to);

  const clash = db.prepare(
    `SELECT 1 FROM leaves WHERE employee_id = ? AND status IN ('pending','approved')
     AND NOT (to_date < ? OR from_date > ?)`
  ).get(req.employee.id, from, to);
  if (clash) return res.status(409).json({ error: 'You already have a leave request covering part of those dates' });

  const id = db.prepare(
    `INSERT INTO leaves (employee_id, type, from_date, to_date, days, remarks) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.employee.id, type, from, to, days, String(remarks).slice(0, 500)).lastInsertRowid;

  res.status(201).json({ leave: rowView(db.prepare(`${withEmployee} WHERE l.id = ?`).get(id)) });
});

// GET /api/leaves - employees see their own; managers see everyone (SRS 3.5.2)
router.get('/', (req, res) => {
  const { status } = req.query;

  let employeeId = null;
  if (req.query.employeeId) {
    employeeId = resolveEmployeeId(req, req.query.employeeId);
    if (!employeeId) return res.status(403).json({ error: 'You can only view your own leave requests' });
  } else if (!isManager(req.user)) {
    if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
    employeeId = req.employee.id;
  }

  let sql = withEmployee;
  const params = [];
  const where = [];
  if (employeeId) { where.push('l.employee_id = ?'); params.push(employeeId); }
  if (status) { where.push('l.status = ?'); params.push(status); }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY l.applied_on DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({
    leaves: rows.map(rowView),
    summary: {
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    },
  });
});

/** SRS 3.5.2 - "Changes reflect immediately in employee records." */
function decide(req, res, decision) {
  const row = db.prepare('SELECT * FROM leaves WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Leave request not found' });
  if (row.status !== 'pending') return res.status(409).json({ error: `This request was already ${row.status}` });

  const comment = String(req.body?.comment || '').slice(0, 500);

  db.prepare('UPDATE leaves SET status = ?, admin_comment = ?, reviewed_by = ? WHERE id = ?')
    .run(decision, comment, req.user.id, row.id);

  // An approved leave writes straight through to the attendance sheet.
  if (decision === 'approved') {
    const mark = db.prepare(
      `INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, 'leave')
       ON CONFLICT(employee_id, date) DO UPDATE SET status = 'leave'`
    );
    for (const d of eachDate(row.from_date, row.to_date)) mark.run(row.employee_id, d);
  }

  res.json({ leave: rowView(db.prepare(`${withEmployee} WHERE l.id = ?`).get(row.id)) });
}

router.put('/:id/approve', requireManager, (req, res) => decide(req, res, 'approved'));
router.put('/:id/reject', requireManager, (req, res) => decide(req, res, 'rejected'));

export default router;
