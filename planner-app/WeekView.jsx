
// WeekView: 2-row × 4-col layout matching the PDF design
const { useState, useRef, useEffect } = React;

const WEEK_DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WEEK_DAY_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function WeekDayCard({ dayName, date, isToday, isWeekend, inMonth, value, onChange, placeholder }) {

  return (
    <div className="p-week-card" style={{
      border: isToday
        ? '1px solid rgba(var(--accent-rgb),0.55)'
        : '1px solid rgba(var(--accent-rgb),0.12)',
      background: isWeekend ? 'rgba(var(--accent-rgb),0.04)' : 'rgba(255,255,255,0.025)',
      ...weekStyles.card,
    }}
      onClick={e => e.currentTarget.querySelector('textarea')?.focus()}
    >
      <div style={weekStyles.cardHeader}>
        <span style={{
          ...weekStyles.dayName,
          color: isWeekend ? 'var(--accent)' : 'rgba(var(--text-rgb),0.7)',
        }}>
          {dayName}
        </span>
        {date && (
          <span style={{
            ...weekStyles.dateChip,
            background: isToday ? 'var(--accent)' : 'transparent',
            color: isToday ? 'var(--bg)' : 'rgba(var(--text-rgb),0.35)',
          }}>
            {date}
          </span>
        )}
        <span style={weekStyles.arrowDot}>↓</span>
      </div>
      <MarkdownEditor
        value={value}
        onChange={val => onChange(val)}
        placeholder=""
        style={{ flex: 1, fontSize: 14 }}
        previewStyle={{ flex: 1, overflow: 'auto' }}
        minHeight={60}
      />
    </div>
  );
}

