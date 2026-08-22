import { useCallback, useEffect, useState } from 'react';
import { api, prettyDate, prettyTime } from '../../shared/api/apiClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

const todayISO = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function Attendance() {
  const { isManager } = useAuth();
  const [view, setView] = useState('weekly');
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState(null);
  const [today, setToday] = useState(null);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/attendance?view=${view}&date=${date}`);
      setData(d);
      if (!isManager) setToday((await api('/attendance/today')).attendance);
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    }
  }, [view, date, isManager]);

  useEffect(() => { load(); }, [load]);

  async function punch(kind) {
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      await api(`/attendance/${kind}`, { method: 'POST' });
      setMsg({ error: '', ok: kind === 'check-in' ? 'Checked in.' : 'Checked out.' });
      await load();
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    try {
      await api(`/attendance/${id}`, { method: 'PUT', body: { status } });
      await load();
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    }
  }

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      {/* SRS 3.4.1 — check-in / check-out */}
      {!isManager && (
        <div className="card">
          <div className="card-head"><div className="card-title">Today · {prettyDate(todayISO())}</div></div>
          <div className="card-body toolbar">
            <div>
              <div className="stat-label">Check In</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18 }}>{prettyTime(today?.checkIn)}</div>
            </div>
            <div>
              <div className="stat-label">Check Out</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18 }}>{prettyTime(today?.checkOut)}</div>
            </div>
            <div>
              <div className="stat-label">Status</div>
              <div>{today ? <span className={`pill pill-${today.status}`}>{today.status}</span> : '—'}</div>
            </div>
            <div className="spacer" />
            <button className="btn btn-green" disabled={busy || !!today?.checkIn} onClick={() => punch('check-in')}>
              Check In
            </button>
            <button className="btn" disabled={busy || !today?.checkIn || !!today?.checkOut} onClick={() => punch('check-out')}>
              Check Out
            </button>
          </div>
        </div>
      )}

      {/* SRS 3.4.2 — daily / weekly views */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">{isManager ? 'Organisation Attendance' : 'My Attendance'}</div>
          <div className="toolbar">
            <select value={view} onChange={(e) => setView(e.target.value)}
                    style={{ padding: '7px 10px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                   style={{ padding: '7px 10px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 }} />
          </div>
        </div>

        {data && (
          <>
            <div className="card-body toolbar" style={{ borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>
                {prettyDate(data.from)} – {prettyDate(data.to)}
              </span>
              <div className="spacer" />
              {Object.entries(data.summary).map(([k, v]) => (
                <span key={k} className={`pill pill-${k}`}>{k}: {v}</span>
              ))}
            </div>

            {data.records.length === 0 ? (
              <div className="empty">No attendance recorded for this period.</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      {isManager && <th>Employee</th>}
                      <th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th>
                      {isManager && <th>Correct</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((r) => (
                      <tr key={r.id}>
                        <td>{prettyDate(r.date)}</td>
                        {isManager && <td>{r.name} <span style={{ color: 'var(--muted)' }}>({r.empCode})</span></td>}
                        <td style={{ fontFamily: 'var(--mono)' }}>{prettyTime(r.checkIn)}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{prettyTime(r.checkOut)}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{r.hours ? `${r.hours}h` : '—'}</td>
                        <td><span className={`pill pill-${r.status}`}>{r.status}</span></td>
                        {isManager && (
                          <td>
                            <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}
                                    style={{ padding: '4px 8px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}>
                              {['present', 'absent', 'half-day', 'leave'].map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
