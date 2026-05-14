// Daily heartbeat to keep the Supabase free-tier project from auto-pausing
// after ~1 week of inactivity. Triggered by Vercel Cron — see vercel.json.
// Pings the Railway backend too as a free side-benefit.

const SUPABASE_URL = 'https://xtyzkpjriljjkwwfrwyu.supabase.co';
const BACKEND_URL  = 'https://api.margin.day';

async function ping(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { method: 'GET' });
    return { url, ok: true, status: r.status, ms: Date.now() - t0 };
  } catch (e) {
    return { url, ok: false, error: String(e), ms: Date.now() - t0 };
  }
}

export default async function handler(_req, res) {
  const [supabase, backend] = await Promise.all([
    ping(`${SUPABASE_URL}/auth/v1/health`),
    ping(`${BACKEND_URL}/`),
  ]);
  res.status(200).json({
    at: new Date().toISOString(),
    supabase,
    backend,
  });
}
