import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money, prettyDate } from '../../shared/api/apiClient.js';

const PROFILE_FIELDS = [
  ['name', 'Full name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['department', 'Department'],
  ['designation', 'Designation'],
  ['join_date', 'Date of joining'],
];

const SALARY_FIELDS = [
  ['basic', 'Basic Pay'],
  ['hra', 'HRA'],
  ['da', 'Dearness Allowance'],
  ['ta', 'Travel Allowance'],
  ['pf', 'PF Deduction'],
  ['esi', 'ESI Deduction'],
  ['tax', 'Income Tax'],
];

/** SRS 3.3.2 (admin edits all fields) and 3.6.2 (admin payroll control). */
export default function EmployeeDetail() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [profile, setProfile] = useState({});
  const [salary, setSalary] = useState({});
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState('');

  function hydrate(e) {
    setEmp(e);
    setProfile({
      name: e.name || '', email: e.email || '', phone: e.phone || '',
      address: e.address || '', department: e.department || '',
      designation: e.designation || '', join_date: e.joinDate || '', status: e.status || 'active',
    });
    setSalary(
      SALARY_FIELDS.reduce((acc, [k]) => ({ ...acc, [k]: e.salary ? e.salary[k] : 0 }), {})
    );
  }

  useEffect(() => {
    api(`/employees/${id}`)
      .then((d) => hydrate(d.employee))
      .catch((e) => setMsg({ error: e.message, ok: '' }));
  }, [id]);

  async function saveProfile(e) {
    e.preventDefault();
    setBusy('profile');
    setMsg({ error: '', ok: '' });
    try {
      const d = await api(`/employees/${id}`, { method: 'PUT', body: profile });
      hydrate(d.employee);
      setMsg({ error: '', ok: 'Employee details saved.' });
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy('');
    }
  }

  async function saveSalary(e) {
    e.preventDefault();
    setBusy('salary');
    setMsg({ error: '', ok: '' });
    try {
      await api(`/employees/${id}/salary`, { method: 'PUT', body: salary });
      const d = await api(`/employees/${id}`);
      hydrate(d.employee);
      setMsg({ error: '', ok: 'Salary structure updated.' });
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy('');
    }
  }

  if (!emp) return <div className="empty">{msg.error || 'Loading…'}</div>;

  const gross = SALARY_FIELDS.slice(0, 4).reduce((sum, [k]) => sum + Number(salary[k] || 0), 0);
  const cuts = SALARY_FIELDS.slice(4).reduce((sum, [k]) => sum + Number(salary[k] || 0), 0);

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      <div className="card">
        <div className="card-body toolbar">
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{emp.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              {emp.empCode} · {emp.designation || '—'} · Joined {prettyDate(emp.joinDate)}
            </div>
          </div>
          <div className="spacer" />
          <Link to="/employees" className="btn btn-ghost btn-sm">← Back to list</Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Employee Details</div></div>
          <form className="card-body" onSubmit={saveProfile}>
            {PROFILE_FIELDS.map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type={key === 'join_date' ? 'date' : 'text'}
                  value={profile[key] ?? ''}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                value={profile.address ?? ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={profile.status}
                onChange={(e) => setProfile({ ...profile, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="btn" disabled={busy === 'profile'}>
              {busy === 'profile' ? 'Saving…' : 'Save Details'}
            </button>
          </form>
        </div>

        {/* SRS 3.6.2 — admin updates the salary structure */}
        <div className="card">
          <div className="card-head"><div className="card-title">Salary Structure</div></div>
          <form className="card-body" onSubmit={saveSalary}>
            {SALARY_FIELDS.map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type="number"
                  min="0"
                  step="1"
                  value={salary[key] ?? 0}
                  onChange={(e) => setSalary({ ...salary, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="row">
              <span className="row-label">Gross</span>
              <span className="row-value" style={{ color: 'var(--green)' }}>{money(gross)}</span>
            </div>
            <div className="row">
              <span className="row-label">Total Deductions</span>
              <span className="row-value red">-{money(cuts)}</span>
            </div>
            <div className="net-box">
              <span style={{ fontWeight: 700 }}>Net Take-Home</span>
              <span className="net-value">{money(gross - cuts)}</span>
            </div>

            <button className="btn" style={{ marginTop: 14 }} disabled={busy === 'salary'}>
              {busy === 'salary' ? 'Saving…' : 'Update Salary'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
