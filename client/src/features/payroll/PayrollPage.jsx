import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, prettyDate } from '../../shared/api/apiClient.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** SRS 3.6.2 — one-click monthly payroll processing for the whole organisation. */
export default function Payroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, per] = await Promise.all([
        api(`/payroll?month=${month}&year=${year}`),
        api('/payroll/periods'),
      ]);
      setData(p);
      setPeriods(per.periods);
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  async function run() {
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      const r = await api('/payroll/run', { method: 'POST', body: { month, year } });
      setMsg({ error: '', ok: r.message });
      await load();
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id) {
    setMsg({ error: '', ok: '' });
    try {
      await api(`/payroll/${id}/paid`, { method: 'PUT' });
      await load();
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <>
      {msg.error && <div className="alert alert-error">{msg.error}</div>}
      {msg.ok && <div className="alert alert-ok">{msg.ok}</div>}

      <div className="card">
        <div className="card-head"><div className="card-title">Run Monthly Payroll</div></div>
        <div className="card-body">
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="inline-select">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="inline-select">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-green" onClick={run} disabled={busy}>
              {busy ? 'Processing…' : `Run Payroll for ${MONTHS[month - 1]} ${year}`}
            </button>
          </div>
          <div className="hint">
            Salary is prorated against attendance: absent days and half-days lose pay, and so do
            days covered by approved <strong>Unpaid</strong> leave. Approved Paid and Sick leave is
            fully paid. Re-running a month recalculates it.
          </div>
        </div>
      </div>

      {data && data.payroll.length > 0 && (
        <div className="grid grid-stats" style={{ marginBottom: 18 }}>
          <div className="stat" style={{ '--stat': 'var(--accent)' }}>
            <div className="stat-label">Employees Processed</div>
            <div className="stat-value">{data.totals.count}</div>
          </div>
          <div className="stat" style={{ '--stat': 'var(--green)' }}>
            <div className="stat-label">Total Gross</div>
            <div className="stat-value">{money(data.totals.gross)}</div>
          </div>
          <div className="stat" style={{ '--stat': 'var(--red)' }}>
            <div className="stat-label">Total Deductions</div>
            <div className="stat-value">{money(data.totals.deductions)}</div>
          </div>
          <div className="stat" style={{ '--stat': 'var(--purple)' }}>
            <div className="stat-label">Total Net Payout</div>
            <div className="stat-value">{money(data.totals.net)}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="card-title">{MONTHS[month - 1]} {year} Payroll</div>
        </div>
        {!data ? (
          <div className="empty">Loading…</div>
        ) : data.payroll.length === 0 ? (
          <div className="empty">
            Payroll has not been processed for {MONTHS[month - 1]} {year} yet.
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Department</th><th>Gross</th>
                  <th>LOP</th><th>Deductions</th><th>Net Pay</th>
                  <th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.payroll.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name} <span style={{ color: 'var(--muted)' }}>({p.empCode})</span></td>
                    <td>{p.department || '—'}</td>
                    <td className="num">{money(p.gross)}</td>
                    <td className="num">
                      {p.lopDays > 0
                        ? <span className="pill pill-absent">{p.lopDays}d · {money(p.lopAmount)}</span>
                        : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td className="num red">-{money(p.totalDeductions)}</td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--green)' }}>{money(p.net)}</td>
                    <td><span className={`pill pill-${p.status === 'paid' ? 'approved' : 'pending'}`}>{p.status}</span></td>
                    <td>
                      <div className="toolbar">
                        <Link className="btn btn-ghost btn-sm" to={`/payslips/${p.employeeId}/${p.year}/${p.month}`}>
                          Payslip
                        </Link>
                        {p.status !== 'paid' && (
                          <button className="btn btn-sm" onClick={() => markPaid(p.id)}>Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Payroll History</div></div>
        {periods.length === 0 ? (
          <div className="empty">No payroll has been processed yet.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Period</th><th>Employees</th><th>Total Net</th><th></th></tr></thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={`${p.year}-${p.month}`}>
                    <td>{p.monthName} {p.year}</td>
                    <td>{p.employees}</td>
                    <td className="num">{money(p.net)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setMonth(p.month); setYear(p.year); }}
                      >
                        View
                      </button>
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
