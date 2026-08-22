import express from 'express';
import { db } from '../../config/database.js';
import { requireAuth, isManager } from '../../middleware/authentication.js';
import { today, weekRange } from '../../utils/dateHelpers.js';
import { salaryView, leaveBalance } from '../employees/employeeRoutes.js';
import { monthName } from '../payroll/payrollRoutes.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard - SRS 3.2
router.get('/', (req, res) => {
  const date = today();
  const { from, to } = weekRange(date);

  if (isManager(req.user)) {
    // SRS 3.2.2 - employee list, attendance records, leave approvals
    const employees = db.prepare(
      `SELECT e.id, e.emp_code, e.name, e.designation, e.status, COALESCE(d.name, '') AS department
       FROM employees e LEFT JOIN departments d ON d.id = e.dept_id
       ORDER BY e.name`
    ).all();

    const todayAttendance = db.prepare(
      `SELECT status, COUNT(*) AS n FROM attendance WHERE date = ? GROUP BY status`
    ).all(date);

    const pendingLeaves = db.prepare(
      `SELECT l.*, e.name, e.emp_code FROM leaves l JOIN employees e ON e.id = l.employee_id
       WHERE l.status = 'pending' ORDER BY l.applied_on DESC LIMIT 10`
    ).all();

    const payrollTotal = db.prepare(
      `SELECT COALESCE(SUM(basic + hra + da + ta - pf - esi - tax), 0) AS total FROM salary_structure`
    ).get().total;

    const departments = db.prepare('SELECT COUNT(*) AS n FROM departments').get().n;

    const lastRun = db.prepare(
      `SELECT year, month, COUNT(*) AS employees, SUM(net) AS net
       FROM payroll GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 1`
    ).get();

    return res.json({
      role: req.user.role,
      stats: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === 'active').length,
        presentToday: todayAttendance.find((r) => r.status === 'present')?.n || 0,
        onLeaveToday: todayAttendance.find((r) => r.status === 'leave')?.n || 0,
        pendingLeaves: pendingLeaves.length,
        monthlyPayroll: payrollTotal,
        departments,
      },
      lastPayrollRun: lastRun
        ? { ...lastRun, monthName: monthName(lastRun.month) }
        : null,
      employees: employees.map((e) => ({
        id: e.id, empCode: e.emp_code, name: e.name,
        department: e.department, designation: e.designation, status: e.status,
      })),
      attendanceToday: todayAttendance,
      pendingLeaveRequests: pendingLeaves.map((l) => ({
        id: l.id, name: l.name, empCode: l.emp_code, type: l.type,
        from: l.from_date, to: l.to_date, days: l.days, remarks: l.remarks,
      })),
    });
  }

  // SRS 3.2.1 - employee dashboard
  if (!req.employee) return res.status(400).json({ error: 'No employee record linked to this account' });
  const empId = req.employee.id;

  const attendanceToday = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(empId, date);
  const week = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date BETWEEN ? AND ? ORDER BY date')
    .all(empId, from, to);
  const leaves = db.prepare('SELECT * FROM leaves WHERE employee_id = ? ORDER BY applied_on DESC LIMIT 5').all(empId);
  const salary = db.prepare('SELECT * FROM salary_structure WHERE employee_id = ?').get(empId);
  const dept = req.employee.dept_id
    ? db.prepare('SELECT name FROM departments WHERE id = ?').get(req.employee.dept_id)
    : null;

  const latestPayslip = db.prepare(
    `SELECT year, month, net FROM payroll WHERE employee_id = ?
     ORDER BY year DESC, month DESC LIMIT 1`
  ).get(empId);

  res.json({
    role: req.user.role,
    profile: {
      id: empId, empCode: req.employee.emp_code, name: req.employee.name,
      designation: req.employee.designation, department: dept ? dept.name : '',
    },
    attendanceToday: attendanceToday
      ? { checkIn: attendanceToday.check_in, checkOut: attendanceToday.check_out, status: attendanceToday.status }
      : null,
    weekSummary: {
      from, to,
      present: week.filter((r) => r.status === 'present').length,
      absent: week.filter((r) => r.status === 'absent').length,
      halfDay: week.filter((r) => r.status === 'half-day').length,
      leave: week.filter((r) => r.status === 'leave').length,
    },
    // SRS 3.2.1 - "Shows recent activity or alerts."
    recentActivity: leaves.map((l) => ({
      id: l.id,
      text: `${l.type} leave ${l.from_date} to ${l.to_date}`,
      status: l.status,
      when: l.applied_on,
    })),
    leaveBalance: leaveBalance(empId),
    latestPayslip: latestPayslip
      ? { ...latestPayslip, monthName: monthName(latestPayslip.month) }
      : null,
    salary: salaryView(salary), // SRS 3.6.1 - read-only for employees
  });
});

export default router;
