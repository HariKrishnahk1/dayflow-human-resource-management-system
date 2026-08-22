import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './shared/context/AuthContext.jsx';
import Layout from './shared/layout/AppLayout.jsx';
import Login from './features/authentication/LoginPage.jsx';
import Signup from './features/authentication/SignupPage.jsx';
import Verify from './features/authentication/VerifyPage.jsx';
import Dashboard from './features/dashboard/DashboardPage.jsx';
import Profile from './features/employees/ProfilePage.jsx';
import Attendance from './features/attendance/AttendancePage.jsx';
import Leaves from './features/leave/LeavePage.jsx';
import Employees from './features/employees/EmployeeListPage.jsx';
import EmployeeDetail from './features/employees/EmployeeDetailPage.jsx';
import Departments from './features/departments/DepartmentsPage.jsx';
import Payroll from './features/payroll/PayrollPage.jsx';
import Payslips from './features/payroll/PayslipListPage.jsx';
import PayslipView from './features/payroll/PayslipDocument.jsx';
import Analytics from './features/analytics/AnalyticsPage.jsx';
import Settings from './features/settings/SettingsPage.jsx';
import MySalary from './features/payroll/SalaryPage.jsx';

export default function App() {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return <div className="auth-wrap"><div style={{ color: 'var(--muted)' }}>Loading Dayflow…</div></div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/payslips/:employeeId/:year/:month" element={<PayslipView />} />

        {isManager ? (
          <>
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </>
        ) : (
          <>
            <Route path="/profile" element={<Profile />} />
            <Route path="/salary" element={<MySalary />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
