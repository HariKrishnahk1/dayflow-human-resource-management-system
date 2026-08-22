# Dayflow — Human Resource Management System

> Every workday, perfectly aligned.

A full-stack HRMS: secure authentication, role-based access, employee and department
management, attendance tracking, leave and time-off workflows, attendance-driven payroll
processing, payslip generation, and analytics.

---

## Tech stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, React Router 6, Vite 5, plain CSS      |
| Backend   | Node.js, Express 4                              |
| Database  | SQLite (via the built-in `node:sqlite` module)  |
| Auth      | JWT (`jsonwebtoken`) + bcrypt password hashing   |

No database server to install — SQLite writes to a single `server/dayflow.db` file.

---

## Getting started

Requires **Node.js 22.5 or newer** (the `node:sqlite` module ships with it).

```bash
npm run setup
```

That installs both workspaces and seeds the database. Then start the two processes
in separate terminals:

```bash
npm run server
```

```bash
npm run client
```

Open **http://localhost:5173**. Vite proxies `/api` to the backend on port 4000.

### Demo accounts

| Role       | Email                  | Password   |
|------------|------------------------|------------|
| Admin      | `admin@dayflow.com`    | `Admin@123`|
| HR Officer | `hr@dayflow.com`       | `Hr@12345` |
| Employee   | `abu@dayflow.com`      | `Emp@1234` |
| Employee   | `priya@dayflow.com`    | `Emp@1234` |
| Employee   | `karthik@dayflow.com`  | `Emp@1234` |
| Employee   | `divya@dayflow.com`    | `Emp@1234` |

`npm run seed` resets the database to this state.

> Payslips appear only after payroll has been processed. Sign in as Admin →
> **Run Payroll** → pick a month → **Run Payroll**.

---

## Project structure

Files are grouped by **function**, one folder per feature module.

```
dayflow-hrms/
├── server/src/
│   ├── config/database.js               Schema, connection, default settings
│   ├── middleware/authentication.js     JWT verification, role guards
│   ├── utils/dateHelpers.js             Timezone-safe calendar-date helpers
│   ├── database/seed.js                 Demo data
│   ├── modules/
│   │   ├── authentication/authRoutes.js     Sign up, verify, sign in
│   │   ├── employees/employeeRoutes.js      Profiles, salary structure, leave balance
│   │   ├── departments/departmentRoutes.js  Department CRUD
│   │   ├── attendance/attendanceRoutes.js   Check-in/out, daily & weekly views
│   │   ├── leave/leaveRoutes.js             Apply, approve, reject
│   │   ├── payroll/payrollRoutes.js         Payroll runs, payslips
│   │   ├── analytics/analyticsRoutes.js     Reports and charts data
│   │   ├── settings/settingsRoutes.js       Company and policy configuration
│   │   └── dashboard/dashboardRoutes.js     Role-aware dashboard aggregation
│   └── server.js                        Express app and route mounting
│
└── client/src/
    ├── shared/
    │   ├── api/apiClient.js             fetch wrapper, JWT header, formatters
    │   ├── context/AuthContext.jsx      Auth state, session restore
    │   └── layout/AppLayout.jsx         Sidebar, top bar, role-aware navigation
    ├── features/
    │   ├── authentication/              LoginPage, SignupPage, VerifyPage
    │   ├── dashboard/                   DashboardPage
    │   ├── employees/                   EmployeeListPage, EmployeeDetailPage, ProfilePage
    │   ├── departments/                 DepartmentsPage
    │   ├── attendance/                  AttendancePage
    │   ├── leave/                       LeavePage
    │   ├── payroll/                     PayrollPage, PayslipListPage,
    │   │                                PayslipDocument, SalaryPage
    │   ├── analytics/                   AnalyticsPage
    │   └── settings/                    SettingsPage
    ├── styles/                          base, auth, forms, layout, components,
    │                                    profile, charts, payslip, print
    ├── App.jsx                          Role-gated routes
    └── main.jsx                         Entry point
```

### Database tables

`users`, `employees`, `departments`, `documents`, `salary_structure`,
`attendance`, `leaves`, `payroll`, `settings`

---

## Features

### Authentication & authorisation
- Sign up with Employee ID, email, password and role
- Password rules: 8+ characters with upper, lower and a digit
- Email verification required before first sign-in
- JWT sessions, bcrypt-hashed passwords, session restore on refresh
- Three roles: Admin, HR Officer, Employee

