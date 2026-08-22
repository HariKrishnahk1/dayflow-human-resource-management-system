import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, money, prettyDate } from '../../shared/api/apiClient.js';

/**
 * Print-ready payslip. "Download PDF" opens the browser print dialog, where
 * "Save as PDF" produces the file — no PDF library needed, and the output
 * matches exactly what is on screen.
 */
export default function PayslipView() {
  const { employeeId, year, month } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/payroll/payslip/${employeeId}/${year}/${month}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [employeeId, year, month]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="empty">Loading payslip…</div>;

  const { payslip: p, employee: e, company: c } = data;
  const earnings = [
    ['Basic Pay', p.basic],
    ['House Rent Allowance (HRA)', p.hra],
    ['Dearness Allowance (DA)', p.da],
    ['Travel Allowance (TA)', p.ta],
  ];
  const deductions = [
    ['Provident Fund (PF)', p.pf],
    ['ESI', p.esi],
    ['Income Tax (TDS)', p.tax],
  ];
  if (p.lopAmount > 0) deductions.push([`Loss of Pay (${p.lopDays} day${p.lopDays === 1 ? '' : 's'})`, p.lopAmount]);

  return (
    <>
      <div className="toolbar no-print" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
        <div className="spacer" />
        <button className="btn" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
      </div>

      <div className="payslip" id="payslip">
        <div className="payslip-head">
          <div>
            <div className="payslip-company">{c.name}</div>
            <div className="payslip-address">{c.address}</div>
          </div>
          <div className="payslip-brand">Day<span>flow</span></div>
        </div>

        <div className="payslip-title">
          Payslip for {p.monthName} {p.year}
        </div>

        <div className="payslip-meta">
          <div><span>Employee Name</span><strong>{e.name}</strong></div>
          <div><span>Employee ID</span><strong>{e.empCode}</strong></div>
          <div><span>Designation</span><strong>{e.designation || '—'}</strong></div>
          <div><span>Department</span><strong>{p.department || '—'}</strong></div>
          <div><span>Date of Joining</span><strong>{prettyDate(e.joinDate)}</strong></div>
          <div><span>Bank Account</span><strong>{e.bank || '—'}</strong></div>
          <div><span>Working Days</span><strong>{p.workingDays}</strong></div>
          <div><span>Paid Days</span><strong>{p.paidDays}</strong></div>
        </div>

        <div className="payslip-cols">
          <div>
            <div className="payslip-col-head">Earnings</div>
            {earnings.map(([label, value]) => (
              <div className="payslip-line" key={label}>
                <span>{label}</span><span className="num">{money(value)}</span>
              </div>
            ))}
            <div className="payslip-line payslip-total">
              <span>Gross Salary</span><span className="num">{money(p.gross)}</span>
            </div>
          </div>

          <div>
            <div className="payslip-col-head">Deductions</div>
            {deductions.map(([label, value]) => (
              <div className="payslip-line" key={label}>
                <span>{label}</span><span className="num">{money(value)}</span>
              </div>
            ))}
            <div className="payslip-line payslip-total">
              <span>Total Deductions</span><span className="num">{money(p.totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="payslip-net">
          <span>Net Take-Home Pay</span>
          <strong>{money(p.net)}</strong>
        </div>

        <div className="payslip-foot">
          Processed on {prettyDate(p.processedOn)} · Status: {p.status} ·
          This is a computer-generated payslip and does not require a signature.
        </div>
      </div>
    </>
  );
}
