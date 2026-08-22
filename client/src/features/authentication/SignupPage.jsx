import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../shared/api/apiClient.js';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ empCode: '', name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api('/auth/signup', { method: 'POST', body: form, auth: false });
      // No mail server in this build, so we hand the user straight to the verification step.
      navigate(`/verify?token=${res.verifyToken}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">Day<span>flow</span></div>
        <div className="brand-tag">Create your account.</div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="empCode">Employee ID</label>
          <input id="empCode" value={form.empCode} onChange={set('empCode')} placeholder="DF006" required />
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
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={set('password')} required />
          <div className="hint">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</div>
        </div>

        <div className="field">
          <label htmlFor="role">Role</label>
          <select id="role" value={form.role} onChange={set('role')}>
            <option value="employee">Employee</option>
            <option value="hr">HR Officer</option>
          </select>
        </div>

        <button className="btn btn-block" disabled={busy}>
          {busy ? 'Creating…' : 'Sign Up'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
