// AIChat: floating right-side drawer that talks to Claude and applies structured actions to the planner
const { useState: useStateAI, useRef: useRefAI, useEffect: useEffectAI, useCallback: useCallbackAI } = React;

// System prompt — teaches Claude the schema + date context
function buildSystemPrompt(todayISO, currentViewContext) {
  return `You are a calendar assistant for a 2026 planner app. Today is ${todayISO} (ISO format).
The user is currently viewing: ${currentViewContext}.

The user will tell you what they want to do — add events, set trackers, write notes, or navigate.
Parse their input (Chinese or English) and respond with a JSON object matching this exact schema:

{
  "reply": "short friendly response in the user's language (no longer than 2 sentences)",
  "actions": [
    // zero or more of these:
    {"type": "add_schedule", "date": "YYYY-MM-DD", "hour": "HH", "text": "event text"},
    {"type": "add_monthly_note", "date": "YYYY-MM-DD", "text": "• note text"},
    {"type": "add_todo", "date": "YYYY-MM-DD", "text": "todo item"},
    {"type": "set_main_focus", "date": "YYYY-MM-DD", "text": "focus text"},
    {"type": "append_day_notes", "date": "YYYY-MM-DD", "text": "notes text"},
    {"type": "set_weather", "date": "YYYY-MM-DD", "value": "sun"|"partly"|"cloud"|"rain"|"heavy"|"storm"},
    {"type": "set_mood", "date": "YYYY-MM-DD", "value": "flat"|"smile"|"grin"|"sad"|"angry"|"dead"},
    {"type": "set_water", "date": "YYYY-MM-DD", "value": 0-7},
    {"type": "set_sleep", "date": "YYYY-MM-DD", "value": 0-7},
    {"type": "set_meal", "date": "YYYY-MM-DD", "meal": "breakfast"|"lunch"|"dinner"|"snack", "text": "..."},
    {"type": "navigate", "view": "day"|"month"|"year", "date": "YYYY-MM-DD"}
  ]
}

Date parsing rules:
- "4.23" or "4月23日" or "4/23" → "2026-04-23"
- "今天" → ${todayISO}
- "明天" → one day after today
- "下周三" / "next Wednesday" → compute from today
- If no year given, default to 2026.

Hour parsing:
- "三点" in afternoon context → "15", in morning → "03"
- "下午3点" → "15", "上午10点" → "10", "晚上9点" → "21"
- Default ambiguous "X点" with X<=7 → morning; X>=1 and <=12 → prefer afternoon/evening if context suggests (meetings, dinners)
- "3pm" → "15", "9am" → "09"

Content routing:
- "X点Y" (e.g., "三点要面试") → add_schedule (time-specific event)
- "明天要去买菜" (no time) → add_todo or add_monthly_note (your choice; prefer add_monthly_note for month-level reminders, add_todo for actionable items)
- Weather/mood/water/sleep statements → corresponding set_* action
- "今天重点是X" → set_main_focus

Always return valid JSON. No markdown, no commentary — just the JSON object.`;
}

