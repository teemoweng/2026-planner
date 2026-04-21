
// Main App - orchestrates all views with localStorage persistence
const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = 'planner_2026_data';
const STORAGE_KEY_WEEK = 'planner_2026_week_data';
const STORAGE_KEY_NOTES = 'planner_2026_notes';

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function loadWeekData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_WEEK) || '{}'); } catch { return {}; }
}
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || '{}'); } catch { return {}; }
}

const VIEW_TITLES = {
  year: 'Year Calendar',
  month: 'Monthly Plan',
  week: 'Weekly Plan',
  day: 'Daily Plan',
};

function App() {
  const today = new Date();
  const [showCover, setShowCover] = useState(() => localStorage.getItem('planner_started') !== '1');
  const [theme, setTheme] = useState(() => localStorage.getItem('planner_theme') || 'amber');
  const [view, setView] = useState(() => localStorage.getItem('planner_view') || 'month');
  const [year, setYear] = useState(() => parseInt(localStorage.getItem('planner_year') || today.getFullYear()));
  const [month, setMonth] = useState(() => parseInt(localStorage.getItem('planner_month') ?? today.getMonth()));
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [hoveredWeek, setHoveredWeek] = useState(null);
  const [monthDir, setMonthDir] = useState('none'); // 'next' | 'prev' | 'none'
  const [selectedDay, setSelectedDay] = useState(() => parseInt(localStorage.getItem('planner_day') || today.getDate()));
  const [aiOpen, setAiOpen] = useState(false);
  const [data, setData] = useState(loadData);
  const [weekData, setWeekData] = useState(loadWeekData);
  const [dayData, setDayData] = useState(() => { try { return JSON.parse(localStorage.getItem('planner_2026_day_data') || '{}'); } catch { return {}; } });
  const [notes, setNotes] = useState(loadNotes);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('planner_theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('planner_view', view); }, [view]);
  useEffect(() => { localStorage.setItem('planner_year', year); }, [year]);
  useEffect(() => { localStorage.setItem('planner_month', month); }, [month]);
  useEffect(() => { localStorage.setItem('planner_day', selectedDay); }, [selectedDay]);
  useEffect(() => { localStorage.setItem('planner_2026_day_data', JSON.stringify(dayData)); }, [dayData]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_WEEK, JSON.stringify(weekData)); }, [weekData]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes)); }, [notes]);

  const handleSaveDay = useCallback((key, val) => {
    setData(d => ({ ...d, [key]: val }));
  }, []);

  const handleSaveWeekDay = useCallback((key, val) => {
    setWeekData(d => ({ ...d, [key]: val }));
  }, []);

  const handleSaveDayField = useCallback((dateKey, field, val) => {
    setDayData(d => ({
      ...d,
      [dateKey]: { ...(d[dateKey] || {}), [field]: val }
    }));
  }, []);

  const handleOpenDay = useCallback((y, m, d) => {
    setYear(y);
    setMonth(m);
    setSelectedDay(d);
    setView('day');
  }, []);

  // Apply an action (or array of actions) from AI chat
  const handleAIActions = useCallback((actions) => {
    actions.forEach(a => {
      if (!a || !a.type) return;
      if (a.type === 'navigate') {
        if (a.date) {
          const [y, m, d] = a.date.split('-').map(n => parseInt(n, 10));
          if (!isNaN(y)) setYear(y);
          if (!isNaN(m)) setMonth(m - 1);
          if (!isNaN(d) && a.view === 'day') setSelectedDay(d);
        }
        if (a.view) setView(a.view);
        return;
      }
      const d = a.date;
      if (!d) return;
      if (a.type === 'add_monthly_note') {
        // Append to day cell in monthly grid
        setData(cur => {
          const prev = cur[d] || '';
          const line = a.text.startsWith('•') || a.text.startsWith('-') ? a.text : `• ${a.text}`;
          const next = prev ? `${prev}\n${line}` : line;
          return { ...cur, [d]: next };
        });
      } else if (a.type === 'add_schedule') {
        const hour = String(a.hour || '00').padStart(2, '0');
        setDayData(cur => {
          const day = cur[d] || {};
          const sched = { ...(day.schedule || {}) };
          sched[hour] = sched[hour] ? `${sched[hour]}、${a.text}` : a.text;
          return { ...cur, [d]: { ...day, schedule: sched } };
        });
      } else if (a.type === 'add_todo') {
        setDayData(cur => {
          const day = cur[d] || {};
          const todos = day.todos ? [...day.todos] : Array(12).fill(null).map(() => ({ text: '', done: false }));
          const firstEmpty = todos.findIndex(t => !t.text);
          if (firstEmpty !== -1) todos[firstEmpty] = { text: a.text, done: false };
          else todos.push({ text: a.text, done: false });
          return { ...cur, [d]: { ...day, todos } };
        });
      } else if (a.type === 'set_main_focus') {
        setDayData(cur => ({ ...cur, [d]: { ...(cur[d] || {}), mainFocus: a.text } }));
      } else if (a.type === 'append_day_notes') {
        setDayData(cur => {
          const prev = (cur[d] || {}).notes || '';
          const next = prev ? `${prev}\n${a.text}` : a.text;
          return { ...cur, [d]: { ...(cur[d] || {}), notes: next } };
        });
      } else if (a.type === 'set_weather') {
        setDayData(cur => ({ ...cur, [d]: { ...(cur[d] || {}), weather: a.value } }));
      } else if (a.type === 'set_mood') {
        setDayData(cur => ({ ...cur, [d]: { ...(cur[d] || {}), mood: a.value } }));
      } else if (a.type === 'set_water') {
        setDayData(cur => ({ ...cur, [d]: { ...(cur[d] || {}), water: Math.max(0, Math.min(7, Number(a.value) || 0)) } }));
      } else if (a.type === 'set_sleep') {
        setDayData(cur => ({ ...cur, [d]: { ...(cur[d] || {}), sleep: Math.max(0, Math.min(7, Number(a.value) || 0)) } }));
      } else if (a.type === 'set_meal') {
        setDayData(cur => {
          const day = cur[d] || {};
          const meals = { ...(day.meals || {}) };
          meals[a.meal] = a.text;
          return { ...cur, [d]: { ...day, meals } };
        });
      }
    });
  }, []);

  const handleNotesChange = useCallback((val) => {
    const key = `${year}-${String(month + 1).padStart(2,'0')}`;
    setNotes(n => ({ ...n, [key]: val }));
  }, [year, month]);

  const handleMonthChange = useCallback((delta) => {
    setSelectedWeek(null);
    setMonthDir(delta > 0 ? 'next' : 'prev');
    setMonth(m => {
      let nm = m + delta;
      if (nm < 0) { setYear(y => y - 1); return 11; }
      if (nm > 11) { setYear(y => y + 1); return 0; }
      return nm;
    });
  }, []);

  const handleMonthSelect = useCallback((m) => {
    setMonthDir(m > month ? 'next' : m < month ? 'prev' : 'none');
    setMonth(m);
    setSelectedWeek(null);
    if (view === 'year') setView('month');
  }, [view, month]);

  const handleViewChange = useCallback((v) => {
    setView(v);
    if (v !== 'week') setSelectedWeek(null);
    if (v === 'week' && selectedWeek === null) setSelectedWeek(0);
  }, [selectedWeek]);

  const handleSelectWeek = useCallback((wi) => {
    if (wi === null) {
      setSelectedWeek(null);
      setView('month');
    } else {
      setSelectedWeek(wi);
      setView('week');
    }
  }, []);

  const notesKey = `${year}-${String(month + 1).padStart(2,'0')}`;
  const currentNotes = notes[notesKey] || '';
  const title = VIEW_TITLES[view] || '';

  // In week/day view, sidebar is embedded — so no separate sidebar
  const showSidebar = view !== 'week' && view !== 'day';

  if (showCover) {
    return <CoverPage
      theme={theme}
      onThemeChange={setTheme}
      onStart={() => { localStorage.setItem('planner_started', '1'); setShowCover(false); }}
    />;
  }

  return (
    <div style={appStyles.app} className="p-app-shell">
      <div style={appStyles.texture} />
      <div style={appStyles.inner}>
        {/* Sidebar — only shown in month/year views */}
        {showSidebar && (
          <div className="p-app-sidebar" style={{ display: 'flex' }}>
            <Sidebar
              year={year}
              month={month}
              selectedWeek={selectedWeek}
              hoveredWeek={hoveredWeek}
              onSelectWeek={handleSelectWeek}
              onHoverWeek={setHoveredWeek}
              notes={currentNotes}
              onNotesChange={handleNotesChange}
              onMonthChange={handleMonthChange}
              onGoYear={() => setView('year')}
              isYearView={view === 'year'}
            />
          </div>
        )}

        <div style={appStyles.main}>
          <div className="p-app-topnav">
            <TopNav
              year={year}
              month={month}
              onMonthSelect={handleMonthSelect}
              view={view}
              onViewChange={handleViewChange}
              title={title}
              onToday={() => {
                const t = new Date();
                setYear(t.getFullYear());
                setMonth(t.getMonth());
                setSelectedDay(t.getDate());
                setSelectedWeek(null);
                setView('day');
              }}
              onAIOpen={() => setAiOpen(true)}
            />
          </div>

          <div style={appStyles.content} className="p-app-content">
            <div key={view} className="p-view-swap" style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
            {view === 'year' && (
              <YearView
                year={year}
                data={data}
                onSelectMonth={handleMonthSelect}
                onBackToCover={() => { localStorage.removeItem('planner_started'); setShowCover(true); }}
                onOpenDay={handleOpenDay}
              />
            )}
            {view === 'month' && (
              <div
                key={`${year}-${month}`}
                className={`p-month-swap p-month-swap-${monthDir}`}
                style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}
              >
                <CalendarGrid
                  year={year}
                  month={month}
                  selectedWeek={selectedWeek}
                  hoveredWeek={hoveredWeek}
                  data={data}
                  onSaveDay={handleSaveDay}
                  onOpenDay={handleOpenDay}
                />
              </div>
            )}
            {view === 'week' && (
              <WeekView
                year={year}
                month={month}
                weekIndex={selectedWeek ?? 0}
                onSelectWeek={(wi) => setSelectedWeek(wi)}
                data={weekData}
                onSaveDay={handleSaveWeekDay}
              />
            )}
            {view === 'day' && (
              <DayView
                year={year}
                month={month}
                day={selectedDay}
                dayData={dayData}
                onSaveField={handleSaveDayField}
                onSelectDay={setSelectedDay}
                onSelectWeek={handleSelectWeek}
                onJumpToMonth={() => setView('month')}
              />
            )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat drawer */}
      <AIChat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        context={{
          view,
          year,
          currentMonth: `${year}-${String(month + 1).padStart(2,'0')}`,
          currentDate: `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`,
        }}
        onApplyActions={handleAIActions}
      />
    </div>
  );
}

const appStyles = {
  app: {
    width: '100vw',
    height: '100vh',
    background: 'var(--bg)',
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
    color: 'var(--text)',
    overflow: 'hidden',
    position: 'relative',
  },
  texture: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(var(--text-rgb),0.04) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  inner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    overflow: 'hidden',
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
