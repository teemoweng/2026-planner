
// YearView: compact overview of all 12 months
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW_MINI = ['M','T','W','T','F','S','S'];

function MiniMonthCard({ year, month, data, onSelect, onSelectDay }) {
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  return (
    <div
      style={{
        ...yearStyles.card,
        ...(isCurrentMonth ? yearStyles.cardCurrent : null),
      }}
      className={`p-year-card${isCurrentMonth ? ' p-year-card-current' : ''}`}
      onClick={() => onSelect(month)}
    >
      <div style={yearStyles.cardHeader}>
        <span style={{
          ...yearStyles.cardMonthNum,
          color: isCurrentMonth ? 'var(--accent)' : 'rgba(var(--text-rgb),0.4)',
        }}>
          {String(month + 1).padStart(2, '0')}
        </span>
        <span style={{
          ...yearStyles.cardMonthName,
          color: isCurrentMonth ? 'var(--accent)' : 'rgba(var(--text-rgb),0.5)',
          fontWeight: isCurrentMonth ? 600 : 500,
        }}>{MONTH_NAMES[month]}</span>
      </div>
      <div style={yearStyles.miniGrid}>
        {DOW_MINI.map((d, i) => (
          <span key={`h${i}`} style={{
            ...yearStyles.miniDow,
            color: i >= 5 ? 'rgba(var(--accent-rgb),0.5)' : 'rgba(var(--text-rgb),0.3)',
          }}>{d}</span>
        ))}
        {days.map((d, i) => {
          const isToday = d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          const col = i % 7;
          const key = d ? `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
          const hasNote = key && data[key];
          return (
            <span
              key={i}
              onClick={d ? (e) => { e.stopPropagation(); onSelectDay && onSelectDay(year, month, d); } : undefined}
              className={d ? 'p-year-mini-day' : ''}
              style={{
                ...yearStyles.miniDay,
                color: d ? (isToday ? 'var(--bg)' : col >= 5 ? 'rgba(var(--accent-rgb),0.75)' : 'rgba(var(--text-rgb),0.65)') : 'transparent',
                background: isToday ? 'var(--accent)' : (hasNote ? 'rgba(var(--accent-rgb),0.2)' : 'transparent'),
                borderRadius: '50%',
                fontWeight: isToday ? 700 : 400,
                cursor: d ? 'pointer' : 'default',
              }}
            >
              {d || ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ year, data, onSelectMonth, onBackToCover, onOpenDay }) {
  return (
    <div style={yearStyles.container}>
      <div style={yearStyles.yearHeader}>
        <span
          style={yearStyles.yearNum}
          className="p-year-num-btn"
          onClick={onBackToCover}
          title="Back to cover"
        >{year}</span>
        <span style={yearStyles.yearSub}>Year at a Glance</span>
      </div>
      <div style={yearStyles.grid}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{ animationDelay: `${0.3 + i * 0.04}s` }}
            className="p-year-card-wrap"
          >
            <MiniMonthCard
              year={year}
              month={i}
              data={data}
              onSelect={onSelectMonth}
              onSelectDay={onOpenDay}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const yearStyles = {
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '32px 40px',
    boxSizing: 'border-box',
  },
  yearHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 20,
    marginBottom: 36,
  },
  yearNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 64,
    cursor: 'pointer',
    transition: 'color 0.25s ease, transform 0.25s ease',
    display: 'inline-block',
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1,
    letterSpacing: '-2px',
  },
  yearSub: {
    fontSize: 13,
    color: 'rgba(var(--accent-rgb),0.7)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
  card: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(var(--accent-rgb),0.12)',
    borderRadius: 12,
    padding: '16px 16px 14px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  },
  cardCurrent: {
    border: '1px solid rgba(var(--accent-rgb),0.55)',
    background: 'rgba(var(--accent-rgb),0.07)',
    boxShadow: '0 0 0 1px rgba(var(--accent-rgb),0.18), 0 6px 20px rgba(var(--accent-rgb),0.08)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  cardMonthNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1,
  },
  cardMonthName: {
    fontSize: 11,
    color: 'rgba(var(--text-rgb),0.35)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  miniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px 0',
  },
  miniDow: {
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 600,
    marginBottom: 3,
  },
  miniDay: {
    textAlign: 'center',
    fontSize: 9,
    lineHeight: '16px',
    width: 16,
    height: 16,
    margin: '0 auto',
  },
};

Object.assign(window, { YearView });
