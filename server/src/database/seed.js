import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { toISODate as iso } from '../utils/dateHelpers.js';

// Wipe and rebuild, so `npm run seed` is repeatable.
db.exec(`DELETE FROM payroll; DELETE FROM attendance; DELETE FROM leaves; DELETE FROM documents;
         DELETE FROM salary_structure; DELETE FROM employees; DELETE FROM departments;
         DELETE FROM users;`);
// Reset AUTOINCREMENT so a reseed always yields the same ids.
db.exec(`DELETE FROM sqlite_sequence WHERE name IN
         ('users','employees','documents','salary_structure','attendance','leaves',
          'departments','payroll')`);

const hash = (pw) => bcrypt.hashSync(pw, 10);

const DEPARTMENTS = ['Human Resources', 'Engineering', 'Finance', 'Sales'];

const PEOPLE = [
  { code: 'DF001', name: 'Aarthi Rajan',     email: 'admin@dayflow.com',   role: 'admin',    dept: 'Human Resources', desig: 'HR Director',        pw: 'Admin@123' },
  { code: 'DF002', name: 'Vikram Shankar',   email: 'hr@dayflow.com',      role: 'hr',       dept: 'Human Resources', desig: 'HR Officer',         pw: 'Hr@12345'  },
  { code: 'DF003', name: 'Abubakkar Siddiq', email: 'abu@dayflow.com',     role: 'employee', dept: 'Engineering',     desig: 'Software Engineer',  pw: 'Emp@1234'  },
  { code: 'DF004', name: 'Priya Menon',      email: 'priya@dayflow.com',   role: 'employee', dept: 'Engineering',     desig: 'QA Engineer',        pw: 'Emp@1234'  },
  { code: 'DF005', name: 'Karthik Raman',    email: 'karthik@dayflow.com', role: 'employee', dept: 'Finance',         desig: 'Accounts Executive', pw: 'Emp@1234'  },
  { code: 'DF006', name: 'Divya Iyer',       email: 'divya@dayflow.com',   role: 'employee', dept: 'Sales',           desig: 'Sales Executive',    pw: 'Emp@1234'  },
];

const SALARIES = {
  DF001: { basic: 65000, hra: 26000, da: 13000, ta: 6000, pf: 7800, esi: 1300, tax: 9500 },
  DF002: { basic: 48000, hra: 19200, da: 9600,  ta: 4800, pf: 5760, esi: 960,  tax: 6200 },
  DF003: { basic: 42000, hra: 16800, da: 8400,  ta: 4200, pf: 5040, esi: 840,  tax: 4800 },
  DF004: { basic: 38000, hra: 15200, da: 7600,  ta: 3800, pf: 4560, esi: 760,  tax: 3900 },
  DF005: { basic: 35000, hra: 14000, da: 7000,  ta: 3500, pf: 4200, esi: 700,  tax: 3200 },
  DF006: { basic: 31000, hra: 12400, da: 6200,  ta: 3100, pf: 3720, esi: 620,  tax: 2400 },
};

const insertDept = db.prepare('INSERT INTO departments (name) VALUES (?)');
const deptIds = {};
for (const name of DEPARTMENTS) deptIds[name] = insertDept.run(name).lastInsertRowid;

