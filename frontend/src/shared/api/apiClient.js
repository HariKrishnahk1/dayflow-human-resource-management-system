const TOKEN_KEY = 'dayflow.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Thin fetch wrapper: attaches the JWT and surfaces server error messages as thrown Errors. */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const money = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(Number(n) || 0);

export const prettyDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const prettyTime = (t) => (t ? String(t).slice(0, 5) : '—');
