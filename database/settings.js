/** Company-wide configuration seeded once; existing values are never overwritten. */
export const DEFAULT_SETTINGS = {
  company_name: 'Dayflow Technologies Pvt Ltd',
  company_address: '4th Floor, Anna Salai, Chennai 600002',
  currency: 'INR',
  paid_leave_quota: '12',
  sick_leave_quota: '12',
  working_days_per_month: '22',
};

export function applyDefaultSettings(db) {
  const put = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) put.run(key, value);
}

export function readSettings(db) {
  return db.prepare('SELECT key, value FROM settings').all()
    .reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
}