function safeParseJSON(text) {
  // Strip code fences if Claude added them
  let s = text.trim();
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  // Find first { and last }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function AIChat({ open, onClose, context, onApplyActions }) {
  const [messages, setMessages] = useStateAI([
    { role: 'assistant', content: '你好 ✦ 我是 Margin。告诉我你想安排什么，比如"4月23日三点要面试"，我会帮你记到对应位置。' }
  ]);
  const [input, setInput] = useStateAI('');
  const [loading, setLoading] = useStateAI(false);
  const listRef = useRefAI(null);
  const inputRef = useRefAI(null);

  useEffectAI(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffectAI(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current && inputRef.current.focus(), 350);
    }
  }, [open]);

  const send = useCallbackAI(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const todayISO = new Date().toISOString().slice(0, 10);
      const viewContext = context.view === 'day'
        ? `day view for ${context.currentDate}`
        : context.view === 'month'
          ? `monthly plan for ${context.currentMonth}`
          : context.view === 'year'
            ? `year calendar for ${context.year}`
            : `weekly view`;
      const sysPrompt = buildSystemPrompt(todayISO, viewContext);
      // Build conversation context as messages
      const messagesForClaude = [
        ...history.filter(m => m.role !== 'error').map(m => ({
          role: m.role,
          content: m.content
        }))
      ];
      const data = await window.cloud.chatAPI(sysPrompt, messagesForClaude);
      const response = data.text || '';
      const parsed = safeParseJSON(response);
      if (!parsed) {
        setMessages(h => [...h, { role: 'assistant', content: response || '(未能解析回复)' }]);
      } else {
        setMessages(h => [...h, { role: 'assistant', content: parsed.reply || '✓', actions: parsed.actions || [] }]);
        if (parsed.actions && parsed.actions.length) {
          onApplyActions(parsed.actions);
        }
      }
    } catch (e) {
      setMessages(h => [...h, { role: 'error', content: '抱歉，对话出错了：' + (e.message || e) }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, context, onApplyActions]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`p-ai-backdrop ${open ? 'p-ai-backdrop-open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`p-ai-drawer ${open ? 'p-ai-drawer-open' : ''}`} style={aiStyles.drawer}>
        {/* Header */}
        <div style={aiStyles.header}>
          <div style={aiStyles.headerLeft}>
            <span style={aiStyles.diamond}>✦</span>
            <span style={aiStyles.title}>Margin</span>
          </div>
          <button onClick={onClose} className="p-ai-close" style={aiStyles.closeBtn} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} style={aiStyles.list}>
          {messages.map((m, i) => (
            <Message key={i} m={m} />
          ))}
          {loading && (
            <div style={aiStyles.msgAssistant}>
              <div style={aiStyles.msgBubbleAssistant}>
                <span className="p-ai-typing">
                  <span>•</span><span>•</span><span>•</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={aiStyles.inputArea}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="告诉我你要安排什么…"
            style={aiStyles.textarea}
            rows={2}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-ai-send"
            style={{
              ...aiStyles.sendBtn,
              opacity: (loading || !input.trim()) ? 0.35 : 1,
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            }}
            title="Send (Enter)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        <div style={aiStyles.hint}>
          试试："4.23 三点面试" · "明天早上9点晨会" · "今天喝了5杯水"
        </div>
      </div>
    </>
  );
}

function Message({ m }) {
  if (m.role === 'user') {
    return (
      <div style={aiStyles.msgUser}>
        <div style={aiStyles.msgBubbleUser}>{m.content}</div>
      </div>
    );
  }
  if (m.role === 'error') {
    return (
      <div style={aiStyles.msgAssistant}>
        <div style={aiStyles.msgBubbleError}>{m.content}</div>
      </div>
    );
  }
  return (
    <div style={aiStyles.msgAssistant}>
      <div style={aiStyles.msgBubbleAssistant}>
        {m.content}
        {m.actions && m.actions.length > 0 && (
          <div style={aiStyles.actionsList}>
            {m.actions.map((a, i) => (
              <div key={i} style={aiStyles.actionTag}>
                {formatAction(a)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAction(a) {
  const d = a.date || '';
  switch (a.type) {
    case 'add_schedule': return `✓ ${d} ${a.hour}:00 → ${a.text}`;
    case 'add_monthly_note': return `✓ ${d} → ${a.text}`;
    case 'add_todo': return `✓ ${d} To Do → ${a.text}`;
    case 'set_main_focus': return `✓ ${d} Focus → ${a.text}`;
    case 'append_day_notes': return `✓ ${d} Notes → ${a.text}`;
    case 'set_weather': return `✓ ${d} Weather → ${a.value}`;
    case 'set_mood': return `✓ ${d} Mood → ${a.value}`;
    case 'set_water': return `✓ ${d} Water → ${a.value} 杯`;
    case 'set_sleep': return `✓ ${d} Sleep → ${a.value} 小时`;
    case 'set_meal': return `✓ ${d} ${a.meal} → ${a.text}`;
    case 'navigate': return `→ 跳转到 ${a.view} ${d}`;
    default: return JSON.stringify(a);
  }
}

const aiStyles = {
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    background: 'rgba(var(--bg-rgb), 0.96)',
    borderLeft: '1px solid rgba(var(--accent-rgb),0.22)',
    boxShadow: '-20px 0 40px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  header: {
    padding: '18px 22px',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  diamond: {
    color: 'var(--accent)',
    fontSize: 14,
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    color: 'var(--text)',
    fontWeight: 600,
    letterSpacing: '0.01em',
  },
  closeBtn: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: 'rgba(var(--text-rgb),0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  msgUser: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  msgAssistant: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  msgBubbleUser: {
    maxWidth: '82%',
    padding: '9px 13px',
    background: 'var(--accent)',
    color: 'var(--bg)',
    borderRadius: '14px 14px 3px 14px',
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontWeight: 500,
  },
  msgBubbleAssistant: {
    maxWidth: '82%',
    padding: '9px 13px',
    background: 'rgba(var(--accent-rgb),0.08)',
    color: 'var(--text)',
    borderRadius: '14px 14px 14px 3px',
    fontSize: 13,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    border: '1px solid rgba(var(--accent-rgb),0.12)',
  },
  msgBubbleError: {
    maxWidth: '82%',
    padding: '9px 13px',
    background: 'rgba(220,80,80,0.12)',
    color: 'rgba(255,180,180,0.9)',
    borderRadius: '14px 14px 14px 3px',
    fontSize: 12,
    lineHeight: 1.5,
    border: '1px solid rgba(220,80,80,0.3)',
  },
  actionsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px dashed rgba(var(--accent-rgb),0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  actionTag: {
    fontSize: 11,
    color: 'var(--accent)',
    fontFamily: "'Inter', monospace",
    letterSpacing: '0.01em',
    opacity: 0.9,
  },
  inputArea: {
    padding: '14px 18px 10px',
    borderTop: '1px solid rgba(var(--accent-rgb),0.12)',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: 'rgba(var(--accent-rgb),0.05)',
    border: '1px solid rgba(var(--accent-rgb),0.15)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
    fontFamily: 'inherit',
    padding: '8px 11px',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    transition: 'border-color 0.15s, background 0.15s',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--accent)',
    color: 'var(--bg)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s, transform 0.15s',
    flexShrink: 0,
  },
  hint: {
    padding: '0 22px 14px',
    fontSize: 10,
    color: 'rgba(var(--text-rgb),0.35)',
    letterSpacing: '0.02em',
    textAlign: 'center',
    flexShrink: 0,
  },
};

Object.assign(window, { AIChat });
