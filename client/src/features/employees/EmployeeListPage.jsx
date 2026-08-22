import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../shared/api/apiClient.js';

const BLANK = {
  empCode: '', name: '', email: '', password: '', role: 'employee',
  deptId: '', designation: '', phone: '', joinDate: '', bank: '',
};

/** SRS 3.2.2 — the admin/HR employee list, with search and employee creation. */
export default function Employees() {
  const [employees, setEmployees] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/employees?search=${encodeURIComponent(search)}`);
      setEmployees(d.employees);
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    }
  }, [search]);

  // Debounce so each keystroke does not fire a request.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api('/departments').then((d) => setDepartments(d.departments)).catch(() => {});
  }, []);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      const d = await api('/employees', { method: 'POST', body: form });
      setMsg({ error: '', ok: `${d.employee.name} added.` });
      setForm(BLANK);
      setAdding(false);
      await load();
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      {adding && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Add New Employee</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setForm(BLANK); }}>
              Cancel
            </button>
          </div>
          <form className="card-body" onSubmit={create}>
            <div className="grid grid-2">
              <div className="field">
                <label htmlFor="empCode">Employee ID</label>
                <input id="empCode" value={form.empCode} onChange={set('empCode')} placeholder="DF007" required />
              </div>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="field">
                <label htmlFor="password">Temporary password</label>
                <input id="password" value={form.password} onChange={set('password')} required />
                <div className="hint">8+ characters, with upper, lower and a number.</div>
              </div>
              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" value={form.role} onChange={set('role')}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="deptId">Department</label>
                <select id="deptId" value={form.deptId} onChange={set('deptId')}>
                  <option value="">— unassigned —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="designation">Designation</label>
                <input id="designation" value={form.designation} onChange={set('designation')} />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="field">
                <label htmlFor="joinDate">Date of joining</label>
                <input id="joinDate" type="date" value={form.joinDate} onChange={set('joinDate')} />
              </div>
              <div className="field">
                <label htmlFor="bank">Bank account</label>
                <input id="bank" value={form.bank} onChange={set('bank')} placeholder="HDFC ****1234" />
              </div>
            </div>
            <div className="hint" style={{ marginBottom: 12 }}>
              The account is created pre-verified, so the employee can sign in straight away.
              Set their salary structure from the employee page afterwards.
            </div>
            <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create Employee'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">All Employees</div>
          <div className="toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, department…"
              className="search-input"
            />
            {!adding && <button className="btn" onClick={() => setAdding(true)}>+ Add Employee</button>}
          </div>
        </div>

        {!employees ? (
          <div className="empty">Loading…</div>
        ) : employees.length === 0 ? (
          <div className="empty">No employees match that search.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Name</th><th>Department</th>
                  <th>Designation</th><th>Role</th><th>Net Salary</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'var(--mono)' }}>{e.empCode}</td>
                    <td>{e.name}</td>
                    <td>{e.department || '—'}</td>
                    <td>{e.designation || '—'}</td>
                    <td><span className={`badge badge-${e.role}`}>{e.role === 'hr' ? 'HR' : e.role}</span></td>
                    <td className="num">{e.salary ? money(e.salary.net) : '—'}</td>
                    <td><span className={`pill pill-${e.status}`}>{e.status}</span></td>
                    <td><Link to={`/employees/${e.id}`} className="btn btn-ghost btn-sm">Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
