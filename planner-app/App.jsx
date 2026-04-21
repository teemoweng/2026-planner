// Main App — orchestrates all views with cloud-backed persistence.
// Data is stored as one JSON blob per user in Supabase (user_data table),
// loaded at sign-in and debounce-saved on every change.
const { useState, useEffect, useCallback, useRef } = React;

const VIEW_TITLES = {
  year: 'Year Calendar',
  month: 'Monthly Plan',
  week: 'Weekly Plan',
  day: 'Daily Plan',
};

// ── Cloud-synced state ────────────────────────────────────────────
// Loads a single blob at mount; pushes changes back with a 700 ms debounce.
function useCloudBlob(session) {
  const [blob, setBlob] = useState(null);         // null while loading
  const [error, setError] = useState('');
  const saveTimer = useRef(null);
  const lastSaved = useRef(null);

  // Load once per session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await window.cloud.loadUserData();
        if (cancelled) return;
        setBlob(data || {});
        lastSaved.current = JSON.stringify(data || {});
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // Debounced push
  useEffect(() => {
    if (blob === null) return;
    const serialized = JSON.stringify(blob);
    if (serialized === lastSaved.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.cloud.saveUserData(blob);
        lastSaved.current = serialized;
      } catch (e) {
        setError(e.message || String(e));
      }
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [blob]);

  return [blob, setBlob, error];
}

function PlannerApp({ session }) {
  const today = new Date();
  const [blob, setBlob, cloudError] = useCloudBlob(session);

  // Fatal load error — show it instead of spinning forever
  if (blob === null && cloudError) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'var(--bg)', color: 'var(--text)', padding: 40,
        fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 14, color: 'var(--accent)' }}>☁ 云同步失败</div>
        <div style={{ fontSize: 12, color: 'rgba(var(--text-rgb),0.6)', maxWidth: 560, textAlign: 'center', lineHeight: 1.6 }}>
          {cloudError}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={() => location.reload()} style={{
            padding: '8px 16px', background: 'var(--accent)', color: 'var(--bg)',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>重试</button>
          <button onClick={() => window.cloud.signOut()} style={{
            padding: '8px 16px', background: 'transparent', color: 'rgba(var(--text-rgb),0.6)',
            border: '1px solid rgba(var(--accent-rgb),0.25)', borderRadius: 6, cursor: 'pointer', fontSize: 12,
          }}>登出</button>
        </div>
      </div>
    );
  }

  // While loading the blob, show a simple spinner
  if (blob === null) return <LoadingScreen label="Loading your planner…" />;

  return <PlannerUI session={session} blob={blob} setBlob={setBlob} cloudError={cloudError} />;
}

