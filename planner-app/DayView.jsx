// DayView: daily plan with trackers, schedule timeline, focus/todo/notes
const { useState: useStateD, useMemo: useMemoD, useCallback: useCallbackD } = React;

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_CHARS = ['M','T','W','T','F','S','S']; // Mon-Sun

// ---------- Tiny SVG icons ----------
const IconSun = ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.4 5.4l1.1 1.1M17.5 17.5l1.1 1.1M5.4 18.6l1.1-1.1M17.5 6.5l1.1-1.1" />
  </svg>
);
const IconPartlyCloudy = ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="9" r="2.5" />
    <path d="M8 3.5V5M3.5 9H5M4.8 5.8l1.1 1.1M11.2 5.8l-1.1 1.1" />
    <path d="M8.5 15a3.5 3.5 0 0 1 7-.5 3 3 0 0 1 1 5.8H9.5a3.5 3.5 0 0 1-1-5.3z" />
  </svg>
);
const IconCloud = ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17a4 4 0 0 1-.5-8 5 5 0 0 1 9.7-1A4 4 0 0 1 17 17H7z" />
  </svg>
);
const IconRain = ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 14a4 4 0 0 1-.5-8 5 5 0 0 1 9.7-1A4 4 0 0 1 17 14H7z" />
    <path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" />
  </svg>
);
const IconHeavyRain = ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 13a4 4 0 0 1-.5-8 5 5 0 0 1 9.7-1A4 4 0 0 1 17 13H7z" />
    <path d="M8 17l-1 3M11 17l-1 3M14 17l-1 3M17 17l-1 3" />
  </svg>
);
const IconStorm = ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 13a4 4 0 0 1-.5-8 5 5 0 0 1 9.7-1A4 4 0 0 1 17 13H7z" />
    <path d="M12 14l-2 4h3l-2 4" />
  </svg>
);

const WEATHERS = [
  { id: 'sun', Icon: IconSun },
  { id: 'partly', Icon: IconPartlyCloudy },
  { id: 'cloud', Icon: IconCloud },
  { id: 'rain', Icon: IconRain },
  { id: 'heavy', Icon: IconHeavyRain },
  { id: 'storm', Icon: IconStorm },
];

