# Process Flows

The four multi-step processes in Dayflow, as they are actually implemented.

---

## 1. Registration and email verification

```mermaid
sequenceDiagram
    actor U as New user
    participant UI as Frontend
    participant API as Backend
    participant DB as Database

    U->>UI: Fill sign-up form
    UI->>API: POST /api/auth/signup
    API->>API: Validate password rules
    API->>DB: Check emp_code / email are free
    alt Already registered
        API-->>UI: 409 Conflict
    else Available
        API->>API: bcrypt hash password
        API->>DB: INSERT users (verified = 0)
        API->>DB: INSERT employees
        API-->>UI: 201 + verification token
        UI->>U: Redirect to verify screen
        U->>UI: Submit token
        UI->>API: POST /api/auth/verify
        API->>DB: SET verified = 1, clear token
        API-->>UI: Verified
    end

    U->>UI: Sign in
    UI->>API: POST /api/auth/login
    API->>DB: Look up user
    alt Not verified
        API-->>UI: 403 "Verify your email first"
    else Verified and password matches
        API-->>UI: 200 + JWT
    end
```

> This build has no SMTP server, so the token is returned in the response and the
> app hands the user to the verification screen. In production the token would
> arrive as an emailed link.

---

## 2. Attendance check-in and check-out

```mermaid
flowchart TD
    A[Employee opens Attendance] --> B{Checked in today?}
    B -- No --> C[Press Check In]
    C --> D[INSERT attendance<br/>check_in = now, status = present]
    D --> E[Check In disabled]
    B -- Yes --> E
    E --> F{Checked out?}
    F -- No --> G[Press Check Out]
    G --> H[Compute hours worked]
    H --> I{Hours less than 4?}
    I -- Yes --> J[status = half-day]
    I -- No --> K[status = present]
    J --> L[Row updated]
    K --> L
    F -- Yes --> M[Both buttons disabled]
```

Guards: a second check-in returns `409 Already checked in today at HH:MM:SS`, and
checking out without checking in returns `409 You have not checked in today`.

---

## 3. Leave approval, with write-through to attendance

This is the process SRS 3.5.2 describes as *"changes reflect immediately in
employee records"*.

```mermaid
sequenceDiagram
    actor E as Employee
    actor H as Admin / HR
    participant API as Backend
    participant DB as Database

    E->>API: POST /api/leaves (type, from, to, remarks)
    API->>API: Validate type and date range
    API->>DB: Check for overlapping requests
    alt Overlaps existing request
        API-->>E: 409 Conflict
    else Clear
        API->>DB: INSERT leaves (status = pending)
        API-->>E: 201 Created
    end

    H->>API: PUT /api/leaves/:id/approve (comment)
    API->>DB: Verify still pending
    alt Already decided
        API-->>H: 409 "Already approved/rejected"
    else Pending
        API->>DB: UPDATE leaves SET status = approved
        loop Every date in range
            API->>DB: UPSERT attendance SET status = 'leave'
        end
        API-->>H: 200 Updated
    end

    Note over DB: Attendance now shows 'leave'<br/>for the whole approved range
```

---

## 4. Monthly payroll processing

Payroll is prorated against attendance. This is what makes the run meaningful
rather than a fixed multiplication.

```mermaid
flowchart TD
    A[Admin picks month and year] --> B[POST /api/payroll/run]
    B --> C[Load active employees<br/>having a salary structure]
    C --> D{Any found?}
    D -- No --> E[400: nothing to process]
    D -- Yes --> F[For each employee]

    F --> G[Gross = basic + hra + da + ta]
    F --> H[Read attendance for the month]

    H --> I{Status of each day}
    I -- absent --> J[LOP + 1.0]
    I -- half-day --> K[LOP + 0.5]
    I -- leave --> L{Covered by approved<br/>Unpaid leave?}
    L -- Yes --> M[LOP + 1.0]
    L -- No --> N[Fully paid]
    I -- present --> N

    J --> O[Total LOP days]
    K --> O
    M --> O
    N --> O

    O --> P[Per-day = gross / working days]
    P --> Q[LOP amount = per-day × LOP days]
    Q --> R[Deductions = PF + ESI + Tax + LOP amount]
    R --> S[Net = gross − deductions]
    S --> T[UPSERT payroll row]
    T --> U[Payslip becomes available]
```

### Worked example

Abubakkar Siddiq, July 2026 — 22 working days, 2 days lost:

| Line | Amount |
|---|---:|
| Basic | ₹42,000 |
| HRA | ₹16,800 |
| DA | ₹8,400 |
| TA | ₹4,200 |
| **Gross** | **₹71,400** |
| PF | −₹5,040 |
| ESI | −₹840 |
| Income Tax | −₹4,800 |
| Loss of Pay (2 days @ ₹3,245.45) | −₹6,491 |
| **Total deductions** | **−₹17,171** |
| **Net take-home** | **₹54,229** |

Per-day rate = 71,400 ÷ 22 = ₹3,245.45. Two days lost = ₹6,491 (rounded).
