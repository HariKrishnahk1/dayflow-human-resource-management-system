import express from 'express';
import { db, getSettings } from '../../../database/index.js';
import { requireAuth, requireManager } from '../../middleware/authentication.js';

const router = express.Router();
router.use(requireAuth);

/** Only these keys may be written, so the UI cannot invent configuration. */
const EDITABLE = [
  'company_name',
  'company_address',
  'currency',
  'paid_leave_quota',
  'sick_leave_quota',
  'working_days_per_month',
];

const NUMERIC = ['paid_leave_quota', 'sick_leave_quota', 'working_days_per_month'];

// GET /api/settings
router.get('/', (req, res) => res.json({ settings: getSettings(), editable: EDITABLE }));

// PUT /api/settings
router.put('/', requireManager, (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body).filter((k) => EDITABLE.includes(k));
  const rejected = Object.keys(body).filter((k) => !EDITABLE.includes(k));

  if (rejected.length) {
    return res.status(400).json({ error: `Not a configurable setting: ${rejected.join(', ')}` });
  }
  if (!keys.length) return res.status(400).json({ error: 'No settings supplied' });

  for (const k of keys) {
    if (NUMERIC.includes(k)) {
      const v = Number(body[k]);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: `${k} must be a non-negative number` });
    }
    if (!NUMERIC.includes(k) && !String(body[k]).trim()) {
      return res.status(400).json({ error: `${k} cannot be empty` });
    }
  }

  const put = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  for (const k of keys) put.run(k, String(body[k]));

  res.json({ settings: getSettings() });
});

export default router;
