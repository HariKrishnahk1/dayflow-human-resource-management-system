import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../shared/api/apiClient.js';

export default function Verify() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [state, setState] = useState({ error: '', done: false });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setState({ error: '', done: false });
    try {
      await api('/auth/verify', { method: 'POST', body: { token }, auth: false });
      setState({ error: '', done: true });
    } catch (err) {
      setState({ error: err.message, done: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">Day<span>flow</span></div>
        <div className="brand-tag">Verify your email address.</div>

        {state.error && <div className="alert alert-error">{state.error}</div>}
        {state.done && <div className="alert alert-ok">Email verified — you can sign in now.</div>}

        {!state.done && (
          <>
            <div className="field">
              <label htmlFor="token">Verification token</label>
              <input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
              <div className="hint">
                This build has no mail server, so the token from sign-up is filled in for you.
                In production it would arrive as a link by email.
              </div>
            </div>
            <button className="btn btn-block" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify Email'}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <Link to="/login">Go to sign in</Link>
        </div>
      </form>
    </div>
  );
}
