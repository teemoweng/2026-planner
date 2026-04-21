// Cloud layer: Supabase auth + backend API wrapper.
// Relies on window.supabase (UMD loaded in Planner.html) and window.__PLANNER_CONFIG__.

const _cfg = window.__PLANNER_CONFIG__ || {};
const _sb = window.supabase.createClient(_cfg.supabaseUrl, _cfg.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

window.sb = _sb;  // convenience for debugging

async function _authHeader() {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) throw new Error('not signed in');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function _api(method, path, body) {
  const headers = { 'content-type': 'application/json', ...(await _authHeader()) };
  const r = await fetch(_cfg.apiBase + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`API ${method} ${path} → ${r.status}: ${text}`);
  }
  return r.json();
}

// ─── Auth ──────────────────────────────────────────────────────────
async function signUp(email, password) {
  // Force email confirmation link to redirect back to Planner.html
  // (otherwise Supabase falls back to Site URL set in dashboard).
  const redirectTo = new URL('Planner.html', window.location.href).toString();
  const { data, error } = await _sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  await _sb.auth.signOut();
}

function onAuthChange(cb) {
  // Fire immediately with current session, then subscribe for changes.
  _sb.auth.getSession().then(({ data: { session } }) => cb(session));
  const { data: { subscription } } = _sb.auth.onAuthStateChange((_event, session) => cb(session));
  return () => subscription.unsubscribe();
}

// ─── Planner blob ──────────────────────────────────────────────────
async function loadUserData() {
  const { data } = await _api('GET', '/api/user_data');
  return data || {};
}

async function saveUserData(data) {
  await _api('PUT', '/api/user_data', { data });
}

// ─── AI chat ───────────────────────────────────────────────────────
async function chatAPI(system, messages) {
  return _api('POST', '/api/chat', { system, messages });
}

Object.assign(window, {
  cloud: {
    signUp, signIn, signOut, onAuthChange,
    loadUserData, saveUserData, chatAPI,
  },
});
