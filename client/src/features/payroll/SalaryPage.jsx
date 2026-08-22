import { useEffect, useState } from 'react';
import { api, money, prettyDate } from '../../shared/api/apiClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

/** SRS 3.6.1 — "Payroll data is read-only for employees." */
export default function MySalary() {
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/employees/${user.employeeId}`)
      .then((d) => setEmp(d.employee))
      .catch((e) => setError(e.message));
  }, [user.employeeId]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!emp) return <div className="empty">Loading…</div>;
  if (!emp.salary) return <div className="empty">No salary structure has been assigned to you yet.</div>;

  const s = emp.salary;
  const earnings = [
    ['Basic Pay', s.basic],
    ['House Rent Allowance', s.hra],
    ['Dearness Allowance', s.da],
    ['Travel Allowance', s.ta],
  ];
  const deductions = [
    ['Provident Fund', s.pf],
    ['ESI', s.esi],
    ['Income Tax', s.tax],
  ];

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Salary Details — {emp.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            {emp.empCode} · effective from {prettyDate(s.effectiveFrom)}
          </div>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>Read-only · maintained by HR</span>
      </div>

      <div className="card-body grid grid-2">
        <div>
          <div className="stat-label" style={{ marginBottom: 8 }}>Earnings</div>
          {earnings.map(([label, value]) => (
            <div className="row" key={label}>
              <span className="row-label">{label}</span>
              <span className="row-value">{money(value)}</span>
            </div>
          ))}
          <div className="row">
            <span style={{ fontWeight: 700 }}>Gross Salary</span>
            <span className="row-value" style={{ color: 'var(--green)' }}>{money(s.gross)}</span>
          </div>
        </div>

        <div>
          <div className="stat-label" style={{ marginBottom: 8 }}>Deductions</div>
          {deductions.map(([label, value]) => (
            <div className="row" key={label}>
              <span className="row-label">{label}</span>
              <span className="row-value red">-{money(value)}</span>
            </div>
          ))}
          <div className="row">
            <span style={{ fontWeight: 700 }}>Total Deductions</span>
            <span className="row-value red">-{money(s.totalDeductions)}</span>
          </div>
        </div>
      </div>

      <div className="card-body" style={{ paddingTop: 0 }}>
        <div className="net-box">
          <span style={{ fontWeight: 700 }}>Net Take-Home (per month)</span>
          <span className="net-value">{money(s.net)}</span>
        </div>
      </div>
    </div>
  );
}
