# API Reference

Base URL: `http://localhost:4000/api`

All routes except `/auth/*` and `/health` require a bearer token:

```
Authorization: Bearer <jwt>
```

**Roles** — `admin` and `hr` both count as *Manager*. `employee` is restricted to
their own records. Authorisation is enforced server-side on every route.

---

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Liveness check |

---

## Authentication — `backend/modules/authentication/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | none | Register. Body: `empCode`, `name`, `email`, `password`, `role` |
| POST | `/auth/verify` | none | Verify email. Body: `token` |
| POST | `/auth/login` | none | Sign in. Body: `email`, `password`. Returns JWT |
| GET | `/auth/me` | any | Current user |

**Password rules:** at least 8 characters, containing an uppercase letter, a
lowercase letter and a digit.

**Errors:** `409` duplicate Employee ID or email · `403` unverified account ·
`401` wrong credentials (same message for unknown email, so accounts cannot be probed).

---

## Employees — `backend/modules/employees/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/employees?search=` | Manager | List, searchable by name, code, department, designation |
| POST | `/employees` | Manager | Create employee and their login (pre-verified) |
| GET | `/employees/:id` | Self or Manager | Full profile with salary, documents, leave balance |
| PUT | `/employees/:id` | Self or Manager | Update. Employees limited to `phone`, `address`, `photo` |
| PUT | `/employees/:id/salary` | Manager | Set salary structure |
| GET | `/employees/:id/leave-balance` | Self or Manager | Quota, used and remaining per leave type |

An employee sending a disallowed field receives `403` naming the fields they may change.

---

## Departments — `backend/modules/departments/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/departments` | any | List with headcount and monthly cost |
| POST | `/departments` | Manager | Create. Body: `name`, `managerId` |
| PUT | `/departments/:id` | Manager | Rename or reassign manager |
| DELETE | `/departments/:id` | Manager | Delete — refused while employees are assigned |

---

## Attendance — `backend/modules/attendance/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/attendance/check-in` | any | Record today's check-in |
| POST | `/attendance/check-out` | any | Record check-out; under 4 hours becomes half-day |
| GET | `/attendance/today` | any | Today's own record |
| GET | `/attendance?view=&date=&from=&to=&employeeId=` | any | `view` is `daily` or `weekly`; employees see only themselves |
| PUT | `/attendance/:id` | Manager | Correct a status |
| POST | `/attendance/mark` | Manager | Mark a date for an employee |

Statuses: `present`, `absent`, `half-day`, `leave`. Weeks are Monday-anchored.

---

## Leave — `backend/modules/leave/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/leaves` | any | Apply. Body: `type`, `from`, `to`, `remarks` |
| GET | `/leaves?status=&employeeId=` | any | Employees see their own; managers see everyone |
| PUT | `/leaves/:id/approve` | Manager | Approve with optional `comment` |
| PUT | `/leaves/:id/reject` | Manager | Reject with optional `comment` |

Types: `Paid`, `Sick`, `Unpaid`. Overlapping requests return `409`.
Approval writes `leave` rows into `attendance` for the whole range.

---

## Payroll — `backend/modules/payroll/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payroll/run` | Manager | Process a month. Body: `month`, `year` |
| GET | `/payroll?month=&year=&employeeId=` | any | Payroll rows with totals |
| GET | `/payroll/periods` | Manager | Which months have been processed |
| GET | `/payroll/payslip/:employeeId/:year/:month` | Self or Manager | Full payslip document |
| PUT | `/payroll/:id/paid` | Manager | Mark a run as paid |

Re-running a month recalculates it rather than duplicating rows.

---

## Analytics — `backend/modules/analytics/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics` | Manager | Department cost, headcount, component split, top earners, expense trend, attendance mix, leave stats |

---

## Settings — `backend/modules/settings/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/settings` | any | Current configuration |
| PUT | `/settings` | Manager | Update. Only allowlisted keys accepted |

Writable keys: `company_name`, `company_address`, `currency`,
`paid_leave_quota`, `sick_leave_quota`, `working_days_per_month`.

---

## Dashboard — `backend/modules/dashboard/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | any | Role-aware payload — managers get org stats, employees get their own |

---

## Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation failure |
| 401 | Missing, invalid or expired token |
| 403 | Authenticated but not permitted |
| 404 | Not found |
| 409 | Conflict — duplicate, overlap, or already-decided state |
| 500 | Server error |
