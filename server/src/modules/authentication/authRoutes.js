import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../../config/database.js';
import { signToken, requireAuth } from '../../middleware/authentication.js';

const router = express.Router();

/** SRS 3.1.1 - "Password must follow security rules." */
export function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain a number';
  return null;
}

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function publicUser(user, employee) {
  return {
    id: user.id,
    empCode: user.emp_code,
    email: user.email,
    role: user.role,
    verified: !!user.verified,
    employeeId: employee ? employee.id : null,
    name: employee ? employee.name : user.email,
  };
}

// POST /api/auth/signup - SRS 3.1.1
router.post('/signup', (req, res) => {
  const { empCode, email, password, role, name } = req.body || {};

  if (!empCode || !String(empCode).trim()) return res.status(400).json({ error: 'Employee ID is required' });
  if (!isEmail(email)) return res.status(400).json({ error: 'A valid email address is required' });
  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ error: pwError });
  if (!['employee', 'hr'].includes(role)) return res.status(400).json({ error: 'Role must be Employee or HR' });

  const code = String(empCode).trim().toUpperCase();
  const mail = String(email).trim().toLowerCase();

  if (db.prepare('SELECT 1 FROM users WHERE emp_code = ?').get(code)) {
    return res.status(409).json({ error: 'That Employee ID is already registered' });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(mail)) {
    return res.status(409).json({ error: 'That email is already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const verifyToken = crypto.randomBytes(24).toString('hex');

  const userId = db.prepare(
    `INSERT INTO users (emp_code, email, password_hash, role, verified, verify_token)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(code, mail, hash, role, verifyToken).lastInsertRowid;

  db.prepare(
    `INSERT INTO employees (user_id, emp_code, name, email, join_date)
     VALUES (?, ?, ?, ?, date('now'))`
  ).run(userId, code, (name && String(name).trim()) || code, mail);

  // No SMTP in this build: the verification link is returned so it can be followed locally.
  console.log(`[dayflow] verification token for ${mail}: ${verifyToken}`);
  res.status(201).json({
    message: 'Account created. Verify your email address to sign in.',
    verifyToken,
    verifyUrl: `/verify?token=${verifyToken}`,
  });
});

// POST /api/auth/verify - SRS 3.1.1 "Email verification is required."
router.post('/verify', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Verification token is required' });

  const user = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(String(token));
  if (!user) return res.status(400).json({ error: 'That verification link is invalid or already used' });

  db.prepare('UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?').run(user.id);
  res.json({ message: 'Email verified. You can sign in now.' });
});

// POST /api/auth/login - SRS 3.1.2
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  // Same message for unknown email and wrong password, so neither can be probed.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  if (!user.verified) {
    return res.status(403).json({ error: 'Please verify your email address before signing in' });
  }

  const employee = db.prepare('SELECT * FROM employees WHERE user_id = ?').get(user.id);
  res.json({ token: signToken(user), user: publicUser(user, employee) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user, req.employee) });
});

export default router;
