import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, prettyDate } from '../../shared/api/apiClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

/** Payslip list — employees see their own, managers see the whole organisation. */
export default function Payslips() {
  const { isManager } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/payroll').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="empty">Loading…</div>;

  if (data.payroll.length === 0) {
    return (
      <div className="empty">
        No payslips yet.{' '}
        {isManager
          ? 'Run payroll for a month to generate them.'
          : 'They appear once HR processes payroll for the month.'}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{isManager ? 'All Payslips' : 'My Payslips'}</div>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{data.payroll.length} records</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Period</th>
              {isManager && <th>Employee</th>}
              <th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {data.payroll.map((p) => (
              <tr key={p.id}>
                <td>{p.monthName} {p.year}</td>
                {isManager && (
                  <td>{p.name} <span style={{ color: 'var(--muted)' }}>({p.empCode})</span></td>
                )}
                <td className="num">{money(p.gross)}</td>
                <td className="num red">-{money(p.totalDeductions)}</td>
                <td className="num" style={{ fontWeight: 700, color: 'var(--green)' }}>{money(p.net)}</td>
                <td><span className={`pill pill-${p.status === 'paid' ? 'approved' : 'pending'}`}>{p.status}</span></td>
                <td>
                  <Link className="btn btn-ghost btn-sm" to={`/payslips/${p.employeeId}/${p.year}/${p.month}`}>
                    View Payslip
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
