# 2026 Planner · 电子手账

A browser-based 2026 planner with year/month/week/day views, four theme palettes, cloud sync, and an AI assistant that parses natural-language commands (`"4月23日三点面试"`) into structured calendar actions.

**🔗 Live demo:** https://2026-planner-mu.vercel.app

Sign up with any email; data is private per-account and stored in Supabase.

---

## Stack

```
┌─────────────────────────────────┐        ┌──────────────────────────────┐
│  Frontend — Vercel (static)     │        │  Backend — Railway (Fluid)    │
│  Planner.html + planner-app/*.jsx       │  FastAPI + uvicorn            │
│  React via Babel standalone     │        │  JWKS JWT verification        │
│  Supabase JS UMD client         │        │  Per-user rate limiting (50/d)│
└─────────────────────────────────┘        └──────────────────────────────┘
          │                                             │
          │                                             ▼
          │                                ┌───────────────────────────┐
          │                                │  Supabase Postgres + Auth │
          │                                │  (user_data JSON blob)    │
          │                                └───────────────────────────┘
          │                                             │
          │  auth token (ES256 JWT)                     ▼
          └────────────────────────────────▶  LLM provider (pluggable)
                                              火山方舟 · Claude · DeepSeek
                                              Kimi · OpenAI · OpenRouter
```

## Features

- **Four views**: year grid · month calendar · week cards · day detail with schedule / to-do / focus / markdown notes
- **Trackers**: weather · mood · water · sleep · meals — compact visual indicators
- **AI drawer** (right side): parses Chinese + English date/time into one of 11 typed actions, applied to the planner
- **Theme system**: 4 palettes (amber / graphite / rose / smoky), switchable at runtime
- **Cloud-synced**: debounce-saved to Supabase; sign in from any device to access the same data
- **Pluggable LLM backend**: swap providers by changing env vars (OpenAI-compatible and Anthropic protocols both supported)

## AI action vocabulary

Every AI response is constrained to a JSON schema with `reply` plus zero or more actions:

| Action | Goes into |
| --- | --- |
| `add_schedule` | Day view schedule (time-specific) |
| `add_todo` · `set_main_focus` · `append_day_notes` | Day view |
| `set_weather` · `set_mood` · `set_water` · `set_sleep` · `set_meal` | Day view trackers |
| `add_monthly_note` | Month view |
| `navigate` | Switch view (day / month / year) |

See `buildSystemPrompt` in [`planner-app/AIChat.jsx`](planner-app/AIChat.jsx) for the full contract.

## Run locally

Two services, two terminals.

### Backend

```bash
cd backend
cp .env.example .env                                 # fill in Supabase + LLM keys
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend

```bash
python3 -m http.server 8000
open http://localhost:8000/Planner.html
```

The frontend's `apiBase` switches automatically by hostname (localhost → 8001, prod → Railway).

### Database

Paste [`backend/schema.sql`](backend/schema.sql) into the Supabase SQL editor to bootstrap tables and RLS policies.

## Supported LLM providers

The backend speaks two dialects — Anthropic `messages` and OpenAI `chat/completions` — so most providers work with only env-var changes.

| Provider | `LLM_PROVIDER` | `LLM_BASE_URL` |
| --- | --- | --- |
| Anthropic Claude | `anthropic` | `https://api.anthropic.com/v1` |
| 火山方舟 (Ark / Doubao) | `openai` | `https://ark.cn-beijing.volces.com/api/v3` |
| DeepSeek | `openai` | `https://api.deepseek.com/v1` |
| Moonshot (Kimi) | `openai` | `https://api.moonshot.cn/v1` |
| OpenAI | `openai` | `https://api.openai.com/v1` |
| OpenRouter | `openai` | `https://openrouter.ai/api/v1` |
| Local Ollama | `openai` | `http://localhost:11434/v1` |

## Environment variables

### Backend (Railway)
| Var | Purpose |
| --- | --- |
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_ANON_KEY` | legacy anon key |
| `SUPABASE_SERVICE_KEY` | legacy service_role key (secret) |
| `LLM_PROVIDER` | `anthropic` or `openai` |
| `LLM_BASE_URL` | provider base URL |
| `LLM_MODEL` | model id |
| `LLM_API_KEY` | provider key (secret) |
| `LLM_MAX_TOKENS` | response cap (default 1024) |
| `FREE_TIER_DAILY_AI_CALLS` | per-user quota (default 50) |
| `CORS_ORIGINS` | comma-separated allowlist |

### Frontend
Config is inline in [`Planner.html`](Planner.html) (Supabase URL + public anon key + apiBase by hostname). No env vars needed on Vercel; override at runtime via `window.__PLANNER_API_BASE__` if you need a per-deploy backend.

## Project layout

```
.
├── Planner.html                # entry (React + Babel, inlined config)
├── planner-app/
│   ├── App.jsx                 # root, wires AuthGate + useCloudBlob
│   ├── AuthGate.jsx            # login/signup UI
│   ├── cloud.jsx               # Supabase client + /api/* fetchers
│   ├── AIChat.jsx              # AI drawer + system prompt contract
│   ├── TopNav.jsx              # month tabs, view switcher, user badge
│   ├── Sidebar.jsx             # mini calendar + notes
│   ├── YearView.jsx            # 12-month grid
│   ├── CalendarGrid.jsx        # month view
│   ├── WeekView.jsx            # week view
│   ├── DayView.jsx             # day detail with trackers
│   ├── MarkdownEditor.jsx      # notes editor
│   ├── CoverPage.jsx           # intro cover
│   ├── Auth.jsx                # (legacy local multi-user; unused)
│   └── UserMenu.jsx            # profile menu (WIP)
├── backend/
│   ├── main.py                 # FastAPI app: auth, CRUD, chat proxy
│   ├── schema.sql              # Postgres tables + RLS policies
│   ├── Procfile                # Railway start command
│   ├── runtime.txt             # Python version
│   └── requirements.txt
├── vercel.json                 # static deploy config
└── features.pdf                # spec
```

## Notes

- Frontend is classic SPA loaded via Babel standalone — no bundler, no build step.
- Backend uses JWKS (ES256) to verify Supabase access tokens — no shared JWT secret needed.
- AI quota is per-user per 24h, enforced via a Postgres function (`ai_usage_last_24h`) before forwarding the request.
- Auth UI and cover page share styling; theme changes propagate via CSS custom properties.
