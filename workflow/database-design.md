# Database Design

SQLite, accessed through Node's built-in `node:sqlite` module. The file lives at
the project root as `dayflow.db` and is created automatically on first boot.

Defined in `database/schema.js`; connection in `database/connection.js`;
defaults in `database/settings.js`; demo data in `database/seed.js`.

---

## users

Credentials only — personnel data lives in `employees`.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| emp_code | TEXT | Unique, not null |
| email | TEXT | Unique, not null |
| password_hash | TEXT | bcrypt, cost 10 |
| role | TEXT | CHECK: `admin`, `hr`, `employee` |
| verified | INTEGER | 0 until the email is verified |
| verify_token | TEXT | Cleared once used |
| created_at | TEXT | Defaults to now |

## departments

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| name | TEXT | Unique, not null |
| manager_id | INTEGER | FK → employees, ON DELETE SET NULL |
| created_at | TEXT | Defaults to today |

## employees

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| user_id | INTEGER | FK → users, unique, ON DELETE CASCADE |
| emp_code | TEXT | Unique |
| name | TEXT | Not null |
| email | TEXT | Unique |
| phone | TEXT | Employee-editable |
| address | TEXT | Employee-editable |
| dept_id | INTEGER | FK → departments, ON DELETE SET NULL |
| designation | TEXT | Manager-only |
| join_date | TEXT | ISO date |
| status | TEXT | `active` or `inactive` |
| bank | TEXT | Shown on the payslip |
| photo | TEXT | Image URL, employee-editable |

## documents

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK → employees, ON DELETE CASCADE |
| title | TEXT | e.g. "Offer Letter" |
| kind | TEXT | `contract`, `identity`, `other` |
| uploaded_on | TEXT | Defaults to today |

## salary_structure

One row per employee — the current structure.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK, **unique** |
| basic, hra, da, ta | REAL | Earnings |
| pf, esi, tax | REAL | Statutory deductions |
| effective_from | TEXT | Set on each update |

`gross = basic + hra + da + ta` · `net = gross − (pf + esi + tax)`

## attendance

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK, ON DELETE CASCADE |
| date | TEXT | ISO date |
| check_in | TEXT | `HH:MM:SS`, null when absent or on leave |
| check_out | TEXT | `HH:MM:SS` |
| status | TEXT | CHECK: `present`, `absent`, `half-day`, `leave` |

**UNIQUE (employee_id, date)** — one row per person per day, so check-in and
leave approval can both upsert safely.

## leaves

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK, ON DELETE CASCADE |
| type | TEXT | CHECK: `Paid`, `Sick`, `Unpaid` |
| from_date, to_date | TEXT | Inclusive range |
| days | INTEGER | Inclusive day count |
| remarks | TEXT | Employee's reason |
| status | TEXT | CHECK: `pending`, `approved`, `rejected` |
| admin_comment | TEXT | HR's note on the decision |
| reviewed_by | INTEGER | FK → users |
| applied_on | TEXT | Defaults to now |

## payroll

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK |
| employee_id | INTEGER | FK, ON DELETE CASCADE |
| month, year | INTEGER | month CHECK 1–12 |
| basic, hra, da, ta | REAL | Snapshot at processing time |
| gross | REAL | Sum of earnings |
| pf, esi, tax | REAL | Statutory deductions |
| lop_days | REAL | Days lost; half-days count 0.5 |
| lop_amount | REAL | `per-day × lop_days`, rounded |
| total_deductions | REAL | Statutory + LOP |
| net | REAL | `gross − total_deductions`, floored at 0 |
| working_days | INTEGER | Divisor used |
| paid_days | REAL | `working_days − lop_days` |
| status | TEXT | CHECK: `processed`, `paid` |
| processed_on | TEXT | Defaults to now |

**UNIQUE (employee_id, month, year)** — re-running a month updates in place.

Values are snapshotted rather than joined, so a later salary revision does not
silently rewrite historic payslips.

## settings

| Column | Type | Notes |
|---|---|---|
| key | TEXT | PK |
| value | TEXT | Stored as text, cast on read |

---

## Indexes

| Index | Columns | Serves |
|---|---|---|
| idx_att_emp_date | attendance(employee_id, date) | Daily and weekly lookups |
| idx_leave_emp | leaves(employee_id) | An employee's leave history |
| idx_leave_status | leaves(status) | Pending-approval queue |
| idx_payroll_period | payroll(year, month) | Payroll runs and history |
| idx_emp_dept | employees(dept_id) | Department headcount and cost |

## Seed data

`npm run seed` resets to 4 departments, 6 employees, roughly 13 weeks of weekday
attendance, and 5 leave requests across all three statuses. AUTOINCREMENT counters
are reset, so ids are identical on every reseed.
