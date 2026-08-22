/**
 * Dayflow HRMS relational schema.
 *
 * Nine tables: users, departments, employees, documents, salary_structure,
 * attendance, leaves, payroll, settings. Every statement is idempotent, so
 * applySchema() is safe to run on every boot.
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_code      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','hr','employee')),
  verified      INTEGER NOT NULL DEFAULT 0,
  verify_token  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE NOT NULL,
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  emp_code    TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  dept_id     INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  designation TEXT DEFAULT '',
  join_date   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  bank        TEXT DEFAULT '',
  photo       TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS documents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  kind        TEXT DEFAULT 'other',
  uploaded_on TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS salary_structure (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id    INTEGER UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  basic          REAL NOT NULL DEFAULT 0,
  hra            REAL NOT NULL DEFAULT 0,
  da             REAL NOT NULL DEFAULT 0,
  ta             REAL NOT NULL DEFAULT 0,
  pf             REAL NOT NULL DEFAULT 0,
  esi            REAL NOT NULL DEFAULT 0,
  tax            REAL NOT NULL DEFAULT 0,
  effective_from TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  check_in    TEXT,
  check_out   TEXT,
  status      TEXT NOT NULL DEFAULT 'present'
                CHECK (status IN ('present','absent','half-day','leave')),
  UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS leaves (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('Paid','Sick','Unpaid')),
  from_date     TEXT NOT NULL,
  to_date       TEXT NOT NULL,
  days          INTEGER NOT NULL,
  remarks       TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  admin_comment TEXT DEFAULT '',
  reviewed_by   INTEGER REFERENCES users(id),
  applied_on    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One processed payroll row per employee per month.
CREATE TABLE IF NOT EXISTS payroll (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id      INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month            INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INTEGER NOT NULL,
  basic            REAL NOT NULL DEFAULT 0,
  hra              REAL NOT NULL DEFAULT 0,
  da               REAL NOT NULL DEFAULT 0,
  ta               REAL NOT NULL DEFAULT 0,
  gross            REAL NOT NULL DEFAULT 0,
  pf               REAL NOT NULL DEFAULT 0,
  esi              REAL NOT NULL DEFAULT 0,
  tax              REAL NOT NULL DEFAULT 0,
  lop_days         REAL NOT NULL DEFAULT 0,
  lop_amount       REAL NOT NULL DEFAULT 0,
  total_deductions REAL NOT NULL DEFAULT 0,
  net              REAL NOT NULL DEFAULT 0,
  working_days     INTEGER NOT NULL DEFAULT 0,
  paid_days        REAL NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'processed'
                     CHECK (status IN ('processed','paid')),
  processed_on     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (employee_id, month, year)
);

-- Key/value store for company-wide configuration.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_att_emp_date   ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_emp      ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status   ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(year, month);
CREATE INDEX IF NOT EXISTS idx_emp_dept       ON employees(dept_id);
`;

export function applySchema(db) {
  db.exec(SCHEMA_SQL);
}
