# Use Case Diagram

Two actor classes, per SRS section 2: **Admin / HR Officer** and **Employee**.

```mermaid
flowchart LR
    subgraph Actors
        ADMIN([Admin / HR Officer])
        EMP([Employee])
    end

    subgraph Authentication
        UC1[Sign Up]
        UC2[Verify Email]
        UC3[Sign In]
    end

    subgraph Profile
        UC4[View Own Profile]
        UC5[Edit Limited Fields]
        UC6[Edit Any Employee]
        UC7[Add Employee]
    end

    subgraph Attendance
        UC8[Check In / Check Out]
        UC9[View Own Attendance]
        UC10[View All Attendance]
        UC11[Correct Attendance]
    end

    subgraph Leave
        UC12[Apply for Leave]
        UC13[View Leave Balance]
        UC14[Approve / Reject Leave]
    end

    subgraph Payroll
        UC15[View Own Salary]
        UC16[View Own Payslip]
        UC17[Update Salary Structure]
        UC18[Run Monthly Payroll]
        UC19[View All Payslips]
    end

    subgraph Administration
        UC20[Manage Departments]
        UC21[View Analytics]
        UC22[Configure Settings]
    end

    EMP --> UC1
    EMP --> UC2
    EMP --> UC3
    EMP --> UC4
    EMP --> UC5
    EMP --> UC8
    EMP --> UC9
    EMP --> UC12
    EMP --> UC13
    EMP --> UC15
    EMP --> UC16

    ADMIN --> UC3
    ADMIN --> UC6
    ADMIN --> UC7
    ADMIN --> UC10
    ADMIN --> UC11
    ADMIN --> UC14
    ADMIN --> UC17
    ADMIN --> UC18
    ADMIN --> UC19
    ADMIN --> UC20
    ADMIN --> UC21
    ADMIN --> UC22
```

## Permission matrix

| Use case | Admin | HR Officer | Employee |
|---|:---:|:---:|:---:|
| Sign up / verify email | — | — | ✅ |
| Sign in | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Edit phone / address / photo | ✅ | ✅ | ✅ |
| Edit any employee field | ✅ | ✅ | ❌ |
| Add employee | ✅ | ✅ | ❌ |
| Check in / check out | ✅ | ✅ | ✅ |
| View own attendance | ✅ | ✅ | ✅ |
| View all attendance | ✅ | ✅ | ❌ |
| Correct attendance status | ✅ | ✅ | ❌ |
| Apply for leave | ✅ | ✅ | ✅ |
| Approve / reject leave | ✅ | ✅ | ❌ |
| View own salary and payslip | ✅ | ✅ | ✅ |
| Update salary structure | ✅ | ✅ | ❌ |
| Run monthly payroll | ✅ | ✅ | ❌ |
| View all payslips | ✅ | ✅ | ❌ |
| Manage departments | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ❌ |
| Configure settings | ✅ | ✅ | ❌ |
