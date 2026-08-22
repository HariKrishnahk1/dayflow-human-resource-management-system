# Entity–Relationship Diagram

Nine tables. `users` holds credentials, `employees` holds the HR record, and the
two are linked one-to-one so authentication stays separable from personnel data.

```mermaid
erDiagram
    USERS ||--o| EMPLOYEES : "has profile"
    DEPARTMENTS ||--o{ EMPLOYEES : "employs"
    EMPLOYEES ||--o| DEPARTMENTS : "manages"
    EMPLOYEES ||--o{ DOCUMENTS : "owns"
    EMPLOYEES ||--|| SALARY_STRUCTURE : "is paid by"
    EMPLOYEES ||--o{ ATTENDANCE : "records"
    EMPLOYEES ||--o{ LEAVES : "requests"
    EMPLOYEES ||--o{ PAYROLL : "is paid in"
    USERS ||--o{ LEAVES : "reviews"

    USERS {
        int  id PK
        text emp_code UK
        text email UK
        text password_hash
        text role "admin | hr | employee"
        int  verified
        text verify_token
        text created_at
    }

    DEPARTMENTS {
        int  id PK
        text name UK
        int  manager_id FK
        text created_at
    }

    EMPLOYEES {
        int  id PK
        int  user_id FK,UK
        text emp_code UK
        text name
        text email UK
        text phone
        text address
        int  dept_id FK
        text designation
        text join_date
        text status "active | inactive"
        text bank
        text photo
    }

    DOCUMENTS {
        int  id PK
        int  employee_id FK
        text title
        text kind
        text uploaded_on
    }

    SALARY_STRUCTURE {
        int  id PK
        int  employee_id FK,UK
        real basic
        real hra
        real da
        real ta
        real pf
        real esi
        real tax
        text effective_from
    }

    ATTENDANCE {
        int  id PK
        int  employee_id FK
        text date
        text check_in
        text check_out
        text status "present | absent | half-day | leave"
    }

    LEAVES {
        int  id PK
        int  employee_id FK
        text type "Paid | Sick | Unpaid"
        text from_date
        text to_date
        int  days
        text remarks
        text status "pending | approved | rejected"
        text admin_comment
        int  reviewed_by FK
        text applied_on
    }

    PAYROLL {
        int  id PK
        int  employee_id FK
        int  month
        int  year
        real gross
        real lop_days
        real lop_amount
        real total_deductions
        real net
        int  working_days
        real paid_days
        text status "processed | paid"
        text processed_on
    }

    SETTINGS {
        text key PK
        text value
    }
```

## Key constraints

| Constraint | Purpose |
|---|---|
| `attendance UNIQUE (employee_id, date)` | One attendance row per person per day |
| `payroll UNIQUE (employee_id, month, year)` | Re-running a month updates rather than duplicates |
| `salary_structure UNIQUE (employee_id)` | Exactly one active structure per employee |
| `users.role CHECK` | Only three valid roles |
| `attendance.status CHECK` | Only the four SRS statuses |
| `leaves.type CHECK` | Only Paid, Sick, Unpaid |
| `departments.manager_id ON DELETE SET NULL` | Removing a manager does not delete the department |
| `employees.dept_id ON DELETE SET NULL` | Employees survive a department being removed |
