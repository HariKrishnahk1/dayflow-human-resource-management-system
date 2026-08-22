# Test Plan

Test cases covering each functional requirement. Every case below was executed
against the running API; the *Result* column records what actually happened.

**Environment:** Node 22.17, SQLite via `node:sqlite`, seeded demo database.

---

## TC-01 Authentication

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-01.1 | Valid sign-in | POST `/auth/login` with `admin@dayflow.com` / `Admin@123` | 200 + JWT | ✅ Pass |
| TC-01.2 | Wrong password | Same email, password `wrong` | 401 "Incorrect email or password" | ✅ Pass |
| TC-01.3 | Unknown email | Nonexistent address | Same message as TC-01.2, so accounts cannot be probed | ✅ Pass |
| TC-01.4 | Weak password on sign-up | `password: "abc"` | 400 "Password must be at least 8 characters" | ✅ Pass |
| TC-01.5 | Sign-up succeeds | Valid Employee ID, email, password, role | 201 + verification token | ✅ Pass |
| TC-01.6 | Login before verification | Sign in as the new account | 403 "Please verify your email address" | ✅ Pass |
| TC-01.7 | Verify email | POST `/auth/verify` with the token | 200, `verified = 1` | ✅ Pass |
| TC-01.8 | Login after verification | Sign in again | 200 + JWT | ✅ Pass |
| TC-01.9 | Reuse verification token | POST the same token twice | 400 "invalid or already used" | ✅ Pass |
| TC-01.10 | Duplicate Employee ID | Sign up with an existing code | 409 "already registered" | ✅ Pass |
| TC-01.11 | No token | GET `/employees` with no header | 401 "Authentication required" | ✅ Pass |
| TC-01.12 | Tampered token | `Authorization: Bearer not.a.real.token` | 401 "Session expired or invalid" | ✅ Pass |

## TC-02 Authorisation

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-02.1 | Employee lists all staff | GET `/employees` as employee | 403 "Requires Admin or HR Officer" | ✅ Pass |
| TC-02.2 | Employee reads another profile | GET `/employees/4` as employee #3 | 403 "only view your own profile" | ✅ Pass |
| TC-02.3 | Employee opens another payslip | GET another employee's payslip | 403 "only view your own payslip" | ✅ Pass |
| TC-02.4 | Employee opens analytics | GET `/analytics` as employee | 403 | ✅ Pass |
| TC-02.5 | Employee approves own leave | PUT `/leaves/:id/approve` as employee | 403 | ✅ Pass |
| TC-02.6 | HR Officer has manager rights | GET `/dashboard` as `hr@dayflow.com` | 200, sees all employees | ✅ Pass |

## TC-03 Profile management

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-03.1 | Employee edits allowed fields | PUT own `phone` and `address` | 200, values saved | ✅ Pass |
| TC-03.2 | Employee edits restricted field | PUT own `designation` | 403 naming the editable fields | ✅ Pass |
| TC-03.3 | Admin edits any field | PUT another employee's `designation` | 200, value saved | ✅ Pass |
| TC-03.4 | Admin adds employee | POST `/employees` with valid data | 201, login works immediately | ✅ Pass |

## TC-04 Attendance

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-04.1 | Check in | POST `/attendance/check-in` | 201, status `present` | ✅ Pass |
| TC-04.2 | Duplicate check-in | Check in twice | 409 "Already checked in today at HH:MM:SS" | ✅ Pass |
| TC-04.3 | Check out | POST `/attendance/check-out` | 200, `check_out` recorded | ✅ Pass |
| TC-04.4 | Short day is half-day | Check out under 4 hours after check-in | status becomes `half-day` | ✅ Pass |
| TC-04.5 | Check out without check-in | Check out on a fresh day | 409 "You have not checked in today" | ✅ Pass |
| TC-04.6 | Weekly view is Monday-anchored | GET `?view=weekly&date=2026-08-22` (a Saturday) | Range 2026-08-17 to 2026-08-23 | ✅ Pass |
| TC-04.7 | Employee scope | GET `/attendance` as employee | Only own records | ✅ Pass |
| TC-04.8 | Manager scope | GET `/attendance` as admin | All employees' records | ✅ Pass |
| TC-04.9 | Invalid status rejected | PUT a status outside the four | 400 listing valid statuses | ✅ Pass |

