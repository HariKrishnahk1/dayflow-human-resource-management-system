import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, prettyDate, prettyTime } from '../../shared/api/apiClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

function Stat({ label, value, sub, color }) {
  return (
    <div className="stat" style={{ '--stat': color }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { isManager } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="empty">Loading…</div>;

  return isManager ? <ManagerDashboard d={data} /> : <EmployeeDashboard d={data} />;
}

function ManagerDashboard({ d }) {
  return (
    <>
      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <Stat label="Total Employees" value={d.stats.totalEmployees} sub={`${d.stats.activeEmployees} active`} color="var(--accent)" />
        <Stat label="Present Today" value={d.stats.presentToday} color="var(--green)" />
        <Stat label="On Leave Today" value={d.stats.onLeaveToday} color="var(--purple)" />
        <Stat label="Pending Approvals" value={d.stats.pendingLeaves} sub="Awaiting your review" color="var(--amber)" />
        <Stat label="Monthly Payroll" value={money(d.stats.monthlyPayroll)} sub="Total net pay" color="var(--green)" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Pending Leave Approvals</div>
          <Link to="/leaves" className="btn btn-ghost btn-sm">Review all</Link>
        </div>
        {d.pendingLeaveRequests.length === 0 ? (
          <div className="empty">Nothing waiting on you.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {d.pendingLeaveRequests.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name} <span style={{ color: 'var(--muted)' }}>({l.empCode})</span></td>
                    <td>{l.type}</td>
                    <td>{prettyDate(l.from)}</td>
                    <td>{prettyDate(l.to)}</td>
                    <td>{l.days}</td>
                    <td style={{ color: 'var(--muted)' }}>{l.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Employees</div>
          <Link to="/employees" className="btn btn-ghost btn-sm">Manage</Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Department</th><th>Designation</th><th>Status</th></tr>
            </thead>
            <tbody>
              {d.employees.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontFamily: 'var(--mono)' }}>{e.empCode}</td>
                  <td><Link to={`/employees/${e.id}`}>{e.name}</Link></td>
                  <td>{e.department || '—'}</td>
                  <td>{e.designation || '—'}</td>
                  <td><span className={`pill pill-${e.status}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function EmployeeDashboard({ d }) {
  const a = d.attendanceToday;
  return (
    <>
      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <Stat
          label="Today"
          value={a ? <span className={`pill pill-${a.status}`}>{a.status}</span> : 'Not marked'}
          sub={a ? `In ${prettyTime(a.checkIn)} · Out ${prettyTime(a.checkOut)}` : 'You have not checked in'}
          color="var(--accent)"
        />
        <Stat label="Present This Week" value={d.weekSummary.present} sub={`${prettyDate(d.weekSummary.from)} – ${prettyDate(d.weekSummary.to)}`} color="var(--green)" />
        <Stat label="Half Days" value={d.weekSummary.halfDay} sub="This week" color="var(--amber)" />
        <Stat label="On Leave" value={d.weekSummary.leave} sub="This week" color="var(--purple)" />
        {d.salary && <Stat label="Net Take-Home" value={money(d.salary.net)} sub="Per month" color="var(--green)" />}
      </div>

      {/* SRS 3.2.1 — quick-access cards */}
      <div className="card">
        <div className="card-head"><div className="card-title">Quick Actions</div></div>
        <div className="card-body toolbar">
          <Link to="/profile" className="btn btn-ghost">👤 My Profile</Link>
          <Link to="/attendance" className="btn btn-ghost">🕒 Attendance</Link>
          <Link to="/leaves" className="btn btn-ghost">🏖️ Leave Requests</Link>
          <Link to="/payroll" className="btn btn-ghost">💰 My Salary</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Recent Activity</div></div>
        {d.recentActivity.length === 0 ? (
          <div className="empty">No recent leave activity.</div>
        ) : (
          <div className="card-body">
            {d.recentActivity.map((r) => (
              <div className="row" key={r.id}>
                <span>{r.text}</span>
                <span className={`pill pill-${r.status}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
