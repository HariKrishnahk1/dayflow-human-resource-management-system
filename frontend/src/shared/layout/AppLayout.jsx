import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const MANAGER_NAV = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/dashboard', icon: '📊', text: 'Dashboard' },
      { to: '/analytics', icon: '📈', text: 'Analytics' },
    ],
  },
  {
    label: 'PEOPLE',
    items: [
      { to: '/employees', icon: '👥', text: 'Employees' },
      { to: '/departments', icon: '🏢', text: 'Departments' },
      { to: '/attendance', icon: '🕒', text: 'Attendance' },
      { to: '/leaves', icon: '🏖️', text: 'Leave Approvals' },
    ],
  },
  {
    label: 'PAYROLL',
    items: [
      { to: '/payroll', icon: '🧾', text: 'Run Payroll' },
      { to: '/payslips', icon: '📄', text: 'Payslips' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [{ to: '/settings', icon: '⚙️', text: 'Settings' }],
  },
];

const EMPLOYEE_NAV = [
  {
    label: 'MY PORTAL',
    items: [
      { to: '/dashboard', icon: '📊', text: 'Dashboard' },
      { to: '/profile', icon: '👤', text: 'My Profile' },
      { to: '/attendance', icon: '🕒', text: 'My Attendance' },
      { to: '/leaves', icon: '🏖️', text: 'My Leave' },
    ],
  },
  {
    label: 'PAY',
    items: [
      { to: '/salary', icon: '💰', text: 'My Salary' },
      { to: '/payslips', icon: '📄', text: 'My Payslips' },
    ],
  },
];

const TITLES = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics & Reports',
  '/employees': 'Employee Management',
  '/departments': 'Department Management',
  '/attendance': 'Attendance',
  '/leaves': 'Leave & Time-Off',
  '/payroll': 'Payroll Processing',
  '/payslips': 'Payslips',
  '/settings': 'Settings',
  '/profile': 'My Profile',
  '/salary': 'Salary Details',
};

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/payslips/')) return 'Payslip';
  if (pathname.startsWith('/employees/')) return 'Employee Details';
  return 'Dayflow';
}

export default function Layout({ children }) {
  const { user, logout, isManager } = useAuth();
  const { pathname } = useLocation();
  const nav = isManager ? MANAGER_NAV : EMPLOYEE_NAV;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="shell">
      <aside className="sidebar no-print">
        <div>
          <div className="brand">Day<span>flow</span></div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>Every workday, aligned.</div>
        </div>

        <div className="side-user">
          <div className="side-name">{user.name}</div>
          <div className="side-mail">{user.email}</div>
          <span className={`badge badge-${user.role}`}>
            {user.role === 'hr' ? 'HR Officer' : user.role}
          </span>
        </div>

        <nav style={{ flex: 1 }}>
          {nav.map((section) => (
            <div key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button className="btn btn-ghost btn-block" onClick={logout}>Log out</button>
      </aside>

      <div className="main">
        <header className="topbar no-print">
          <div className="page-title">{titleFor(pathname)}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>{today}</div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
