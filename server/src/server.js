import express from 'express';
import cors from 'cors';
import './config/database.js';
import authRoutes from './modules/authentication/authRoutes.js';
import employeeRoutes from './modules/employees/employeeRoutes.js';
import attendanceRoutes from './modules/attendance/attendanceRoutes.js';
import leaveRoutes from './modules/leave/leaveRoutes.js';
import dashboardRoutes from './modules/dashboard/dashboardRoutes.js';
import departmentRoutes from './modules/departments/departmentRoutes.js';
import payrollRoutes from './modules/payroll/payrollRoutes.js';
import analyticsRoutes from './modules/analytics/analyticsRoutes.js';
import settingsRoutes from './modules/settings/settingsRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'dayflow-hrms' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => res.status(404).json({ error: `No such endpoint: ${req.method} ${req.path}` }));

app.use((err, req, res, _next) => {
  console.error('[dayflow]', err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => console.log(`Dayflow API listening on http://localhost:${PORT}`));