## TC-05 Leave management

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-05.1 | Apply for leave | POST valid Paid leave, 3 days | 201, status `pending`, `days = 3` | ✅ Pass |
| TC-05.2 | Overlapping request | Apply again over the same dates | 409 "already have a leave request covering part of those dates" | ✅ Pass |
| TC-05.3 | Invalid type | `type: "Casual"` | 400 "must be one of: Paid, Sick, Unpaid" | ✅ Pass |
| TC-05.4 | End before start | `to` earlier than `from` | 400 | ✅ Pass |
| TC-05.5 | Approve with comment | PUT `/approve` with a comment | 200, status `approved`, comment stored | ✅ Pass |
| TC-05.6 | Write-through to attendance | Check attendance for the approved range | All days show `leave` | ✅ Pass |
| TC-05.7 | Decide twice | PUT `/reject` on an approved request | 409 "already approved" | ✅ Pass |
| TC-05.8 | Leave balance | GET `/employees/:id/leave-balance` | Quota, used and remaining per type | ✅ Pass |

## TC-06 Departments

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-06.1 | Create | POST `{ name: "Marketing" }` | 201 | ✅ Pass |
| TC-06.2 | Duplicate name | POST `{ name: "marketing" }` | 409, case-insensitive match | ✅ Pass |
| TC-06.3 | Delete with staff assigned | DELETE Engineering | 409 "2 employees are still assigned" | ✅ Pass |
| TC-06.4 | Delete empty department | DELETE Marketing | 200 | ✅ Pass |
| TC-06.5 | Headcount and cost | GET `/departments` | Live totals per department | ✅ Pass |

## TC-07 Payroll

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-07.1 | Run payroll | POST `{ month: 7, year: 2026 }` | 201, 6 employees processed | ✅ Pass |
| TC-07.2 | LOP from absence | Employee with 2 absent days | `lop_days = 2`, pay reduced | ✅ Pass |
| TC-07.3 | Half-day counts half | Employee with a half-day | `lop_days` includes 0.5 | ✅ Pass |
| TC-07.4 | Paid leave is not deducted | Approved Paid/Sick leave in the month | No LOP for those days | ✅ Pass |
| TC-07.5 | Unpaid leave is deducted | Approved Unpaid leave in the month | LOP applied | ✅ Pass |
| TC-07.6 | Re-run is idempotent | Run the same month twice | Row updated, not duplicated | ✅ Pass |
| TC-07.7 | Invalid month | `month: 13` | 400 | ✅ Pass |
| TC-07.8 | Net arithmetic | Abu, July 2026 | 71,400 − 17,171 = 54,229 | ✅ Pass |

## TC-08 Payslips

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-08.1 | Own payslip | GET own payslip | 200 with company, employee and figures | ✅ Pass |
| TC-08.2 | Unprocessed period | GET a month never run | 404 "No payslip exists for that period yet" | ✅ Pass |
| TC-08.3 | LOP line appears | Payslip for a month with LOP | "Loss of Pay (2 days)" line shown | ✅ Pass |
| TC-08.4 | Print layout | Print preview | Sidebar and buttons hidden, payslip only | ✅ Pass |

## TC-09 Settings

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-09.1 | Update allowed key | PUT `paid_leave_quota: "15"` | 200, value saved | ✅ Pass |
| TC-09.2 | Unknown key rejected | PUT `admin_password: "hack"` | 400 "Not a configurable setting" | ✅ Pass |
| TC-09.3 | Negative number rejected | PUT a negative quota | 400 | ✅ Pass |

## TC-10 Analytics

| ID | Test case | Steps | Expected | Result |
|---|---|---|---|---|
| TC-10.1 | Department cost | GET `/analytics` | Cost and headcount per department | ✅ Pass |
| TC-10.2 | Top earners | Same response | Five highest net salaries, descending | ✅ Pass |
| TC-10.3 | Expense trend | After a payroll run | Processed month appears | ✅ Pass |
| TC-10.4 | Empty trend | Before any run | Chart shows a prompt, not an error | ✅ Pass |

---

## Regression notes

Two defects were found and fixed during development. Both have permanent test coverage above.

| Defect | Symptom | Fix | Covered by |
|---|---|---|---|
| Timezone date shift | `toISOString()` converts to UTC first, so in IST local midnight formatted as the previous day. Weekly view returned 16–22 Aug instead of 17–23; leave approval would have marked the wrong attendance dates. | `backend/utils/dateHelpers.js` reads local date components | TC-04.6, TC-05.6 |
| Database path after refactor | Moving the connection module one level deeper made `'..'` resolve inside the source tree, writing `dayflow.db` into `src/` | Path resolved from the module location to the project root | Startup check |
