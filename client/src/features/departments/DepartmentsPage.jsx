import { useCallback, useEffect, useState } from 'react';
import { api, money } from '../../shared/api/apiClient.js';

const BLANK = { name: '', managerId: '' };

export default function Departments() {
  const [departments, setDepartments] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([api('/departments'), api('/employees')]);
      setDepartments(d.departments);
      setEmployees(e.employees);
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      const body = { name: form.name, managerId: form.managerId || null };
      if (editingId) {
        await api(`/departments/${editingId}`, { method: 'PUT', body });
        setMsg({ error: '', ok: 'Department updated.' });
      } else {
        await api('/departments', { method: 'POST', body });
        setMsg({ error: '', ok: 'Department created.' });
      }
      setForm(BLANK);
      setEditingId(null);
      await load();
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(dept) {
    setMsg({ error: '', ok: '' });
    try {
      await api(`/departments/${dept.id}`, { method: 'DELETE' });
      setMsg({ error: '', ok: `${dept.name} deleted.` });
      await load();
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    }
  }

  function startEdit(d) {
    setEditingId(d.id);
    setForm({ name: d.name, managerId: d.managerId || '' });
  }

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      <div className="card">
        <div className="card-head">
          <div className="card-title">{editingId ? 'Edit Department' : 'Add Department'}</div>
          {editingId && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(null); setForm(BLANK); }}>
              Cancel edit
            </button>
          )}
        </div>
        <form className="card-body" onSubmit={submit}>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="name">Department name</label>
              <input id="name" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="managerId">Manager</label>
              <select id="managerId" value={form.managerId}
                      onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <option value="">— none —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.empCode})</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Update Department' : 'Add Department'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Departments</div></div>
        {!departments ? (
          <div className="empty">Loading…</div>
        ) : departments.length === 0 ? (
          <div className="empty">No departments yet.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Department</th><th>Manager</th><th>Headcount</th><th>Monthly Cost</th><th></th></tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.manager ? `${d.manager.name} (${d.manager.empCode})` : '—'}</td>
                    <td>{d.headcount}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{money(d.monthlyCost)}</td>
                    <td>
                      <div className="toolbar">
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(d)}>Edit</button>
                        <button className="btn btn-red btn-sm" onClick={() => remove(d)}>Delete</button>
                      </div>
                    </td>
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
