import { useEffect, useState } from 'react';
import { api } from '../../shared/api/apiClient.js';

const FIELDS = [
  ['company_name', 'Company name', 'text', 'Printed on every payslip'],
  ['company_address', 'Company address', 'text', 'Printed on every payslip'],
  ['currency', 'Currency code', 'text', 'ISO code, e.g. INR'],
  ['paid_leave_quota', 'Paid leave quota', 'number', 'Days per employee per year'],
  ['sick_leave_quota', 'Sick leave quota', 'number', 'Days per employee per year'],
  ['working_days_per_month', 'Working days per month', 'number', 'Divisor for a day of pay; 0 uses actual weekdays'],
];

export default function Settings() {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/settings')
      .then((d) => setForm(d.settings))
      .catch((e) => setMsg({ error: e.message, ok: '' }));
  }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      const body = FIELDS.reduce((acc, [k]) => ({ ...acc, [k]: form[k] }), {});
      const d = await api('/settings', { method: 'PUT', body });
      setForm(d.settings);
      setMsg({ error: '', ok: 'Settings saved.' });
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <div className="empty">{msg.error || 'Loading…'}</div>;

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      <div className="card">
        <div className="card-head"><div className="card-title">Company & Policy Settings</div></div>
        <form className="card-body" onSubmit={save}>
          <div className="grid grid-2">
            {FIELDS.map(([key, label, type, hint]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type={type}
                  min={type === 'number' ? '0' : undefined}
                  value={form[key] ?? ''}
                  onChange={(ev) => setForm({ ...form, [key]: ev.target.value })}
                />
                <div className="hint">{hint}</div>
              </div>
            ))}
          </div>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save Settings'}</button>
        </form>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">About</div></div>
        <div className="card-body">
          <div className="row"><span className="row-label">Application</span><span>Dayflow HRMS</span></div>
          <div className="row"><span className="row-label">Version</span><span>1.0.0</span></div>
          <div className="row"><span className="row-label">Stack</span><span>React · Express · SQLite</span></div>
          <div className="row"><span className="row-label">Leave types</span><span>Paid · Sick · Unpaid</span></div>
          <div className="row"><span className="row-label">Attendance statuses</span><span>Present · Absent · Half-day · Leave</span></div>
        </div>
      </div>
    </>
  );
}
