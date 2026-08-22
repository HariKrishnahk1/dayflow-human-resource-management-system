import { useCallback, useEffect, useState } from 'react';
import { api, prettyDate } from '../../shared/api/apiClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

const TYPES = ['Paid', 'Sick', 'Unpaid'];

export default function Leaves() {
  const { isManager, user } = useAuth();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [form, setForm] = useState({ type: 'Paid', from: '', to: '', remarks: '' });
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState({});
  const [balance, setBalance] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api(`/leaves${filter ? `?status=${filter}` : ''}`));
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isManager || !user.employeeId) return;
    api(`/employees/${user.employeeId}/leave-balance`)
      .then((d) => setBalance(d.balance))
      .catch(() => {});
  }, [isManager, user.employeeId, data]);

  async function apply(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      await api('/leaves', { method: 'POST', body: form });
      setMsg({ error: '', ok: 'Leave request submitted.' });
      setForm({ type: 'Paid', from: '', to: '', remarks: '' });
      await load();
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  async function decide(id, decision) {
    setMsg({ error: '', ok: '' });
    try {
      await api(`/leaves/${id}/${decision}`, { method: 'PUT', body: { comment: comments[id] || '' } });
      setMsg({ error: '', ok: `Request ${decision === 'approve' ? 'approved' : 'rejected'}.` });
      await load();
    } catch (err) {
      setMsg({ error: err.message, ok: '' });
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      {/* Leave balance tracker */}
      {!isManager && balance && (
        <div className="grid grid-stats" style={{ marginBottom: 18 }}>
          {['Paid', 'Sick'].map((t) => (
            <div className="stat" key={t} style={{ '--stat': t === 'Paid' ? 'var(--green)' : 'var(--amber)' }}>
              <div className="stat-label">{t} Leave Balance</div>
              <div className="stat-value">{balance[t].remaining}</div>
              <div className="stat-sub">{balance[t].used} of {balance[t].quota} days used in {balance.year}</div>
            </div>
          ))}
          <div className="stat" style={{ '--stat': 'var(--purple)' }}>
            <div className="stat-label">Unpaid Leave Taken</div>
            <div className="stat-value">{balance.Unpaid.used}</div>
            <div className="stat-sub">days in {balance.year}</div>
          </div>
        </div>
      )}

      {/* SRS 3.5.1 — apply for leave */}
      {!isManager && (
        <div className="card">
          <div className="card-head"><div className="card-title">Apply for Time-Off</div></div>
          <form className="card-body" onSubmit={apply}>
            <div className="grid grid-2">
              <div className="field">
                <label htmlFor="type">Leave type</label>
                <select id="type" value={form.type} onChange={set('type')}>
                  {TYPES.map((t) => <option key={t} value={t}>{t} Leave</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="from">From</label>
                <input id="from" type="date" value={form.from} onChange={set('from')} required />
              </div>
              <div className="field">
                <label htmlFor="to">To</label>
                <input id="to" type="date" value={form.to} onChange={set('to')} required />
              </div>
              <div className="field">
                <label htmlFor="remarks">Remarks</label>
                <input id="remarks" value={form.remarks} onChange={set('remarks')} placeholder="Reason for leave" />
              </div>
            </div>
            <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit Request'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">{isManager ? 'All Leave Requests' : 'My Requests'}</div>
          <div className="toolbar">
            {data && (
              <>
                <span className="pill pill-pending">pending: {data.summary.pending}</span>
                <span className="pill pill-approved">approved: {data.summary.approved}</span>
                <span className="pill pill-rejected">rejected: {data.summary.rejected}</span>
              </>
            )}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
                    style={{ padding: '7px 10px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {!data ? (
          <div className="empty">Loading…</div>
        ) : data.leaves.length === 0 ? (
          <div className="empty">No leave requests to show.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {isManager && <th>Employee</th>}
                  <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Remarks</th><th>Status</th>
                  {isManager && <th style={{ minWidth: 250 }}>Decision</th>}
                  {!isManager && <th>HR Comment</th>}
                </tr>
              </thead>
              <tbody>
                {data.leaves.map((l) => (
                  <tr key={l.id}>
                    {isManager && <td>{l.name} <span style={{ color: 'var(--muted)' }}>({l.empCode})</span></td>}
                    <td>{l.type}</td>
                    <td>{prettyDate(l.from)}</td>
                    <td>{prettyDate(l.to)}</td>
                    <td>{l.days}</td>
                    <td style={{ color: 'var(--muted)' }}>{l.remarks || '—'}</td>
                    <td><span className={`pill pill-${l.status}`}>{l.status}</span></td>

                    {/* SRS 3.5.2 — approve / reject with a comment */}
                    {isManager && (
                      <td>
                        {l.status === 'pending' ? (
                          <div className="toolbar">
                            <input
                              placeholder="Comment (optional)"
                              value={comments[l.id] || ''}
                              onChange={(e) => setComments({ ...comments, [l.id]: e.target.value })}
                              style={{ flex: 1, minWidth: 110, padding: '5px 8px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                            />
                            <button className="btn btn-green btn-sm" onClick={() => decide(l.id, 'approve')}>Approve</button>
                            <button className="btn btn-red btn-sm" onClick={() => decide(l.id, 'reject')}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>{l.adminComment || '—'}</span>
                        )}
                      </td>
                    )}
                    {!isManager && <td style={{ color: 'var(--muted)' }}>{l.adminComment || '—'}</td>}
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
