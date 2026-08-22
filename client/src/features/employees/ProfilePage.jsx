import { useEffect, useState } from 'react';
import { api, money, prettyDate } from '../../shared/api/apiClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

function Info({ label, value }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span>{value || '—'}</span>
    </div>
  );
}

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
}

export default function Profile() {
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', photo: '' });
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/employees/${user.employeeId}`)
      .then((d) => {
        setEmp(d.employee);
        setForm({
          phone: d.employee.phone || '',
          address: d.employee.address || '',
          photo: d.employee.photo || '',
        });
      })
      .catch((e) => setMsg({ error: e.message, ok: '' }));
  }, [user.employeeId]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      const d = await api(`/employees/${user.employeeId}`, { method: 'PUT', body: form });
      setEmp(d.employee);
      setEditing(false);
      setMsg({ error: '', ok: 'Profile updated.' });
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  if (!emp) return <div className="empty">{msg.error || 'Loading…'}</div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const s = emp.salary;

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      <div className="card">
        <div className="card-body toolbar">
          <div className="avatar">
            {emp.photo
              ? <img src={emp.photo} alt="" className="avatar-img" />
              : initials(emp.name)}
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{emp.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              {emp.designation || '—'} · {emp.department || '—'} · Joined {prettyDate(emp.joinDate)}
            </div>
            <span className={`pill pill-${emp.status}`}>{emp.status}</span>
          </div>
          <div className="spacer" />
          {!editing && (
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>
      </div>

      {/* SRS 3.3.2 — employees may edit only phone, address and photo */}
      {editing && (
        <div className="card">
          <div className="card-head"><div className="card-title">Edit My Details</div></div>
          <form className="card-body" onSubmit={save}>
            <div className="grid grid-2">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="field">
                <label htmlFor="photo">Profile picture URL</label>
                <input id="photo" value={form.photo} onChange={set('photo')} placeholder="https://…" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="address">Address</label>
              <textarea id="address" value={form.address} onChange={set('address')} />
            </div>
            <div className="hint" style={{ marginBottom: 12 }}>
              Name, department, designation and salary are maintained by HR.
            </div>
            <div className="toolbar">
              <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Personal Details</div></div>
          <div className="card-body">
            <Info label="Employee ID" value={emp.empCode} />
            <Info label="Email" value={emp.email} />
            <Info label="Phone" value={emp.phone} />
            <Info label="Address" value={emp.address} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Job Details</div></div>
          <div className="card-body">
            <Info label="Department" value={emp.department} />
            <Info label="Designation" value={emp.designation} />
            <Info label="Date of Joining" value={prettyDate(emp.joinDate)} />
            <Info label="Status" value={emp.status} />
          </div>
        </div>

        {/* SRS 3.3.1 — documents */}
        <div className="card">
          <div className="card-head"><div className="card-title">Documents</div></div>
          <div className="card-body">
            {emp.documents.length === 0
              ? <div style={{ color: 'var(--muted)' }}>No documents on file.</div>
              : emp.documents.map((d) => (
                  <div className="row" key={d.id}>
                    <span>📄 {d.title}</span>
                    <span style={{ color: 'var(--muted)' }}>{prettyDate(d.uploaded_on)}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* SRS 3.6.1 — payroll is read-only for employees */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Salary Structure</div>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>Read-only</span>
          </div>
          <div className="card-body">
            {!s ? (
              <div style={{ color: 'var(--muted)' }}>No salary structure assigned.</div>
            ) : (
              <>
                <div className="row"><span className="row-label">Basic</span><span className="row-value">{money(s.basic)}</span></div>
                <div className="row"><span className="row-label">HRA</span><span className="row-value">{money(s.hra)}</span></div>
                <div className="row"><span className="row-label">DA</span><span className="row-value">{money(s.da)}</span></div>
                <div className="row"><span className="row-label">Travel Allowance</span><span className="row-value">{money(s.ta)}</span></div>
                <div className="row">
                  <span className="row-label">Gross</span>
                  <span className="row-value" style={{ color: 'var(--green)' }}>{money(s.gross)}</span>
                </div>
                <div className="row"><span className="row-label">PF</span><span className="row-value red">-{money(s.pf)}</span></div>
                <div className="row"><span className="row-label">ESI</span><span className="row-value red">-{money(s.esi)}</span></div>
                <div className="row"><span className="row-label">Income Tax</span><span className="row-value red">-{money(s.tax)}</span></div>
                <div className="net-box">
                  <span style={{ fontWeight: 700 }}>Net Take-Home</span>
                  <span className="net-value">{money(s.net)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
