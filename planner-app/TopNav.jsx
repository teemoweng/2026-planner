
// TopNav: month number tabs + proper view icons matching PDF design
const VIEW_ICONS_DATA = [
  { id: 'year',   svg: '⊞',  label: 'Calendar' },
  { id: 'month',  svg: '▦',  label: 'Monthly' },
  { id: 'week',   svg: '☰',  label: 'Weekly' },
];

function TopNav({ year, month, onMonthSelect, view, onViewChange, title, onToday, onAIOpen }) {
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div style={topNavStyles.nav}>
      {/* Title */}
      {title && (
        <div style={topNavStyles.title}>
          <span style={topNavStyles.titleDot}>✦</span>
          <span>{title}</span>
        </div>
      )}

      {/* Month number tabs — fixed size, background-only active state */}
      <div style={topNavStyles.monthTabs}>
        {months.map(m => (
          <div
            key={m}
            onClick={() => onMonthSelect(m)}
            className="p-month-tab"
            style={{
              ...topNavStyles.monthTab,
              background: m === month ? 'var(--accent)' : 'transparent',
              color: m === month ? 'var(--bg)' : 'rgba(var(--text-rgb),0.4)',
              fontWeight: m === month ? 700 : 500,
            }}
          >
            {String(m + 1).padStart(2, '0')}
          </div>
        ))}
      </div>

      {/* Right controls: Today + segmented view */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 0, flexShrink: 0 }}>
        {/* Today button */}
        <div
          onClick={onToday}
          className="p-today-btn"
          style={topNavStyles.todayBtn}
          title="回到今天"
        >
          Today
        </div>

        {/* AI button */}
        <div
          onClick={onAIOpen}
          className="p-ai-btn"
          style={topNavStyles.aiBtn}
          title="与 AI 对话"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          AI
        </div>

        {/* View switcher — segmented control */}
        <div style={topNavStyles.segmented}>
          {VIEW_ICONS_DATA.map((v, i) => (
            <div
              key={v.id}
              title={v.label}
              onClick={() => onViewChange(v.id)}
              className="p-view-icon"
              style={{
                ...topNavStyles.segment,
                background: view === v.id ? 'rgba(var(--accent-rgb),0.22)' : 'transparent',
                color: view === v.id ? 'var(--accent)' : 'rgba(var(--text-rgb),0.4)',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(var(--accent-rgb),0.15)',
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>{v.svg}</span>
              <span style={topNavStyles.segLabel}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const topNavStyles = {
  nav: {
    height: 52,
    background: 'var(--bg-2)',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    paddingRight: 12,
    flexShrink: 0,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 17,
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(var(--accent-rgb),0.15)',
    height: '100%',
    letterSpacing: '-0.3px',
  },
  titleDot: {
    color: 'var(--accent)',
    fontSize: 10,
  },
  monthTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    paddingLeft: 8,
    overflow: 'hidden',
    minWidth: 0,
  },
  monthTab: {
    width: 30,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'background 0.18s, color 0.18s',
    userSelect: 'none',
    flexShrink: 0,
  },
  todayBtn: {
    height: 28,
    padding: '0 10px',
    marginRight: 0,
    border: '1px solid rgba(var(--accent-rgb),0.3)',
    borderRadius: 6,
    color: 'var(--accent)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
    userSelect: 'none',
  },
  aiBtn: {
    height: 28,
    padding: '0 10px',
    border: '1px solid rgba(var(--accent-rgb),0.35)',
    borderRadius: 6,
    color: 'var(--accent)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
    flexShrink: 0,
    userSelect: 'none',
  },
  segmented: {
    display: 'flex',
    alignItems: 'stretch',
    border: '1px solid rgba(var(--accent-rgb),0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    height: 28,
    flexShrink: 0,
  },
  segment: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 10px',
    gap: 2,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    userSelect: 'none',
    minWidth: 54,
  },
  segLabel: {
    fontSize: 9,
    letterSpacing: '0.07em',
    lineHeight: 1,
    fontWeight: 500,
  },
};

Object.assign(window, { TopNav });
