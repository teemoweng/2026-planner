
// CalendarGrid: main 7-column month grid with editable day cells
const { useState, useRef, useEffect, useCallback } = React;

const DOW_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DayCell({ day, isToday, isCurrent, isWeekend, cellData, onSave, onOpenDay, year, month }) {
  const [value, setValue] = useState(cellData || '');
  useEffect(() => { setValue(cellData || ''); }, [cellData]);

  return (
    <div
      className={isCurrent ? 'p-day-cell' : ''}
      style={{
        ...gridStyles.cell,
        background: isWeekend ? 'rgba(255,255,255,0.018)' : 'transparent',
        border: '1px solid rgba(var(--accent-rgb),0.08)',
        position: 'relative',
        opacity: isCurrent ? 1 : 0.25,
      }}
      onClick={isCurrent ? (e => e.currentTarget.querySelector('textarea')?.focus()) : undefined}
    >
      <div style={gridStyles.dateNum}>
        <span
          className={isCurrent ? 'p-day-num-clickable' : ''}
          onClick={isCurrent ? (e => { e.stopPropagation(); onOpenDay && onOpenDay(year, month, day); }) : undefined}
          style={{
          ...gridStyles.dateNumInner,
          background: isToday ? 'var(--accent)' : 'transparent',
          color: isToday ? 'var(--bg)' : (isWeekend ? 'rgba(var(--accent-rgb),0.85)' : 'rgba(var(--text-rgb),0.55)'),
          fontWeight: isToday ? 700 : 400,
          cursor: isCurrent ? 'pointer' : 'default',
        }}>
          {day}
        </span>
      </div>
      {isCurrent && (
        <div style={{ position: 'absolute', top: 32, left: 14, right: 0, bottom: 6, overflowY: 'auto' }}>
          <MarkdownEditor
            value={value}
            onChange={val => { setValue(val); onSave(val); }}
            placeholder=""
            style={{ fontSize: 13, lineHeight: 1.65 }}
            minHeight={20}
          />
        </div>
      )}
    </div>
  );
}

// Compute weeks for a month using Mon-Sun rule:
// A week belongs to the month where its SUNDAY falls.
function computeMonthWeeks(year, month) {
  const weeks = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0) { // Sunday
      const monday = new Date(year, month, d - 6);
      weeks.push({ monDate: monday, sunDate: date });
    }
  }
  return weeks;
}

function CalendarGrid({ year, month, selectedWeek, hoveredWeek, data, onSaveDay, onOpenDay }) {
  const today = new Date();
  const weekStarts = computeMonthWeeks(year, month);
  const weeks = weekStarts.map((w, wi) => {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(w.monDate);
      cur.setDate(cur.getDate() + d);
      const actualDay = cur.getDate();
      const actualMonth = cur.getMonth();
      const actualYear = cur.getFullYear();
      const isCurrent = actualMonth === month && actualYear === year;
      const isToday = today.getFullYear() === actualYear && today.getMonth() === actualMonth && today.getDate() === actualDay;
      row.push({ day: actualDay, month: actualMonth, year: actualYear, isCurrent, isToday, weekIndex: wi });
    }
    return row;
  });

  return (
    <div style={gridStyles.grid}>
      {/* Day of week headers */}
      <div style={gridStyles.headerRow}>
        {DOW_LABELS.map((label, i) => (
          <div key={i} style={{
            ...gridStyles.headerCell,
            color: i >= 5 ? 'rgba(var(--accent-rgb),0.7)' : 'rgba(var(--text-rgb),0.4)',
          }}>
            <span style={gridStyles.headerLong}>{label}</span>
            <span style={gridStyles.headerShort}>{DOW_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div style={gridStyles.weeksContainer}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{
            ...gridStyles.weekRow,
            flex: `1 1 ${100 / weeks.length}%`,
            background: hoveredWeek === wi ? 'rgba(var(--accent-rgb),0.04)' : 'transparent',
            transition: 'background 0.15s',
          }}>
            {week.map((cell, di) => {
              const key = `${cell.year}-${String(cell.month + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
              return (
                <DayCell
                  key={di}
                  day={cell.day}
                  year={cell.year}
                  month={cell.month}
                  isToday={cell.isToday}
                  isCurrent={cell.isCurrent}
                  isWeekend={di >= 5}
                  cellData={data[key]}
                  onSave={val => onSaveDay(key, val)}
                  onOpenDay={onOpenDay}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const gridStyles = {
  grid: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '0 0 0 0',
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.15)',
    flexShrink: 0,
  },
  headerCell: {
    padding: '8px 10px 8px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderRight: '1px solid rgba(var(--accent-rgb),0.08)',
  },
  headerLong: {
    display: 'inline',
  },
  headerShort: {
    display: 'none',
  },
  weeksContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.08)',
    minHeight: 0,
  },
  cell: {
    borderRight: '1px solid rgba(var(--accent-rgb),0.08)',
    padding: '6px 10px 6px 14px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.15s, background 0.15s',
    position: 'relative',
    minHeight: 0,
    overflow: 'hidden',
  },
  dateNum: {
    marginBottom: 4,
    flexShrink: 0,
  },
  dateNumInner: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 0,
    transition: 'background 0.15s',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  contentText: {
    fontSize: 11,
    color: 'rgba(var(--text-rgb),0.8)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
  textarea: {
    flex: 1,
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 11,
    lineHeight: 1.6,
    resize: 'none',
    fontFamily: 'inherit',
    padding: 0,
    minHeight: 60,
  },
};

Object.assign(window, { CalendarGrid });
