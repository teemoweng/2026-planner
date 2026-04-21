# 2026 Planner · 电子手账

A browser-based 2026 planner with a year/month/week/day view system, 4 theme palettes, and an AI assistant that parses natural-language commands ("4月23日三点面试") into structured calendar actions.

Built as a single-page React app loaded via Babel standalone — no build step. Ships with a tiny Python proxy that forwards AI requests to any LLM provider you have a key for.

![screenshot](screenshots/day-view.png)

## Features

- **Four views**: 年 (year grid) · 月 (month calendar) · 周 (week cards) · 日 (day detail with schedule / to-do / focus / markdown notes / trackers)
- **Trackers**: weather · mood · water · sleep · meals — each with a compact visual indicator
- **Theme system**: 4 palettes (amber / graphite / rose / smoky), switchable at runtime, persisted to `localStorage`
- **AI drawer** (right side): natural-language input → structured actions → applied to the planner
- **Markdown notes** with live preview
- **Offline-first data**: everything in `localStorage`, no backend database

## Quickstart

### 1. Pick a model provider and grab an API key

Any of these work — the server speaks two dialects:

| Provider | Base URL | Get a key |
| --- | --- | --- |
| Anthropic Claude | `https://api.anthropic.com/v1` | console.anthropic.com |
| 火山方舟 (Ark / Doubao) | `https://ark.cn-beijing.volces.com/api/v3` | volcengine.com/product/ark |
| DeepSeek | `https://api.deepseek.com/v1` | platform.deepseek.com |
| Moonshot (Kimi) | `https://api.moonshot.cn/v1` | platform.moonshot.cn |
| OpenAI | `https://api.openai.com/v1` | platform.openai.com |
| OpenRouter | `https://openrouter.ai/api/v1` | openrouter.ai |
| Local Ollama | `http://localhost:11434/v1` | ollama.com |

### 2. Start the server

```bash
# Example: 火山方舟 / 豆包
LLM_PROVIDER=openai \
LLM_BASE_URL=https://ark.cn-beijing.volces.com/api/v3 \
LLM_MODEL=doubao-seed-1-6-250615 \
LLM_API_KEY=ark-... \
python3 server.py

# Example: Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-... python3 server.py

# Example: DeepSeek
LLM_PROVIDER=openai \
LLM_BASE_URL=https://api.deepseek.com/v1 \
LLM_MODEL=deepseek-chat \
LLM_API_KEY=sk-... \
python3 server.py
```

Default port is `8000`; pass a port as the first arg to change it (`python3 server.py 8080`).

### 3. Open the app

http://localhost:8000/Planner.html

Click the **✦ AI** button in the top bar and try:
- `4.23 三点面试` → schedule entry at 15:00 on Apr 23
- `明天买牙膏` → to-do on tomorrow
- `今天喝了5杯水` → water tracker
- `这个月记得交房租` → monthly note

## Architecture

```
┌─────────────────┐        ┌────────────────┐         ┌──────────────────┐
│  Planner.html   │ fetch  │   server.py    │  https  │   LLM provider   │
│  (React + JSX   │ ─────▶ │ static + /api  │ ──────▶ │   (Ark / Claude  │
│   via Babel)    │ ◀───── │    /chat       │ ◀────── │   / DeepSeek…)   │
└─────────────────┘        └────────────────┘         └──────────────────┘
       │                          │
       │                          └── holds API key server-side
       │
       └── localStorage for planner data + theme
```

- **`Planner.html`** — app shell, CSS theming, animations, tweak panel. Loads every `planner-app/*.jsx` via `<script type="text/babel">`.
- **`planner-app/*.jsx`** — React components. `App.jsx` is the root, `AIChat.jsx` is the drawer, views are split per file.
- **`server.py`** — Python stdlib only. Serves static files AND proxies `/api/chat` to whichever LLM you configured. Anthropic `messages` schema and OpenAI `chat/completions` schema are both supported via an adapter layer.

## How the AI works

Every request goes through a structured system prompt (see `buildSystemPrompt` in `planner-app/AIChat.jsx`) that constrains the model to:

1. Return **only** a JSON object shaped as `{reply, actions[]}`.
2. Pick `actions` from a fixed vocabulary of 11 action types:

   | Action | Goes into |
   | --- | --- |
   | `add_schedule` | Day view schedule (time-specific) |
   | `add_todo` / `set_main_focus` / `append_day_notes` | Day view |
   | `set_weather` / `set_mood` / `set_water` / `set_sleep` / `set_meal` | Day view trackers |
   | `add_monthly_note` | Month view |
   | `navigate` | Switch view (day / month / year) |

3. Parse Chinese and English date/time expressions (`"4.23"`, `"明天"`, `"下周三"`, `"下午3点"`, `"9am"`).

The backend can be swapped freely — the model's identity is hidden behind the system prompt, so the UX doesn't change whether you're on Doubao, Claude, or GPT.

## Configuration

### Environment variables (server)

| Var | Default | Purpose |
| --- | --- | --- |
| `LLM_PROVIDER` | auto | `anthropic` or `openai` |
| `LLM_API_KEY` | — | key for the chosen provider |
| `LLM_BASE_URL` | provider default | override for compatible endpoints |
| `LLM_MODEL` | provider default | model id / endpoint id |
| `LLM_MAX_TOKENS` | `1024` | response cap |
| `ANTHROPIC_API_KEY` | — | shortcut that implies `LLM_PROVIDER=anthropic` |

### Themes

Edit the `:root` / `[data-theme="..."]` blocks at the top of `Planner.html` to add or tweak palettes. The runtime tweaks panel (bottom-right in design-preview mode) lets you change accent/bg/texture live without editing CSS.

## Project layout

```
.
├── Planner.html            # entry
├── planner-app/
│   ├── App.jsx             # root
│   ├── CoverPage.jsx       # intro cover
│   ├── TopNav.jsx          # top bar + view switcher
│   ├── Sidebar.jsx         # mini calendar
│   ├── YearView.jsx        # 12-month grid
│   ├── CalendarGrid.jsx    # month view
│   ├── WeekView.jsx        # week view
│   ├── DayView.jsx         # day view with trackers
│   ├── MarkdownEditor.jsx  # notes editor
│   ├── AIChat.jsx          # AI drawer
│   ├── Auth.jsx            # login (stub)
│   └── UserMenu.jsx        # profile menu
├── server.py               # static + /api/chat proxy
├── features.pdf            # feature spec
├── screenshots/            # reference shots (git-ignored)
└── uploads/                # design assets (git-ignored)
```

## Notes

- Data is **local-only** (`localStorage`); no account required. `Auth.jsx` is a placeholder.
- Opening `Planner.html` via `file://` will fail to load the JSX modules due to CORS — use `python3 server.py` (or any static server).
- Tested with `doubao-seed-1-6-250615`, `claude-haiku-4-5`, `claude-sonnet-4-6`. Smaller open-source models (<7B) may struggle with the strict JSON output contract.
