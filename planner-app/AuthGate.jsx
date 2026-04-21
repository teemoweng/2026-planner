// AuthGate: renders login/signup form until a Supabase session exists,
// then passes the session to the wrapped children.

const { useState: _useStateAG, useEffect: _useEffectAG } = React;

function AuthGate({ children }) {
  const [session, setSession] = _useStateAG(null);
  const [ready, setReady]     = _useStateAG(false);

  _useEffectAG(() => window.cloud.onAuthChange(s => {
    setSession(s);
    setReady(true);
  }), []);

  if (!ready) return <LoadingScreen label="Loading…" />;
  if (!session) return <AuthScreen />;
  return typeof children === 'function' ? children(session) : children;
}

function LoadingScreen({ label }) {
  return (
    <div style={authStyles.center}>
      <div style={authStyles.spinner} />
      <div style={authStyles.hint}>{label}</div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode]       = _useStateAG('signin');  // 'signin' | 'signup'
  const [email, setEmail]     = _useStateAG('');
  const [pw, setPw]           = _useStateAG('');
  const [busy, setBusy]       = _useStateAG(false);
  const [err, setErr]         = _useStateAG('');
  const [info, setInfo]       = _useStateAG('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signup') {
        const r = await window.cloud.signUp(email.trim(), pw);
        if (!r.session) {
          setInfo('注册成功！请检查邮箱确认链接，然后回来登录。');
          setMode('signin');
        }
      } else {
        await window.cloud.signIn(email.trim(), pw);
      }
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={authStyles.center}>
      <div style={authStyles.card}>
        <div style={authStyles.title}>Margin</div>
        <div style={authStyles.subtitle}>
          {mode === 'signin' ? '在页边写下你的 2026' : '创建一个专属于你的手账'}
        </div>

        <form onSubmit={submit} style={authStyles.form}>
          <label style={authStyles.label}>
            <span style={authStyles.labelText}>邮箱</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              style={authStyles.input}
            />
          </label>
          <label style={authStyles.label}>
            <span style={authStyles.labelText}>密码</span>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              style={authStyles.input}
            />
          </label>

          {err  && <div style={authStyles.error}>{err}</div>}
          {info && <div style={authStyles.info}>{info}</div>}

          <button type="submit" disabled={busy} style={{
            ...authStyles.button,
            opacity: busy ? 0.55 : 1,
            cursor: busy ? 'wait' : 'pointer',
          }}>
            {busy ? '…' : (mode === 'signin' ? '登录' : '注册')}
          </button>
        </form>

        <div style={authStyles.switch}>
          {mode === 'signin' ? '还没账号？' : '已有账号？'}
          <button type="button"
            onClick={() => { setErr(''); setInfo(''); setMode(mode === 'signin' ? 'signup' : 'signin'); }}
            style={authStyles.switchBtn}>
            {mode === 'signin' ? '注册一个' : '去登录'}
          </button>
        </div>
      </div>

      <div style={authStyles.footnote}>
        Powered by Supabase · 你的数据只有你能看到
      </div>
    </div>
  );
}

const authStyles = {
  center: {
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', color: 'var(--text)',
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
    gap: 20,
  },
  spinner: {
    width: 26, height: 26,
    border: '2px solid rgba(var(--accent-rgb),0.22)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'p-spin 0.9s linear infinite',
  },
  hint: { fontSize: 12, color: 'rgba(var(--text-rgb),0.5)', letterSpacing: '0.04em' },
  card: {
    width: 360, maxWidth: '92vw',
    padding: '36px 32px 28px',
    background: 'rgba(var(--accent-rgb),0.05)',
    border: '1px solid rgba(var(--accent-rgb),0.18)',
    borderRadius: 14,
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 26, fontWeight: 700,
    color: 'var(--accent)', textAlign: 'center',
    letterSpacing: '0.02em', marginBottom: 4,
  },
  subtitle: {
    fontSize: 13, color: 'rgba(var(--text-rgb),0.55)',
    textAlign: 'center', letterSpacing: '0.04em', marginBottom: 26,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 6 },
  labelText: { fontSize: 11, color: 'rgba(var(--text-rgb),0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: {
    background: 'rgba(var(--accent-rgb),0.06)',
    border: '1px solid rgba(var(--accent-rgb),0.18)',
    borderRadius: 8, color: 'var(--text)',
    fontSize: 14, padding: '10px 12px',
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  },
  button: {
    marginTop: 6, padding: '11px 16px',
    background: 'var(--accent)', color: 'var(--bg)',
    border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    letterSpacing: '0.06em',
    transition: 'transform 0.1s, box-shadow 0.15s',
  },
  error: {
    fontSize: 12, color: 'rgba(255,160,160,0.9)',
    background: 'rgba(220,80,80,0.1)',
    border: '1px solid rgba(220,80,80,0.3)',
    borderRadius: 6, padding: '8px 10px',
  },
  info: {
    fontSize: 12, color: 'rgba(var(--accent-rgb),1)',
    background: 'rgba(var(--accent-rgb),0.08)',
    border: '1px solid rgba(var(--accent-rgb),0.2)',
    borderRadius: 6, padding: '8px 10px',
  },
  switch: {
    marginTop: 18, textAlign: 'center',
    fontSize: 12, color: 'rgba(var(--text-rgb),0.5)',
  },
  switchBtn: {
    marginLeft: 4, background: 'none', border: 'none',
    color: 'var(--accent)', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, padding: 0,
    textDecoration: 'underline', textUnderlineOffset: 3,
  },
  footnote: {
    fontSize: 10, color: 'rgba(var(--text-rgb),0.3)',
    letterSpacing: '0.1em', textTransform: 'uppercase',
  },
};

Object.assign(window, { AuthGate, LoadingScreen });