function PlannerUI({ session, blob, setBlob, cloudError }) {
  const today = new Date();

  // Convenience helpers to read/write slices of the blob
  const patch = useCallback((slice, updater) => {
    setBlob(prev => {
      const prevSlice = prev[slice] || {};
      const next = typeof updater === 'function' ? updater(prevSlice) : updater;
      return { ...prev, [slice]: next };
    });
  }, [setBlob]);

  const settings = blob.settings || {};
  const setSetting = (k, v) => patch('settings', s => ({ ...s, [k]: v }));

  const [theme, _setTheme]               = useState(settings.theme || 'amber');
  const [view, _setView]                 = useState(settings.view || 'month');
  const [year, _setYear]                 = useState(settings.year || today.getFullYear());
  const [month, _setMonth]               = useState(typeof settings.month === 'number' ? settings.month : today.getMonth());
  const [selectedDay, _setSelectedDay]   = useState(settings.selectedDay || today.getDate());
  const [showCover, _setShowCover]       = useState(!settings.started);

  // Mirror local UI state back to the blob so it persists
  useEffect(() => { setSetting('theme', theme); }, [theme]);
  useEffect(() => { setSetting('view', view); }, [view]);
  useEffect(() => { setSetting('year', year); }, [year]);
  useEffect(() => { setSetting('month', month); }, [month]);
  useEffect(() => { setSetting('selectedDay', selectedDay); }, [selectedDay]);

  const setTheme        = (v) => _setTheme(v);
  const setView         = (v) => _setView(v);
  const setYear         = (v) => _setYear(typeof v === 'function' ? (cur => v(cur)) : v);
  const setMonth        = (v) => _setMonth(typeof v === 'function' ? (cur => v(cur)) : v);
  const setSelectedDay  = (v) => _setSelectedDay(typeof v === 'function' ? (cur => v(cur)) : v);
  const setShowCover    = (v) => _setShowCover(v);

  const [selectedWeek, setSelectedWeek] = useState(null);
  const [hoveredWeek,  setHoveredWeek]  = useState(null);
  const [monthDir,     setMonthDir]     = useState('none');
  const [aiOpen,       setAiOpen]       = useState(false);

  const data      = blob.data      || {};
  const weekData  = blob.weekData  || {};
  const dayData   = blob.dayData   || {};
  const notes     = blob.notes     || {};

  const setData      = (u) => patch('data',     u);
  const setWeekData  = (u) => patch('weekData', u);
  const setDayData   = (u) => patch('dayData',  u);
  const setNotes     = (u) => patch('notes',    u);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
    setYear(y); setMonth(m); setSelectedDay(d); setView('day');
  }, []);

  // Apply AI actions — unchanged from the offline version
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
        setData(cur => {
          const prev = cur[d] || '';
          const line = a.text.startsWith('•') || a.text.startsWith('-') ? a.text : `• ${a.text}`;
          return { ...cur, [d]: prev ? `${prev}\n${line}` : line };
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
          return { ...cur, [d]: { ...(cur[d] || {}), notes: prev ? `${prev}\n${a.text}` : a.text } };
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
          return { ...cur, [d]: { ...day, meals: { ...(day.meals || {}), [a.meal]: a.text } } };
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
    if (wi === null) { setSelectedWeek(null); setView('month'); }
    else             { setSelectedWeek(wi);   setView('week');  }
  }, []);

  const notesKey     = `${year}-${String(month + 1).padStart(2,'0')}`;
  const currentNotes = notes[notesKey] || '';
  const title        = VIEW_TITLES[view] || '';
  const showSidebar  = view !== 'week' && view !== 'day';

  if (showCover) {
    return <CoverPage
      theme={theme}
      onThemeChange={setTheme}
      onStart={() => { setSetting('started', true); setShowCover(false); }}
    />;
  }

  return (
    <div style={appStyles.app} className="p-app-shell">
      <div style={appStyles.texture} />
      {cloudError && (
        <div style={appStyles.errorBar}>
          Cloud sync error: {cloudError}
        </div>
      )}
      <div style={appStyles.inner}>
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
              userEmail={session?.user?.email}
              onSignOut={() => window.cloud.signOut()}
            />
          </div>

          <div style={appStyles.content} className="p-app-content">
            <div key={view} className="p-view-swap" style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
              {view === 'year' && (
                <YearView
                  year={year}
                  data={data}
                  onSelectMonth={handleMonthSelect}
                  onBackToCover={() => { setSetting('started', false); setShowCover(true); }}
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

      <AIChat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        context={{
          view,
          year,
          currentMonth: `${year}-${String(month + 1).padStart(2,'0')}`,
          currentDate:  `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`,
        }}
        onApplyActions={handleAIActions}
      />
    </div>
  );
}

const appStyles = {
  app: {
    width: '100vw', height: '100vh',
    background: 'var(--bg)',
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
    color: 'var(--text)',
    overflow: 'hidden', position: 'relative',
  },
  texture: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(var(--text-rgb),0.04) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    pointerEvents: 'none', zIndex: 0,
  },
  inner: { position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%' },
  main:  { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' },
  content: { flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' },
  errorBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    padding: '6px 16px', fontSize: 11,
    background: 'rgba(220,80,80,0.15)',
    color: 'rgba(255,180,180,0.95)',
    textAlign: 'center', letterSpacing: '0.04em',
  },
};

function RootApp() {
  return (
    <AuthGate>
      {(session) => <PlannerApp session={session} />}
    </AuthGate>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<RootApp />);