function WeekMiniCal({ year, month, weekIndex, onSelectWeek }) {
  // Mon-Sun weeks; a week belongs to the month where its Sunday falls
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const weeks = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const cur = new Date(year, month, d - 6 + i);
        const isCurMonth = cur.getMonth() === month && cur.getFullYear() === year;
        week.push({ day: cur.getDate(), isCurMonth });
      }
      weeks.push(week);
    }
  }

  const totalWeeks = weeks.length;

  return (
    <div style={weekStyles.sidePanel}>
      {/* Week label */}
      <div style={weekStyles.weekLabel}>Week {weekIndex + 1}</div>

      {/* Month badge */}
      <div style={weekStyles.monthBadge}>{MONTH_NAMES_FULL[month]}</div>

      {/* Mini calendar */}
      <div style={weekStyles.miniCalWrap}>
        <div style={weekStyles.miniCalHeader}>
          {['M','T','W','T','F','S','S'].map((d,i) => (
            <span key={i} style={{
              textAlign:'center',
              fontSize: 11,
              fontWeight: 600,
              color: i>=5 ? 'rgba(var(--accent-rgb),0.6)' : 'rgba(var(--text-rgb),0.4)',
            }}>{d}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div
            key={wi}
            onClick={() => onSelectWeek(wi)}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              cursor: 'pointer',
              borderRadius: 4,
              background: wi === weekIndex ? 'rgba(var(--accent-rgb),0.15)' : 'transparent',
              padding: '1px 0',
            }}
          >
            {week.map((cell, di) => {
              const d = cell.day;
              const isCur = cell.isCurMonth;
              const isTodayCell = isCur && today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
              return (
                <span key={di} style={{
                  textAlign:'center',
                  fontSize: 11,
                  lineHeight: '22px',
                  color: isTodayCell
                    ? 'var(--bg)'
                    : !isCur
                      ? 'rgba(var(--text-rgb),0.2)'
                      : (di>=5 ? 'rgba(var(--accent-rgb),0.8)' : 'rgba(var(--text-rgb),0.75)'),
                  background: isTodayCell ? 'var(--accent)' : 'transparent',
                  borderRadius: isTodayCell ? '50%' : 0,
                  width: 22,
                  height: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontWeight: isTodayCell ? 700 : 400,
                }}>
                  {d}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Week tabs */}
      <div style={weekStyles.weekTabsRow}>
        {Array.from({ length: totalWeeks }, (_, i) => (
          <div
            key={i}
            className="p-wv-tab"
            onClick={() => onSelectWeek(i)}
            style={{
              ...weekStyles.weekTab,
              background: i === weekIndex ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.12)',
              color: i === weekIndex ? 'var(--bg)' : 'var(--accent)',
              fontWeight: i === weekIndex ? 700 : 500,
            }}
          >
            W{i+1}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ year, month, weekIndex, onSelectWeek, data, onSaveDay }) {
  // Mon-Sun weeks; a week belongs to the month where its Sunday falls
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekStarts = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0) { // Sunday
      const mon = new Date(year, month, d - 6);
      weekStarts.push(mon);
    }
  }
  // Build weeks as arrays of 7 JS Dates
  const weeks = weekStarts.map(mon => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const c = new Date(mon);
      c.setDate(c.getDate() + i);
      arr.push(c);
    }
    return arr;
  });

  const safeWeekIdx = Math.min(weekIndex ?? 0, weeks.length - 1);
  const currentWeekDates = weeks[safeWeekIdx] || weeks[0] || [];
  const today = new Date();

  const getKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  const isToday = (dt) => dt && today.getFullYear()===dt.getFullYear() && today.getMonth()===dt.getMonth() && today.getDate()===dt.getDate();
  const inMonth = (dt) => dt.getMonth() === month && dt.getFullYear() === year;

  // Row 1: [sidebar] Mon Tue Wed  (cols 1,2,3)
  // Row 2: Thu Fri Sat Sun       (cols 0,1,2,3)
  const row1Days = [0,1,2]; // Mon, Tue, Wed indices
  const row2Days = [3,4,5,6]; // Thu, Fri, Sat, Sun indices

  return (
    <div style={weekStyles.container}>
      {/* Row 1 */}
      <div style={weekStyles.row}>
        {/* Left panel with mini calendar */}
        <WeekMiniCal
          year={year}
          month={month}
          weekIndex={safeWeekIdx}
          onSelectWeek={onSelectWeek}
        />

        {/* Mon, Tue, Wed */}
        {row1Days.map(di => {
          const dt = currentWeekDates[di];
          const key = getKey(dt);
          return (
            <WeekDayCard
              key={di}
              dayName={WEEK_DAY_NAMES[di]}
              date={dt.getDate()}
              isToday={isToday(dt)}
              isWeekend={di >= 5}
              inMonth={inMonth(dt)}
              value={data[key] || ''}
              onChange={val => onSaveDay(key, val)}
            />
          );
        })}
      </div>

      {/* Row 2 */}
      <div style={weekStyles.row}>
        {row2Days.map(di => {
          const dt = currentWeekDates[di];
          const key = getKey(dt);
          return (
            <WeekDayCard
              key={di}
              dayName={WEEK_DAY_NAMES[di]}
              date={dt.getDate()}
              isToday={isToday(dt)}
              isWeekend={di >= 5}
              inMonth={inMonth(dt)}
              value={data[key] || ''}
              onChange={val => onSaveDay(key, val)}
            />
          );
        })}
      </div>
    </div>
  );
}

const weekStyles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  row: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    minHeight: 0,
  },
  card: {
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.15s',
    cursor: 'text',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexShrink: 0,
  },
  dayName: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  dateChip: {
    fontSize: 11,
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
  },
  arrowDot: {
    color: 'rgba(var(--accent-rgb),0.4)',
    fontSize: 10,
    marginLeft: 'auto',
  },
  dayArea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 12,
    lineHeight: 1.7,
    resize: 'none',
    fontFamily: 'inherit',
    padding: 0,
    width: '100%',
  },
  sidePanel: {
    borderRadius: 12,
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(var(--accent-rgb),0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflow: 'hidden',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'rgba(var(--text-rgb),0.7)',
    letterSpacing: '0.05em',
  },
  monthBadge: {
    display: 'inline-block',
    background: 'var(--accent)',
    color: 'var(--bg)',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 14px',
    borderRadius: 20,
    letterSpacing: '0.03em',
    textAlign: 'center',
  },
  miniCalWrap: {
    flex: 1,
  },
  miniCalHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    marginBottom: 4,
  },
  weekTabsRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  weekTab: {
    fontSize: 10,
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.05em',
    border: '1px solid rgba(var(--accent-rgb),0.25)',
  },
};

Object.assign(window, { WeekView });
