# Software Requirements Specification

**Dayflow — Human Resource Management System**
*Every workday, perfectly aligned.*

---

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements of a Human
Resource Management System (HRMS). The system digitises and streamlines core HR
operations: employee onboarding, profile management, attendance tracking, leave
management, payroll visibility, and approval workflows for admins and HR officers.

### 1.2 Scope

The HRMS provides:

- Secure authentication (Sign Up / Sign In)
- Role-based access (Admin vs Employee)
- Employee profile management
- Attendance tracking (daily / weekly view)
- Leave and time-off management
- Approval workflows for HR / Admin

### 1.3 Definitions and abbreviations

| Term | Meaning |
|---|---|
| Admin / HR Officer | User with management and approval privileges |
| Employee | Regular user with limited access |
| Time-Off | Paid leave, sick leave, unpaid leave, etc. |
| LOP | Loss of Pay — salary deducted for unpaid absence |
| HRMS | Human Resource Management System |

---

## 2. User classes and characteristics

| User type | Description |
|---|---|
| Admin / HR Officer | Manages employees, approves leave and attendance, views payroll details |
| Employee | Views personal profile and attendance, applies for leave, views salary details |

In the implementation, `admin` and `hr` both carry management privileges;
`employee` is restricted to their own records.

---

## 3. Functional requirements

### 3.1 Authentication and authorisation

#### 3.1.1 Sign Up

- Users register with Employee ID, Email, Password and Role (Employee / HR)
- Password must follow security rules — minimum 8 characters, containing an
  uppercase letter, a lowercase letter and a digit
- Email verification is required before the account can sign in

#### 3.1.2 Sign In

- Users log in with email and password
- Incorrect credentials display an error message
- Unknown email and wrong password return the same message, so neither can be probed
- Successful login redirects to the dashboard

### 3.2 Dashboard

#### 3.2.1 Employee dashboard

- Quick-access cards: Profile, Attendance, Leave Requests, Salary
- Today's attendance status and the current week's summary
- Recent activity and alerts

#### 3.2.2 Admin / HR dashboard

- Employee list
- Attendance records for the day
- Pending leave approvals
- Payroll totals and last processed run

### 3.3 Employee profile management

#### 3.3.1 View profile

Employees can view personal details, job details, salary structure, documents
and profile picture.

#### 3.3.2 Edit profile

- Employees may edit a limited set of fields: address, phone, profile picture
- Admin may edit all employee details
- The restriction is enforced on the server, not only hidden in the interface

### 3.4 Attendance management

#### 3.4.1 Attendance tracking

- Daily and weekly attendance views
- Check-in / check-out for employees
- Status types: Present, Absent, Half-day, Leave
- A working day shorter than four hours is recorded as Half-day

#### 3.4.2 Attendance view

- Employees can view only their own attendance
- Admin / HR can view attendance of all employees and correct any record

### 3.5 Leave and time-off management

#### 3.5.1 Apply for leave (Employee)

- Select leave type: Paid, Sick, Unpaid
- Choose a date range and add remarks
- Request status: Pending, Approved, Rejected
- Requests overlapping an existing pending or approved request are rejected

#### 3.5.2 Leave approval (Admin / HR)

- View all leave requests
- Approve or reject, with a comment
- Changes reflect immediately in employee records — an approved leave writes
  `leave` rows straight into the attendance sheet

### 3.6 Payroll / salary management

#### 3.6.1 Employee payroll view

Payroll data is read-only for employees.

#### 3.6.2 Admin payroll control

- View payroll of all employees
- Update salary structure
- Process monthly payroll, prorated against attendance
- Ensure payroll accuracy

---

## 4. Non-functional requirements

| Category | Requirement |
|---|---|
| Security | Passwords stored as bcrypt hashes; sessions carried as signed JWTs |
| Authorisation | Enforced server-side on every route, not in the client |
| Usability | Responsive layout down to mobile widths |
| Reliability | Foreign keys and CHECK constraints prevent invalid states |
| Portability | SQLite file database — no server to install |
| Correctness | Calendar dates handled in local time, so week ranges and leave spans do not shift by a day in timezones ahead of UTC |

---

## 5. External interface requirements

- **User interface** — browser-based single-page application
- **API** — JSON over HTTP, `Authorization: Bearer <jwt>`
- **Database** — SQLite via the built-in `node:sqlite` module

---

## 6. Future enhancements

- Email and notification alerts
- Analytics and reports dashboard (salary slips, attendance reports) — *implemented*
- Biometric or QR-based attendance capture
- Mobile application
- Multi-company support
