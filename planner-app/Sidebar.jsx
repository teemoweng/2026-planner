
// Sidebar: mini calendar, week tabs, notes section
const { useState, useMemo } = React;

function WeekTab({ label, active, hovered, onClick, onMouseEnter, onMouseLeave }) {
  const [selfHovered, setSelfHovered] = React.useState(false);
  const isHovered = selfHovered;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { setSelfHovered(true); onMouseEnter && onMouseEnter(); }}
      onMouseLeave={() => { setSelfHovered(false); onMouseLeave && onMouseLeave(); }}
      style={{
        ...sidebarStyles.weekTab,
        background: active ? 'var(--accent)' : isHovered ? 'rgba(var(--accent-rgb),0.28)' : 'rgba(var(--accent-rgb),0.12)',
        color: active ? 'var(--bg)' : isHovered ? 'var(--text)' : 'var(--accent)',
        fontWeight: active || isHovered ? 700 : 500,
        borderColor: isHovered ? 'rgba(var(--accent-rgb),0.6)' : 'rgba(var(--accent-rgb),0.25)',
        transform: isHovered && !active ? 'translateY(-1px)' : 'none',
      }}
    >
      {label}
    </div>
  );
}

function MiniCalendar({ year, month, selectedWeek, hoveredWeek, onSelectWeek, onSelectDay, selectedDay }) {
  // Mon-Sun weeks; a week belongs to the month where its Sunday falls
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0) { // Sunday
      const week = [];
      for (let i = 0; i < 7; i++) {
        const cur = new Date(year, month, d - 6 + i);
        const isCurMonth = cur.getMonth() === month && cur.getFullYear() === year;
        week.push({ day: cur.getDate(), isCurMonth });
      }
      weeks.push(week);
    }
  }

  const today = new Date();
  const isToday = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <div style={sidebarStyles.miniCal}>
      <div style={sidebarStyles.miniCalHeader}>
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <span key={i} style={{ ...sidebarStyles.miniCalDow, color: i >= 5 ? 'rgba(var(--accent-rgb),0.6)' : 'rgba(var(--text-rgb),0.5)' }}>{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div
          key={wi}
          onClick={() => onSelectWeek(wi)}
          className="p-mini-week"
          style={{
            ...sidebarStyles.miniCalWeek,
            background: selectedWeek === wi ? 'rgba(var(--accent-rgb),0.15)' : hoveredWeek === wi ? 'rgba(var(--accent-rgb),0.1)' : 'transparent',
            borderRadius: 4,
          }}
        >
          {week.map((cell, di) => {
            const d = cell.day;
            const isCurMonth = cell.isCurMonth;
            const curIsToday = isCurMonth && isToday(d);
            return (
              <span
                key={di}
                onClick={e => { e.stopPropagation(); if(isCurMonth) onSelectDay(d); }}
                className={isCurMonth ? 'p-mini-day' : ''}
                style={{
                  ...sidebarStyles.miniCalDay,
                  background: curIsToday ? 'var(--accent)' : (isCurMonth && d === selectedDay ? 'rgba(var(--accent-rgb),0.3)' : 'transparent'),
                  borderRadius: curIsToday ? '50%' : 0,
                  fontWeight: curIsToday ? 700 : 400,
                  color: curIsToday
                    ? 'var(--bg)'
                    : !isCurMonth
                      ? 'rgba(var(--text-rgb),0.2)'
                      : (di >= 5 ? 'rgba(var(--accent-rgb),0.8)' : 'rgba(var(--text-rgb),0.85)'),
                  cursor: isCurMonth ? 'pointer' : 'default',
                }}
              >
                {d}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Sidebar({ year, month, selectedWeek, hoveredWeek, onSelectWeek, onHoverWeek, notes, onNotesChange, onMonthChange, onGoYear, isYearView }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [notesOpen, setNotesOpen] = useState(true);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = monthNames[month];
  const monthNum = String(month + 1).padStart(2, '0');

  // Count weeks: Mon-Sun weeks where Sunday falls in this month
  const daysInMonth2 = new Date(year, month + 1, 0).getDate();
  let totalWeeks = 0;
  for (let d = 1; d <= daysInMonth2; d++) {
    if (new Date(year, month, d).getDay() === 0) totalWeeks++;
  }
  const weekTabs = Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);

  return (
    <div style={sidebarStyles.sidebar}>
      {/* Month header */}
      <div style={sidebarStyles.monthHeader}>
        <div style={sidebarStyles.yearMonth}>
          <span
            style={{
              ...sidebarStyles.yearText,
              cursor: isYearView ? 'default' : 'pointer',
            }}
            className={isYearView ? '' : 'p-year-num-btn'}
            onClick={isYearView ? undefined : onGoYear}
            title={isYearView ? '' : 'Year view'}
          >{year}.</span>
          <span style={sidebarStyles.monthNum}>{monthNum}</span>
          <span style={sidebarStyles.dot}>.</span>
        </div>
        <div style={sidebarStyles.monthPill}>{monthName}</div>
      </div>

      {/* Mini calendar */}
      <div key={`${year}-${month}`} className="p-mini-cal-swap">
        <MiniCalendar
          year={year}
          month={month}
          selectedWeek={selectedWeek}
          hoveredWeek={hoveredWeek}
          onSelectWeek={onSelectWeek}
          onSelectDay={setSelectedDay}
          selectedDay={selectedDay}
        />
      </div>

      {/* Week tabs */}
      <div style={sidebarStyles.weekTabs}>
        {weekTabs.map((w, i) => (
          <WeekTab
            key={i}
            label={w}
            active={selectedWeek === i}
            onClick={() => onSelectWeek(i)}
            onMouseEnter={() => onHoverWeek(i)}
            onMouseLeave={() => onHoverWeek(null)}
          />
        ))}
      </div>

      {/* Notes */}
      <div style={sidebarStyles.notesSection}>
        <div style={sidebarStyles.notesHeader} className="p-notes-header" onClick={() => setNotesOpen(!notesOpen)}>
          <span style={sidebarStyles.notesLabel} className="p-notes-label">Notes</span>
          <span style={{ color: 'var(--accent)', fontSize: 16, lineHeight: 1, fontWeight: 600, transition: 'transform 0.2s', display: 'inline-block', transform: notesOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>⌄</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateRows: notesOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.28s ease',
          overflow: 'hidden',
        }}>
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(var(--accent-rgb),0.15)', borderRadius: 8, padding: '8px 10px', minHeight: 80, overflow: 'auto', marginTop: 4 }}>
              <MarkdownEditor
                value={notes}
                onChange={onNotesChange}
                placeholder={"• 本月计划\n• 重要事项"}
                style={{ fontSize: 13, lineHeight: 1.7 }}
                minHeight={60}
              />
            </div>
          </div>
        </div>      </div>

      {/* Prev/Next month nav */}
      <div style={sidebarStyles.monthNav}>
        <button style={sidebarStyles.navBtn} className="p-nav-btn" onClick={() => onMonthChange(-1)}>‹ Prev</button>
        <button style={sidebarStyles.navBtn} className="p-nav-btn" onClick={() => onMonthChange(1)}>Next ›</button>
      </div>
    </div>
  );
}

const sidebarStyles = {
  sidebar: {
    width: 190,
    minWidth: 190,
    height: '100%',
    background: 'var(--bg-2)',
    borderRight: '1px solid rgba(var(--accent-rgb),0.15)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px 16px',
    boxSizing: 'border-box',
    gap: 0,
    overflow: 'hidden',
  },
  monthHeader: {
    marginBottom: 16,
  },
  yearMonth: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 0,
    marginBottom: 8,
  },
  yearText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    color: 'var(--text)',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    cursor: 'pointer',
    display: 'inline-block',
  },
  monthNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    color: 'var(--accent)',
    fontWeight: 700,
  },
  dot: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    color: 'var(--accent)',
    fontWeight: 700,
  },
  monthPill: {
    display: 'inline-block',
    background: 'rgba(var(--accent-rgb),0.18)',
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    padding: '3px 12px',
    borderRadius: 20,
    border: '1px solid rgba(var(--accent-rgb),0.3)',
  },
  miniCal: {
    marginBottom: 14,
  },
  miniCalHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: 4,
  },
  miniCalDow: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  miniCalWeek: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    cursor: 'pointer',
    padding: '1px 0',
    transition: 'background 0.15s',
  },
  miniCalDay: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: '20px',
    width: 20,
    height: 20,
    margin: '0 auto',
    cursor: 'pointer',
    transition: 'background 0.15s',
    userSelect: 'none',
  },
  weekTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 16,
  },
  weekTab: {
    fontSize: 10,
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s, border-color 0.18s',
    letterSpacing: '0.05em',
    border: '1px solid rgba(var(--accent-rgb),0.25)',
    userSelect: 'none',
  },
  notesSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  notesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    cursor: 'pointer',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(var(--text-rgb),0.6)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  notesArea: {
    flex: 1,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(var(--accent-rgb),0.15)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 11,
    lineHeight: 1.7,
    padding: '8px 10px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    minHeight: 100,
  },
  monthNav: {
    display: 'flex',
    gap: 6,
    marginTop: 14,
  },
  navBtn: {
    flex: 1,
    background: 'rgba(var(--accent-rgb),0.1)',
    border: '1px solid rgba(var(--accent-rgb),0.2)',
    color: 'var(--accent)',
    borderRadius: 6,
    fontSize: 10,
    padding: '5px 0',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
    transition: 'background 0.15s',
  },
};

Object.assign(window, { Sidebar });