// Mood icons — face in circle
const makeMood = (mouth, eyes = 'dot') => ({ size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    {eyes === 'dot' && <>
      <circle cx="9" cy="10" r="0.6" fill="currentColor" />
      <circle cx="15" cy="10" r="0.6" fill="currentColor" />
    </>}
    {eyes === 'line' && <>
      <path d="M7.5 10l2 0.5M14.5 10.5l2-0.5" />
    </>}
    {eyes === 'cross' && <>
      <path d="M8 9l2 2M10 9l-2 2M14 9l2 2M16 9l-2 2" />
    </>}
    {mouth === 'flat' && <path d="M9 15h6" />}
    {mouth === 'smile' && <path d="M9 14q3 2.5 6 0" />}
    {mouth === 'grin' && <path d="M8.5 13.5q3.5 3.5 7 0 q-3.5-1-7 0z" fill="currentColor" opacity="0.15" />}
    {mouth === 'sad' && <path d="M9 15.5q3-2.5 6 0" />}
    {mouth === 'angry' && <path d="M9 15.5h6M7.5 9.5l2-1M14.5 8.5l2 1" />}
    {mouth === 'teeth' && <path d="M9 14h6v1.5H9z" />}
  </svg>
);

const MOODS = [
  { id: 'flat',  Icon: makeMood('flat') },
  { id: 'smile', Icon: makeMood('smile') },
  { id: 'grin',  Icon: makeMood('grin') },
  { id: 'sad',   Icon: makeMood('sad') },
  { id: 'angry', Icon: makeMood('angry') },
  { id: 'dead',  Icon: makeMood('flat', 'cross') },
];

// Water glass icon — outlined
const IconGlass = ({ filled, size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4h10l-1.2 16a1.5 1.5 0 0 1-1.5 1.4H9.7a1.5 1.5 0 0 1-1.5-1.4L7 4z" />
    {filled && <path d="M7.5 10 Q 9 9.5 12 10 T 16.5 10 L 15.8 20a1.5 1.5 0 0 1-1.5 1.4H9.7a1.5 1.5 0 0 1-1.5-1.4L7.5 10z" fill="currentColor" opacity="0.85" stroke="none" />}
  </svg>
);

// Moon icon for sleep
const IconMoon = ({ filled, size = 22, stroke = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.85 : 0} />
  </svg>
);

// ---------- Section header with tiny corner arrow (matching reference) ----------
function SectionHeader({ children, unit }) {
  return (
    <div style={dvStyles.sectionHeader}>
      <span style={dvStyles.sectionTitle}>{children}</span>
      <span style={dvStyles.sectionArrow}>◣</span>
      {unit && <span style={dvStyles.sectionUnit}>{unit}</span>}
    </div>
  );
}

// ---------- LEFT PANEL: day header + trackers ----------
function LeftPanel({ year, month, day, dayInfo, update, onSelectDay, onSelectWeek, onJumpToMonth }) {
  const dow = new Date(year, month, day).getDay(); // 0=Sun
  const dowIdx = dow === 0 ? 6 : dow - 1; // Mon-Sun index

  // Compute W1-W5 tabs for this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalWeeks = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month, d).getDay() === 0) totalWeeks++;
  }
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i);

  // Figure out which week the current day belongs to
  const currentWeek = useMemoD(() => {
    for (let w = 0; w < totalWeeks; w++) {
      // find the Sunday of week w
      let sundayCount = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(year, month, d).getDay() === 0) {
          if (sundayCount === w) {
            // This Sunday ends week w. Check if our day is Mon..Sun of this week
            const sundayDay = d;
            if (day >= sundayDay - 6 && day <= sundayDay) return w;
          }
          sundayCount++;
        }
      }
    }
    return null;
  }, [year, month, day, totalWeeks, daysInMonth]);

  const meals = dayInfo.meals || {};

  return (
    <div style={dvStyles.leftPanel} className="p-day-left">
      {/* Big date header */}
      <div style={dvStyles.dateHeader}>
        <span
          style={dvStyles.monthName}
          className="p-day-month-jump"
          onClick={onJumpToMonth}
          title="Go to monthly view"
        >{MONTH_SHORT[month]}</span>
        <span style={dvStyles.slash}>/</span>
        <span style={dvStyles.dayNum}>{String(day).padStart(2, '0')}</span>
      </div>

      {/* Weekday ruler M T W T F S S */}
      <div style={dvStyles.dowRuler}>
        {DOW_CHARS.map((c, i) => (
          <span key={i} style={{
            ...dvStyles.dowChar,
            color: i === dowIdx ? 'var(--bg)' : (i >= 5 ? 'rgba(var(--accent-rgb),0.55)' : 'rgba(var(--text-rgb),0.45)'),
            background: i === dowIdx ? 'var(--accent)' : 'transparent',
            fontWeight: i === dowIdx ? 700 : 500,
          }}>{c}</span>
        ))}
      </div>

      {/* W1-W5 tabs */}
      <div style={dvStyles.wTabs}>
        {weeks.map(w => (
          <button
            key={w}
            className="p-day-wtab"
            onClick={() => onSelectWeek(w)}
            style={{
              ...dvStyles.wTab,
              background: currentWeek === w ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.12)',
              color: currentWeek === w ? 'var(--bg)' : 'var(--accent)',
              fontWeight: currentWeek === w ? 700 : 600,
            }}
          >W{w + 1}</button>
        ))}
      </div>

      {/* Weather */}
      <div style={dvStyles.section}>
        <SectionHeader>Weather</SectionHeader>
        <div style={dvStyles.iconRow}>
          {WEATHERS.map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => update('weather', dayInfo.weather === id ? null : id)}
              className="p-day-icon-btn"
              style={{
                ...dvStyles.iconBtn,
                color: dayInfo.weather === id ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.45)',
                background: dayInfo.weather === id ? 'rgba(var(--accent-rgb),0.12)' : 'transparent',
              }}
            ><Icon /></button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div style={dvStyles.section}>
        <SectionHeader>Mood</SectionHeader>
        <div style={dvStyles.iconRow}>
          {MOODS.map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => update('mood', dayInfo.mood === id ? null : id)}
              className="p-day-icon-btn"
              style={{
                ...dvStyles.iconBtn,
                color: dayInfo.mood === id ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.45)',
                background: dayInfo.mood === id ? 'rgba(var(--accent-rgb),0.12)' : 'transparent',
              }}
            ><Icon /></button>
          ))}
        </div>
      </div>

      {/* Water */}
      <div style={dvStyles.section}>
        <SectionHeader unit="cup">Water</SectionHeader>
        <div style={dvStyles.iconRowTight}>
          {[0,1,2,3,4,5,6].map(i => (
            <button
              key={i}
              onClick={() => update('water', (dayInfo.water || 0) > i ? i : i + 1)}
              className="p-day-icon-btn"
              style={{
                ...dvStyles.iconBtnSmall,
                color: (dayInfo.water || 0) > i ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.45)',
              }}
            ><IconGlass filled={(dayInfo.water || 0) > i} size={20} /></button>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div style={dvStyles.section}>
        <SectionHeader unit="Hour">Sleep</SectionHeader>
        <div style={dvStyles.iconRowTight}>
          {[0,1,2,3,4,5,6].map(i => (
            <button
              key={i}
              onClick={() => update('sleep', (dayInfo.sleep || 0) > i ? i : i + 1)}
              className="p-day-icon-btn"
              style={{
                ...dvStyles.iconBtnSmall,
                color: (dayInfo.sleep || 0) > i ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.45)',
              }}
            ><IconMoon filled={(dayInfo.sleep || 0) > i} size={20} /></button>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div style={dvStyles.section}>
        <SectionHeader unit="Kcal">Meals</SectionHeader>
        <div style={dvStyles.mealsList}>
          {['Breakfast','Lunch','Dinner','Snack'].map(meal => {
            const k = meal.toLowerCase();
            return (
              <div key={meal} style={dvStyles.mealItem}>
                <span style={dvStyles.mealLabel}>{meal}</span>
                <div style={dvStyles.mealUnderline} />
                <input
                  value={meals[k] || ''}
                  onChange={e => update('meals', { ...meals, [k]: e.target.value })}
                  placeholder=""
                  style={dvStyles.mealInput}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- CENTER: schedule timeline ----------
const HOURS = (() => {
  const arr = [];
  for (let i = 0; i < 24; i++) {
    const h = (6 + i) % 24;
    // Display 24 instead of 00 per the reference aesthetic
    const lbl = h === 0 ? '24' : String(h).padStart(2, '0');
    arr.push({ key: String(h).padStart(2, '0'), label: lbl });
  }
  return arr;
})();

function ScheduleCenter({ dayInfo, update }) {
  const schedule = dayInfo.schedule || {};
  return (
    <div style={dvStyles.centerPanel} className="p-day-center">
      <div style={dvStyles.centerHeader}>
        <SectionHeader>Schedule</SectionHeader>
      </div>
      <div style={dvStyles.scheduleList}>
        {HOURS.map(({ key, label }) => (
          <div key={key} style={dvStyles.hourRow}>
            <div style={dvStyles.hourLabel}>
              <span style={dvStyles.hourLabelText}>{label}:00</span>
              <span style={dvStyles.hourDot}>•</span>
            </div>
            <div style={dvStyles.hourGrid} />
            <input
              value={schedule[key] || ''}
              onChange={e => update('schedule', { ...schedule, [key]: e.target.value })}
              className="p-day-sched-input"
              style={dvStyles.hourInput}
              placeholder=""
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- RIGHT: Main Focus / To Do / Notes ----------
function RightPanel({ dayInfo, update }) {
  const todos = dayInfo.todos || Array(12).fill(null).map(() => ({ text: '', done: false }));
  const toggleTodo = (i) => {
    const next = [...todos];
    next[i] = { ...next[i], done: !next[i].done };
    update('todos', next);
  };
  const updateTodoText = (i, text) => {
    const next = [...todos];
    next[i] = { ...next[i], text };
    update('todos', next);
  };

  return (
    <div style={dvStyles.rightPanel} className="p-day-right">
      <div style={{ ...dvStyles.section, flex: '0 0 auto' }}>
        <SectionHeader>Main Focus</SectionHeader>
        <textarea
          value={dayInfo.mainFocus || ''}
          onChange={e => update('mainFocus', e.target.value)}
          style={dvStyles.focusArea}
          placeholder=""
        />
      </div>

      <div style={{ ...dvStyles.section, flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <SectionHeader>To Do</SectionHeader>
        <div style={dvStyles.todoList}>
          {todos.map((t, i) => (
            <div key={i} style={dvStyles.todoItem}>
              <button
                onClick={() => toggleTodo(i)}
                className="p-day-todo-check"
                style={{
                  ...dvStyles.todoCheck,
                  borderColor: t.done ? 'var(--accent)' : 'rgba(var(--accent-rgb),0.5)',
                  background: t.done ? 'var(--accent)' : 'transparent',
                }}
              >
                {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}
              </button>
              <input
                value={t.text}
                onChange={e => updateTodoText(i, e.target.value)}
                style={{
                  ...dvStyles.todoInput,
                  textDecoration: t.done ? 'line-through' : 'none',
                  opacity: t.done ? 0.5 : 1,
                }}
                placeholder=""
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...dvStyles.section, flex: '0 0 auto' }}>
        <SectionHeader>Notes</SectionHeader>
        <textarea
          value={dayInfo.notes || ''}
          onChange={e => update('notes', e.target.value)}
          style={dvStyles.notesArea}
          placeholder=""
        />
      </div>
    </div>
  );
}

// ---------- Main DayView ----------
function DayView({ year, month, day, dayData, onSaveField, onSelectDay, onSelectWeek, onJumpToMonth }) {
  const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const dayInfo = dayData[dateKey] || {};
  const update = useCallbackD((field, val) => onSaveField(dateKey, field, val), [dateKey, onSaveField]);

  return (
    <div key={dateKey} style={dvStyles.dayShell} className="p-day-swap">
      <LeftPanel
        year={year} month={month} day={day}
        dayInfo={dayInfo} update={update}
        onSelectDay={onSelectDay}
        onSelectWeek={onSelectWeek}
        onJumpToMonth={onJumpToMonth}
      />
      <div style={dvStyles.divider} />
      <ScheduleCenter dayInfo={dayInfo} update={update} />
      <div style={dvStyles.divider} />
      <RightPanel dayInfo={dayInfo} update={update} />
    </div>
  );
}

const dvStyles = {
  dayShell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    minHeight: 0,
    overflow: 'hidden',
    color: 'var(--text)',
  },
  divider: {
    width: 1,
    background: 'rgba(var(--accent-rgb),0.1)',
    flexShrink: 0,
  },

  // ===== LEFT PANEL =====
  leftPanel: {
    width: 260,
    flexShrink: 0,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    gap: 0,
  },
  dateHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  monthName: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    fontSize: 54,
    fontWeight: 500,
    fontStyle: 'italic',
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1,
  },
  slash: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    color: 'rgba(var(--accent-rgb),0.45)',
    fontWeight: 300,
    margin: '0 2px',
  },
  dayNum: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    color: 'var(--accent)',
    fontWeight: 500,
    lineHeight: 1,
  },
  dowRuler: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
    marginTop: 8,
    marginBottom: 14,
  },
  dowChar: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 0',
    letterSpacing: '0.05em',
    borderRadius: 3,
    transition: 'background 0.2s, color 0.2s',
  },
  wTabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
  },
  wTab: {
    flex: 1,
    fontSize: 9,
    fontWeight: 600,
    padding: '4px 0',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },

  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '0.01em',
  },
  sectionArrow: {
    fontSize: 7,
    color: 'var(--accent)',
    transform: 'translateY(-2px)',
    letterSpacing: 0,
  },
  sectionUnit: {
    marginLeft: 'auto',
    fontSize: 10,
    color: 'rgba(var(--text-rgb),0.4)',
    fontStyle: 'italic',
    fontFamily: "'Cormorant Garamond', serif",
  },

  iconRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'nowrap',
  },
  iconRowTight: {
    display: 'flex',
    gap: 3,
    flexWrap: 'nowrap',
  },
  iconBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 3,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, background 0.15s, transform 0.15s',
  },
  iconBtnSmall: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 2,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, background 0.15s, transform 0.15s',
  },

  mealsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
    paddingBottom: 4,
  },
  mealItem: {
    position: 'relative',
  },
  mealLabel: {
    fontSize: 11,
    color: 'rgba(var(--text-rgb),0.5)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  mealUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    background: 'rgba(var(--accent-rgb),0.12)',
  },
  mealInput: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '2px 0 4px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    minHeight: 22,
  },

  // ===== CENTER =====
  centerPanel: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 22px 20px',
    overflow: 'hidden',
  },
  centerHeader: {
    marginBottom: 8,
    flexShrink: 0,
  },
  scheduleList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    borderTop: '1px solid rgba(var(--accent-rgb),0.08)',
  },
  hourRow: {
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.08)',
    minHeight: 0,
    flex: '1 1 0',
    position: 'relative',
  },
  hourGrid: {
    position: 'absolute',
    top: 0, bottom: 0, left: 62, right: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(var(--accent-rgb),0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(var(--accent-rgb),0.04) 1px, transparent 1px)
    `,
    backgroundSize: '28px 100%, 100% 50%',
    pointerEvents: 'none',
  },
  hourLabel: {
    width: 62,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px 0 4px',
    borderRight: '1px solid rgba(var(--accent-rgb),0.08)',
    background: 'rgba(var(--accent-rgb),0.02)',
  },
  hourLabelText: {
    fontSize: 11,
    color: 'rgba(var(--text-rgb),0.65)',
    fontWeight: 500,
    letterSpacing: '0.02em',
    fontFeatureSettings: '"tnum"',
  },
  hourDot: {
    color: 'var(--accent)',
    fontSize: 10,
  },
  hourInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    padding: '0 14px',
    minWidth: 0,
    position: 'relative',
    zIndex: 1,
  },

  // ===== RIGHT =====
  rightPanel: {
    width: 290,
    flexShrink: 0,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  focusArea: {
    width: '100%',
    height: 84,
    background: 'transparent',
    border: '1px solid rgba(var(--accent-rgb),0.1)',
    borderRadius: 3,
    outline: 'none',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    padding: '8px 10px',
    resize: 'none',
    lineHeight: 1.55,
    transition: 'border-color 0.15s',
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    overflowY: 'auto',
    paddingRight: 4,
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  todoCheck: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '1.2px solid',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  todoInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.1)',
    outline: 'none',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    padding: '4px 2px',
    transition: 'border-color 0.15s, opacity 0.15s',
  },
  notesArea: {
    width: '100%',
    height: 74,
    background: 'transparent',
    border: '1px solid rgba(var(--accent-rgb),0.1)',
    borderRadius: 3,
    outline: 'none',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'inherit',
    padding: '8px 10px',
    resize: 'none',
    lineHeight: 1.55,
    transition: 'border-color 0.15s',
  },
};

Object.assign(window, { DayView });
