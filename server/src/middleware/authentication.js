import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'dayflow-dev-secret-change-in-production';
const TOKEN_TTL = '8h';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, empCode: user.emp_code },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

/** Attaches req.user (the users row) and req.employee (their employees row, if any). */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });

  req.user = user;
  req.employee = db.prepare('SELECT * FROM employees WHERE user_id = ?').get(user.id) || null;
  next();
}

/** Admin and HR Officer both hold management privileges (SRS section 2). */
export const isManager = (user) => user.role === 'admin' || user.role === 'hr';

export function requireManager(req, res, next) {
  if (!isManager(req.user)) {
    return res.status(403).json({ error: 'Requires Admin or HR Officer privileges' });
  }
  next();
}

/**
 * Employees may only reach their own records; managers may reach anyone's.
 * Returns the employee id to operate on, or null if the caller is not allowed.
 */
export function resolveEmployeeId(req, requested) {
  if (requested == null || requested === '') {
    return req.employee ? req.employee.id : null;
  }
  const id = Number(requested);
  if (!Number.isInteger(id)) return null;
  if (isManager(req.user)) return id;
  return req.employee && req.employee.id === id ? id : null;
}
