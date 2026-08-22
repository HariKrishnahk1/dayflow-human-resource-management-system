import { useEffect, useState } from 'react';
import { api, money } from '../../shared/api/apiClient.js';

/** Horizontal bars — proportions read accurately without a charting library. */
function BarChart({ rows, colors }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="bars">
      {rows.map((r, i) => (
        <div className="bar-row" key={r.label}>
          <div className="bar-label" title={r.label}>{r.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max((r.value / max) * 100, 1.5)}%`,
                background: colors[i % colors.length],
              }}
            />
          </div>
          <div className="bar-value">{r.display ?? money(r.value)}</div>
        </div>
      ))}
    </div>
  );
}

const EARNING_COLORS = ['#4f8ef7', '#3ecf8e', '#a855f7', '#f5a623'];
const DEDUCTION_COLORS = ['#f2555a', '#f5a623', '#a855f7'];
const DEPT_COLORS = ['#4f8ef7', '#3ecf8e', '#a855f7', '#f5a623', '#f2555a', '#38bdf8'];

export default function Analytics() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics').then(setD).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!d) return <div className="empty">Loading analytics…</div>;

  const totalCost = d.byDepartment.reduce((a, x) => a + x.net, 0);
  const attendanceTotal = d.attendanceMix.reduce((a, x) => a + x.n, 0) || 1;

  return (
    <>
      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <div className="stat" style={{ '--stat': 'var(--accent)' }}>
          <div className="stat-label">Headcount</div>
          <div className="stat-value">{d.headcount.active}</div>
          <div className="stat-sub">{d.headcount.total} on record</div>
        </div>
        <div className="stat" style={{ '--stat': 'var(--green)' }}>
          <div className="stat-label">Monthly Payroll Cost</div>
          <div className="stat-value">{money(totalCost)}</div>
          <div className="stat-sub">Total net pay</div>
        </div>
        <div className="stat" style={{ '--stat': 'var(--purple)' }}>
          <div className="stat-label">Departments</div>
          <div className="stat-value">{d.byDepartment.length}</div>
        </div>
        <div className="stat" style={{ '--stat': 'var(--amber)' }}>
          <div className="stat-label">Avg Cost / Employee</div>
          <div className="stat-value">
            {money(d.headcount.active ? totalCost / d.headcount.active : 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Department-wise Payroll Cost</div></div>
          <div className="card-body">
            <BarChart
              rows={d.byDepartment.map((x) => ({ label: x.department, value: x.net }))}
              colors={DEPT_COLORS}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Headcount by Department</div></div>
          <div className="card-body">
            <BarChart
              rows={d.byDepartment.map((x) => ({
                label: x.department, value: x.headcount, display: `${x.headcount}`,
              }))}
              colors={DEPT_COLORS}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Earnings Breakdown</div></div>
          <div className="card-body">
            <BarChart rows={d.components.earnings} colors={EARNING_COLORS} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Deductions Breakdown</div></div>
          <div className="card-body">
            <BarChart rows={d.components.deductions} colors={DEDUCTION_COLORS} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Top Earners</div></div>
        {d.topEarners.length === 0 ? (
          <div className="empty">No salary structures assigned yet.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Designation</th><th>Department</th><th>Net Salary</th></tr>
              </thead>
              <tbody>
                {d.topEarners.map((t, i) => (
                  <tr key={t.empCode}>
                    <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                    <td>{t.name} <span style={{ color: 'var(--muted)' }}>({t.empCode})</span></td>
                    <td>{t.designation || '—'}</td>
                    <td>{t.department}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{money(t.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Monthly Payroll Expense</div></div>
          <div className="card-body">
            {d.trend.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>
                No payroll has been processed yet. Run payroll to populate this chart.
              </div>
            ) : (
              <BarChart
                rows={d.trend.map((t) => ({ label: t.label, value: t.net }))}
                colors={['#4f8ef7']}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Attendance Mix (this week)</div></div>
          <div className="card-body">
            {d.attendanceMix.length === 0 ? (
              <div style={{ color: 'var(--muted)' }}>No attendance recorded this week.</div>
            ) : (
              <BarChart
                rows={d.attendanceMix.map((a) => ({
                  label: a.status,
                  value: a.n,
                  display: `${a.n} (${Math.round((a.n / attendanceTotal) * 100)}%)`,
                }))}
                colors={DEPT_COLORS}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Leave Statistics ({new Date().getFullYear()})</div></div>
        {d.leaveStats.length === 0 ? (
          <div className="empty">No leave requests this year.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Type</th><th>Status</th><th>Requests</th><th>Total Days</th></tr></thead>
              <tbody>
                {d.leaveStats.map((l) => (
                  <tr key={`${l.type}-${l.status}`}>
                    <td>{l.type}</td>
                    <td><span className={`pill pill-${l.status}`}>{l.status}</span></td>
                    <td>{l.requests}</td>
                    <td>{l.days}</td>
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
