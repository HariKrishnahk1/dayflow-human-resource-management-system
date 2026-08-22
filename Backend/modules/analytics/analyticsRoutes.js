import express from 'express';
import { db } from '../../../database/index.js';
import { requireAuth, requireManager } from '../../middleware/authentication.js';
import { monthName } from '../payroll/payrollRoutes.js';
import { weekRange, today } from '../../utils/dateHelpers.js';

const router = express.Router();
router.use(requireAuth, requireManager);

// GET /api/analytics — SRS section 6 "Analytics & reports dashboard"
router.get('/', (req, res) => {
  // Department-wise payroll cost and headcount
  const byDepartment = db.prepare(
    `SELECT COALESCE(d.name, 'Unassigned') AS department,
            COUNT(e.id) AS headcount,
            COALESCE(SUM(s.basic + s.hra + s.da + s.ta), 0) AS gross,
            COALESCE(SUM(s.basic + s.hra + s.da + s.ta - s.pf - s.esi - s.tax), 0) AS net
     FROM employees e
     LEFT JOIN departments d ON d.id = e.dept_id
     LEFT JOIN salary_structure s ON s.employee_id = e.id
     WHERE e.status = 'active'
     GROUP BY COALESCE(d.name, 'Unassigned')
     ORDER BY net DESC`
  ).all();

  // Top earners leaderboard
  const topEarners = db.prepare(
    `SELECT e.name, e.emp_code, e.designation, COALESCE(d.name, '—') AS department,
            (s.basic + s.hra + s.da + s.ta - s.pf - s.esi - s.tax) AS net
     FROM employees e
     JOIN salary_structure s ON s.employee_id = e.id
     LEFT JOIN departments d ON d.id = e.dept_id
     WHERE e.status = 'active'
     ORDER BY net DESC LIMIT 5`
  ).all();

  // Salary component split across the organisation
  const c = db.prepare(
    `SELECT COALESCE(SUM(basic),0) AS basic, COALESCE(SUM(hra),0) AS hra,
            COALESCE(SUM(da),0) AS da, COALESCE(SUM(ta),0) AS ta,
            COALESCE(SUM(pf),0) AS pf, COALESCE(SUM(esi),0) AS esi,
            COALESCE(SUM(tax),0) AS tax
     FROM salary_structure s
     JOIN employees e ON e.id = s.employee_id
     WHERE e.status = 'active'`
  ).get();

  const components = {
    earnings: [
      { label: 'Basic', value: c.basic },
      { label: 'HRA', value: c.hra },
      { label: 'DA', value: c.da },
      { label: 'TA', value: c.ta },
    ],
    deductions: [
      { label: 'PF', value: c.pf },
      { label: 'ESI', value: c.esi },
      { label: 'Income Tax', value: c.tax },
    ],
  };

  // Monthly payroll expense trend from processed runs
  const trend = db.prepare(
    `SELECT year, month, COUNT(*) AS employees,
            SUM(gross) AS gross, SUM(total_deductions) AS deductions, SUM(net) AS net
     FROM payroll GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 12`
  ).all().reverse().map((r) => ({ ...r, label: `${monthName(r.month).slice(0, 3)} ${r.year}` }));

  // Attendance mix for the current week
  const { from, to } = weekRange(today());
  const attendanceMix = db.prepare(
    `SELECT status, COUNT(*) AS n FROM attendance WHERE date BETWEEN ? AND ? GROUP BY status`
  ).all(from, to);

  // Leave statistics for the current year
  const leaveStats = db.prepare(
    `SELECT type, status, COUNT(*) AS requests, COALESCE(SUM(days), 0) AS days
     FROM leaves
     WHERE CAST(substr(from_date, 1, 4) AS INTEGER) = ?
     GROUP BY type, status`
  ).all(new Date().getFullYear());

  const headcount = db.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active
     FROM employees`
  ).get();

  res.json({
    headcount,
    byDepartment,
    topEarners: topEarners.map((t) => ({
      name: t.name, empCode: t.emp_code, designation: t.designation,
      department: t.department, net: t.net,
    })),
    components,
    trend,
    attendanceMix,
    leaveStats,
  });
});

export default router;
