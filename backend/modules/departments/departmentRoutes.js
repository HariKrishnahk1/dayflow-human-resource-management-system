import express from 'express';
import { db } from '../../../database/index.js';
import { requireAuth, requireManager } from '../../middleware/authentication.js';

const router = express.Router();
router.use(requireAuth);

function deptView(d) {
  const stats = db.prepare(
    `SELECT COUNT(*) AS headcount,
            COALESCE(SUM(s.basic + s.hra + s.da + s.ta - s.pf - s.esi - s.tax), 0) AS cost
     FROM employees e
     LEFT JOIN salary_structure s ON s.employee_id = e.id
     WHERE e.dept_id = ? AND e.status = 'active'`
  ).get(d.id);

  const manager = d.manager_id
    ? db.prepare('SELECT id, name, emp_code FROM employees WHERE id = ?').get(d.manager_id)
    : null;

  return {
    id: d.id,
    name: d.name,
    managerId: d.manager_id,
    manager: manager ? { id: manager.id, name: manager.name, empCode: manager.emp_code } : null,
    headcount: stats.headcount,
    monthlyCost: stats.cost,
  };
}

// GET /api/departments — everyone may read (the employee form needs the list)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM departments ORDER BY name').all();
  res.json({ departments: rows.map(deptView) });
});

// POST /api/departments
router.post('/', requireManager, (req, res) => {
  const { name, managerId = null } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Department name is required' });

  const clean = String(name).trim();
  if (db.prepare('SELECT 1 FROM departments WHERE lower(name) = lower(?)').get(clean)) {
    return res.status(409).json({ error: 'A department with that name already exists' });
  }
  if (managerId && !db.prepare('SELECT 1 FROM employees WHERE id = ?').get(Number(managerId))) {
    return res.status(400).json({ error: 'That manager does not exist' });
  }

  const id = db.prepare('INSERT INTO departments (name, manager_id) VALUES (?, ?)')
    .run(clean, managerId ? Number(managerId) : null).lastInsertRowid;

  res.status(201).json({ department: deptView(db.prepare('SELECT * FROM departments WHERE id = ?').get(id)) });
});

// PUT /api/departments/:id
router.put('/:id', requireManager, (req, res) => {
  const id = Number(req.params.id);
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!dept) return res.status(404).json({ error: 'Department not found' });

  const name = req.body?.name !== undefined ? String(req.body.name).trim() : dept.name;
  if (!name) return res.status(400).json({ error: 'Department name cannot be empty' });

  const clash = db.prepare('SELECT 1 FROM departments WHERE lower(name) = lower(?) AND id <> ?').get(name, id);
  if (clash) return res.status(409).json({ error: 'A department with that name already exists' });

  const managerId = req.body?.managerId !== undefined
    ? (req.body.managerId ? Number(req.body.managerId) : null)
    : dept.manager_id;
  if (managerId && !db.prepare('SELECT 1 FROM employees WHERE id = ?').get(managerId)) {
    return res.status(400).json({ error: 'That manager does not exist' });
  }

  db.prepare('UPDATE departments SET name = ?, manager_id = ? WHERE id = ?').run(name, managerId, id);
  res.json({ department: deptView(db.prepare('SELECT * FROM departments WHERE id = ?').get(id)) });
});

// DELETE /api/departments/:id
router.delete('/:id', requireManager, (req, res) => {
  const id = Number(req.params.id);
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!dept) return res.status(404).json({ error: 'Department not found' });

  // Refuse rather than silently orphaning people.
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM employees WHERE dept_id = ?').get(id);
  if (n > 0) {
    return res.status(409).json({
      error: `${n} employee${n === 1 ? ' is' : 's are'} still assigned to ${dept.name}. Reassign them first.`,
    });
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  res.json({ message: `${dept.name} deleted` });
});

export default router;