const insertUser = db.prepare(
  `INSERT INTO users (emp_code, email, password_hash, role, verified) VALUES (?, ?, ?, ?, 1)`
);
const insertEmp = db.prepare(
  `INSERT INTO employees (user_id, emp_code, name, email, phone, address, dept_id, designation, join_date, status, bank)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
);
const insertSalary = db.prepare(
  `INSERT INTO salary_structure (employee_id, basic, hra, da, ta, pf, esi, tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertAttendance = db.prepare(
  `INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)`
);
const insertLeave = db.prepare(
  `INSERT INTO leaves (employee_id, type, from_date, to_date, days, remarks, status, admin_comment)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertDoc = db.prepare(`INSERT INTO documents (employee_id, title, kind) VALUES (?, ?, ?)`);

const empIds = {};

for (const [i, p] of PEOPLE.entries()) {
  const userId = insertUser.run(p.code, p.email, hash(p.pw), p.role).lastInsertRowid;
  const empId = insertEmp.run(
    userId, p.code, p.name, p.email,
    `+91 98${String(40000000 + i * 111111).slice(0, 8)}`,
    `${12 + i} Anna Salai, Chennai`,
    deptIds[p.dept], p.desig, `202${i % 4}-0${(i % 9) + 1}-15`,
    `HDFC ****${4200 + i}`
  ).lastInsertRowid;
  empIds[p.code] = empId;

  const s = SALARIES[p.code];
  insertSalary.run(empId, s.basic, s.hra, s.da, s.ta, s.pf, s.esi, s.tax);

  insertDoc.run(empId, 'Offer Letter', 'contract');
  insertDoc.run(empId, 'PAN Card', 'identity');
}

// Department managers
db.prepare('UPDATE departments SET manager_id = ? WHERE name = ?').run(empIds.DF001, 'Human Resources');
db.prepare('UPDATE departments SET manager_id = ? WHERE name = ?').run(empIds.DF003, 'Engineering');
db.prepare('UPDATE departments SET manager_id = ? WHERE name = ?').run(empIds.DF005, 'Finance');

// ~13 weeks of attendance for everyone, weekdays only.
const statusFor = (i) => (i % 17 === 0 ? 'absent' : i % 11 === 0 ? 'half-day' : i % 13 === 0 ? 'leave' : 'present');
let counter = 0;

for (const code of Object.keys(empIds)) {
  for (let back = 92; back >= 0; back--) {
    const d = new Date();
    d.setDate(d.getDate() - back);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends

    const status = statusFor(counter++);
    const checkIn = status === 'absent' || status === 'leave' ? null : status === 'half-day' ? '09:15:00' : '09:05:00';
    const checkOut = status === 'absent' || status === 'leave' ? null : status === 'half-day' ? '12:40:00' : '18:10:00';
    insertAttendance.run(empIds[code], iso(d), checkIn, checkOut, status);
  }
}

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return iso(d);
};

insertLeave.run(empIds.DF003, 'Paid',   day(6),   day(8),   3, 'Family function', 'pending',  '');
insertLeave.run(empIds.DF004, 'Sick',   day(-9),  day(-8),  2, 'Fever',           'approved', 'Get well soon.');
insertLeave.run(empIds.DF005, 'Unpaid', day(-20), day(-19), 2, 'Personal work',   'approved', 'Approved as unpaid.');
insertLeave.run(empIds.DF006, 'Unpaid', day(-30), day(-30), 1, 'Personal work',   'rejected', 'Short notice.');
insertLeave.run(empIds.DF003, 'Sick',   day(-3),  day(-3),  1, 'Migraine',        'pending',  '');

// Mark the approved unpaid leave onto the attendance sheet, as an approval would.
const markLeave = db.prepare(
  `INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, 'leave')
   ON CONFLICT(employee_id, date) DO UPDATE SET status = 'leave', check_in = NULL, check_out = NULL`
);
markLeave.run(empIds.DF005, day(-20));
markLeave.run(empIds.DF005, day(-19));
markLeave.run(empIds.DF004, day(-9));
markLeave.run(empIds.DF004, day(-8));

console.log('Seeded Dayflow HRMS\n');
console.log(`  ${DEPARTMENTS.length} departments, ${PEOPLE.length} employees, ~13 weeks of attendance\n`);
console.log('  Role      Email                  Password');
console.log('  --------  ---------------------  ---------');
for (const p of PEOPLE) {
  console.log(`  ${p.role.padEnd(8)}  ${p.email.padEnd(21)}  ${p.pw}`);
}
console.log('\n  Run payroll from the Payroll page to generate payslips.');