### Employee management
- Employee list with search across name, code, department and designation
- Admin creates employees (account created pre-verified)
- Field-level edit permissions: employees may change phone, address and photo;
  managers may change everything — **enforced server-side**
- Profile with personal details, job details, documents, salary and photo

### Department management
- Create, rename, assign a manager, delete
- Live headcount and monthly cost per department
- Deleting a department with employees still assigned is refused

### Attendance
- Check-in / check-out with worked-hours calculation
- Half-day derived automatically (under 4 hours)
- Daily and weekly views, Monday-anchored
- Statuses: present, absent, half-day, leave
- Managers can correct any record; employees see only their own

### Leave & time-off
- Apply with type (Paid / Sick / Unpaid), date range and remarks
- Overlapping requests are rejected
- Approve or reject with an HR comment
- Approval writes straight through to the attendance sheet
- Leave balance tracker with per-year quotas

### Payroll
- One-click monthly payroll run for the whole organisation
- **Attendance-driven**: absent days, half-days and approved *Unpaid* leave
  cost pay; approved Paid and Sick leave does not
- Gross, statutory deductions, loss of pay, net take-home
- Payroll history by period, mark as paid
- Salary structure editable per employee with live recalculation

### Payslips
- Professional payslip with company letterhead
- Full earnings and deductions breakdown, including loss of pay
- Print stylesheet — "Print / Save as PDF" produces a clean document
- Employees can only open their own payslip

### Analytics & reports
- Department-wise payroll cost and headcount
- Earnings and deductions component breakdown
- Top earners leaderboard
- Monthly payroll expense trend
- Attendance mix and leave statistics

### Settings
- Company name and address (printed on payslips)
- Leave quotas and working days per month
- Only a fixed allowlist of keys is writable

---

## Requirement traceability

| SRS  | Requirement                       | Implementation |
|------|-----------------------------------|----------------|
| 3.1.1 | Sign Up (Employee ID, email, password, role) | `modules/authentication/authRoutes.js` → `POST /api/auth/signup` |
| 3.1.1 | Password security rules           | `validatePassword()` |
| 3.1.1 | Email verification required       | `POST /api/auth/verify`; unverified logins refused |
| 3.1.2 | Sign In, error messages, redirect | `POST /api/auth/login`, `features/authentication/LoginPage.jsx` |
| 3.2.1 | Employee dashboard + quick actions| `features/dashboard/DashboardPage.jsx` |
| 3.2.2 | Admin dashboard, employee list    | Same file, manager branch |
| 3.3.1 | View profile (personal, job, salary, documents, picture) | `features/employees/ProfilePage.jsx` |
| 3.3.2 | Employee edits limited fields     | `EMPLOYEE_EDITABLE = phone, address, photo` |
| 3.3.2 | Admin edits all fields            | `MANAGER_EDITABLE`, `EmployeeDetailPage.jsx` |
| 3.4.1 | Check-in / check-out              | `POST /api/attendance/check-in`, `/check-out` |
| 3.4.1 | Statuses present/absent/half-day/leave | `STATUSES` in `attendanceRoutes.js` |
| 3.4.2 | Daily and weekly views            | `GET /api/attendance?view=daily\|weekly` |
| 3.4.2 | Employees see only their own      | `resolveEmployeeId()` |
| 3.5.1 | Apply for leave                   | `POST /api/leaves` |
| 3.5.2 | Approve/reject with comments      | `PUT /api/leaves/:id/approve` and `/reject` |
| 3.5.2 | "Changes reflect immediately"     | Approval writes `leave` rows into `attendance` |
| 3.6.1 | Payroll read-only for employees   | `features/payroll/SalaryPage.jsx`; no employee write route |
| 3.6.2 | Admin updates salary structure    | `PUT /api/employees/:id/salary` |
| §6    | Analytics & reports dashboard     | `modules/analytics/analyticsRoutes.js` |

---

## Notes on this build

- **Email verification is simulated.** There is no SMTP server, so sign-up returns
  the verification token and the app hands you to the verify screen. Wiring a real
  mailer means replacing that one response in `authRoutes.js`.
- **Payslip PDF** uses the browser's print-to-PDF via a dedicated print stylesheet,
  so the output matches the screen exactly without a PDF dependency.
- **Dates are timezone-safe.** `Date#toISOString()` converts to UTC first, which
  shifts the calendar day backwards in any zone ahead of UTC (IST included).
  `utils/dateHelpers.js` reads local date components instead, so weekly ranges and
  leave date spans stay correct.

## Possible next steps

- Email and push notification alerts
- Biometric or QR-based attendance capture
- Multi-company support
