
// CoverPage: launch screen with "2026 Start from here" and PLANNER logo
const THEMES = [
  { id: 'amber',    label: '暖棕金', swatch: ['#1c1a17', '#c9a260'] },
  { id: 'graphite', label: '石墨蓝', swatch: ['#1a2238', '#c9a260'] },
  { id: 'rose',     label: '玫瑰粉', swatch: ['#8e4e62', '#fadde1'] },
  { id: 'smoky',    label: '烟粉色', swatch: ['#2d4358', '#d4a5a5'] },
];

function CoverPage({ onStart, theme = 'amber', onThemeChange }) {
  const [exiting, setExiting] = React.useState(false);
  const rootRef = React.useRef(null);

  // Subtle mouse parallax
  React.useEffect(() => {
    const handleMove = (e) => {
      if (!rootRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      rootRef.current.style.setProperty('--mx', x.toFixed(3));
      rootRef.current.style.setProperty('--my', y.toFixed(3));
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const handleStart = () => {
    setExiting(true);
    setTimeout(() => onStart(), 700);
  };

  const plannerLetters = ['P','L','A','N','N','E','R'];
  const yearDigits = ['2','0','2','6'];

  return (
    <div
      ref={rootRef}
      style={coverStyles.root}
      className={`p-cover-root ${exiting ? 'p-cover-exit' : ''}`}
    >
      <div style={coverStyles.texture} className="p-cover-texture" />
      <div style={coverStyles.vignette} className="p-cover-vignette" />

      {/* Decorative arc (bottom-right curve), drawn on enter */}
      <svg style={coverStyles.arc} viewBox="0 0 600 800" preserveAspectRatio="none" fill="none">
        <path
          className="p-cover-arc-path"
          d="M 1 1 L 1 500 Q 1 799 300 799 L 599 799"
          stroke="rgba(var(--accent-rgb),0.4)"
          strokeWidth="1"
        />
        {/* Gold pulse dot that travels the arc */}
        <circle r="2.5" fill="var(--accent)" className="p-cover-arc-dot">
          <animateMotion
            dur="6s"
            repeatCount="indefinite"
            begin="2.2s"
            path="M 1 1 L 1 500 Q 1 799 300 799 L 599 799"
          />
        </circle>
      </svg>

      {/* Top-left corner mark */}
      <div style={coverStyles.cornerTL} className="p-cover-corner p-cover-corner-tl">
        <div style={coverStyles.cornerLineV} />
        <div style={coverStyles.cornerLineH} />
      </div>
      {/* Bottom-right corner mark */}
      <div style={coverStyles.cornerBR} className="p-cover-corner p-cover-corner-br">
        <div style={{ ...coverStyles.cornerLineV, bottom: 0, right: 0, top: 'auto', left: 'auto' }} />
        <div style={{ ...coverStyles.cornerLineH, bottom: 0, right: 0, top: 'auto', left: 'auto' }} />
      </div>

      <div style={coverStyles.center} className="p-cover-center">
        {/* 2026 with digit-by-digit reveal */}
        <div style={coverStyles.yearWrap}>
          {yearDigits.map((d, i) => (
            <span key={i} style={coverStyles.digitMask}>
              <span
                style={{ ...coverStyles.digit, animationDelay: `${0.35 + i * 0.1}s` }}
                className="p-cover-digit"
              >{d}</span>
            </span>
          ))}
        </div>

        {/* "Start from here" */}
        <div style={coverStyles.tagline} className="p-cover-tagline">Start from here</div>

        {/* Divider: lines grow from center + diamond */}
        <div style={coverStyles.divider}>
          <span style={coverStyles.dividerLine} className="p-cover-div-line p-cover-div-line-l" />
          <span style={coverStyles.diamond} className="p-cover-diamond">◆</span>
          <span style={coverStyles.dividerLine} className="p-cover-div-line p-cover-div-line-r" />
        </div>

        {/* PLANNER letters */}
        <div style={coverStyles.planner}>
          {plannerLetters.map((l, i) => (
            <span
              key={i}
              style={{ ...coverStyles.plannerLetter, animationDelay: `${1.65 + i * 0.05}s` }}
              className="p-cover-letter"
            >{l}</span>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="p-cover-start"
          style={coverStyles.startBtn}
        >
          <span style={coverStyles.startBtnInner}>
            <span>Start</span>
            <span className="p-cover-start-arrow">›</span>
          </span>
          <span className="p-cover-start-fill" />
        </button>

        {/* Theme switcher */}
        <div style={coverStyles.themeRow} className="p-cover-themes">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`p-cover-theme-btn${theme === t.id ? ' is-active' : ''}`}
              onClick={() => onThemeChange && onThemeChange(t.id)}
              title={t.label}
              style={coverStyles.themeBtn}
            >
              <span style={{
                ...coverStyles.themeSwatch,
                background: t.swatch[0],
                borderColor: theme === t.id ? t.swatch[1] : 'rgba(var(--accent-rgb),0.25)',
              }}>
                <span style={{
                  ...coverStyles.themeSwatchDot,
                  background: t.swatch[1],
                }} />
              </span>
              <span style={{
                ...coverStyles.themeLabel,
                color: theme === t.id ? 'var(--accent)' : 'rgba(var(--text-rgb),0.5)',
              }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        /* === Parallax variables === */
        .p-cover-root {
          --mx: 0;
          --my: 0;
        }
        .p-cover-center {
          transform: translate(calc(var(--mx) * 6px), calc(var(--my) * 4px));
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .p-cover-root .p-cover-texture {
          transform: translate(calc(var(--mx) * -10px), calc(var(--my) * -6px));
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* === Entrance animations === */
        @keyframes p-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes p-textureFade {
          from { opacity: 0; }
          to   { opacity: 0.6; }
        }
        @keyframes p-vignetteFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes p-digitRise {
          0%   { transform: translateY(110%); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes p-taglineIn {
          from { opacity: 0; transform: translateY(10px); letter-spacing: 0.08em; }
          to   { opacity: 1; transform: translateY(0); letter-spacing: 0.01em; }
        }
        @keyframes p-lineGrowL {
          from { transform: scaleX(0); transform-origin: right center; }
          to   { transform: scaleX(1); transform-origin: right center; }
        }
        @keyframes p-lineGrowR {
          from { transform: scaleX(0); transform-origin: left center; }
          to   { transform: scaleX(1); transform-origin: left center; }
        }
        @keyframes p-diamondIn {
          0%   { opacity: 0; transform: rotate(-90deg) scale(0); }
          60%  { opacity: 1; transform: rotate(8deg) scale(1.25); }
          100% { opacity: 1; transform: rotate(0deg) scale(1); }
        }
        @keyframes p-diamondPulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.18); }
        }
        @keyframes p-letterIn {
          from { opacity: 0; transform: translateY(6px); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }
        @keyframes p-btnIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes p-arcDraw {
          from { stroke-dashoffset: 1800; opacity: 0; }
          20%  { opacity: 1; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes p-cornerDraw {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes p-dotPulse {
          0%, 100% { opacity: 0; }
          50%      { opacity: 1; }
        }

        /* === Applied === */
        .p-cover-texture {
          opacity: 0;
          animation: p-textureFade 2.2s ease-out 0.2s forwards;
        }
        .p-cover-vignette {
          opacity: 0;
          animation: p-vignetteFade 1.5s ease-out 0.1s forwards;
        }
        .p-cover-arc-path {
          stroke-dasharray: 1800;
          stroke-dashoffset: 1800;
          opacity: 0;
          animation: p-arcDraw 2.2s cubic-bezier(0.65, 0, 0.35, 1) 0.15s forwards;
        }
        .p-cover-arc-dot {
          animation: p-dotPulse 2s ease-in-out infinite;
        }
        .p-cover-corner {
          opacity: 0;
          animation: p-cornerDraw 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.9s forwards;
        }
        .p-cover-digit {
          display: inline-block;
          transform: translateY(110%);
          opacity: 0;
          animation: p-digitRise 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .p-cover-tagline {
          opacity: 0;
          animation: p-taglineIn 1.1s cubic-bezier(0.22, 1, 0.36, 1) 1.05s forwards;
        }
        .p-cover-div-line {
          opacity: 0;
          animation: p-fadein 0.6s ease-out 1.35s forwards;
        }
        .p-cover-div-line-l {
          animation: p-lineGrowL 0.8s cubic-bezier(0.22, 1, 0.36, 1) 1.35s forwards, p-fadein 0.6s ease-out 1.35s forwards;
        }
        .p-cover-div-line-r {
          animation: p-lineGrowR 0.8s cubic-bezier(0.22, 1, 0.36, 1) 1.35s forwards, p-fadein 0.6s ease-out 1.35s forwards;
        }
        .p-cover-diamond {
          opacity: 0;
          display: inline-block;
          animation: p-diamondIn 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards,
                     p-diamondPulse 3.5s ease-in-out 2.6s infinite;
        }
        .p-cover-letter {
          display: inline-block;
          opacity: 0;
          animation: p-letterIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .p-cover-start {
          opacity: 0;
          animation: p-btnIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 2.1s forwards;
          position: relative;
          overflow: hidden;
          transition: color 0.35s ease, border-color 0.35s ease, transform 0.25s ease, box-shadow 0.35s ease;
        }
        .p-cover-start-fill {
          position: absolute;
          inset: 0;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.5s cubic-bezier(0.77, 0, 0.18, 1);
          z-index: 0;
        }
        .p-cover-start:hover .p-cover-start-fill {
          transform: scaleX(1);
        }
        .p-cover-start:hover {
          color: var(--bg) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 10px 28px rgba(var(--accent-rgb),0.22);
        }
        .p-cover-start:active {
          transform: translateY(1px);
        }
        .p-cover-start-arrow {
          display: inline-block;
          margin-left: 10px;
          font-size: 14px;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .p-cover-start:hover .p-cover-start-arrow {
          transform: translateX(6px);
        }

        /* === Exit animation (when Start clicked) === */
        .p-cover-exit .p-cover-center {
          animation: p-exitUp 0.7s cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }
        .p-cover-exit {
          animation: p-exitFade 0.7s ease-in forwards;
        }
        @keyframes p-exitUp {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-30px) scale(0.98); }
        }
        @keyframes p-exitFade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        /* Theme switcher entrance */
        .p-cover-themes {
          opacity: 0;
          animation: p-btnIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 2.35s forwards;
        }
        .p-cover-theme-btn:hover .p-cover-theme-label { color: var(--accent) !important; }
        .p-cover-theme-btn:hover > span:first-child {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.35);
        }
        .p-cover-theme-btn.is-active > span:first-child {
          transform: scale(1.12);
          border-width: 1.5px !important;
        }
        .p-cover-theme-btn.is-active > span:first-child > span {
          transform: scale(1.15);
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .p-cover-digit, .p-cover-tagline, .p-cover-div-line,
          .p-cover-diamond, .p-cover-letter, .p-cover-start,
          .p-cover-arc-path, .p-cover-corner, .p-cover-texture,
          .p-cover-vignette {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

const coverStyles = {
  root: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
  },
  texture: {
    position: 'absolute', inset: 0,
    backgroundImage: "radial-gradient(rgba(var(--accent-rgb),0.04) 1px, transparent 1px)",
    backgroundSize: '6px 6px',
    pointerEvents: 'none',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
    pointerEvents: 'none',
  },
  arc: {
    position: 'absolute',
    right: '8%',
    top: '6%',
    width: '42%',
    height: '82%',
    pointerEvents: 'none',
  },
  cornerTL: {
    position: 'absolute',
    top: 40, left: 40,
    width: 28, height: 28,
    pointerEvents: 'none',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 40, right: 40,
    width: 28, height: 28,
    pointerEvents: 'none',
  },
  cornerLineV: {
    position: 'absolute', top: 0, left: 0,
    width: 1, height: 28,
    background: 'rgba(var(--accent-rgb),0.5)',
  },
  cornerLineH: {
    position: 'absolute', top: 0, left: 0,
    height: 1, width: 28,
    background: 'rgba(var(--accent-rgb),0.5)',
  },
  center: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 2,
  },
  yearWrap: {
    display: 'flex',
    marginBottom: 18,
    lineHeight: 1,
  },
  digitMask: {
    display: 'inline-block',
    overflow: 'hidden',
    lineHeight: 1,
  },
  digit: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    fontSize: 180,
    fontWeight: 500,
    color: 'var(--text)',
    letterSpacing: '0.02em',
    lineHeight: 1,
    display: 'inline-block',
  },
  tagline: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    fontSize: 44,
    fontStyle: 'italic',
    color: 'var(--accent)',
    letterSpacing: '0.01em',
    marginBottom: 28,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    width: 60,
    height: 1,
    background: 'rgba(var(--accent-rgb),0.5)',
    display: 'inline-block',
  },
  diamond: {
    color: 'var(--accent)',
    fontSize: 10,
  },
  planner: {
    fontSize: 14,
    color: 'var(--accent)',
    fontWeight: 500,
    marginBottom: 48,
    display: 'flex',
    gap: '0.45em',
  },
  plannerLetter: {
    display: 'inline-block',
  },
  startBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 38px',
    fontSize: 15,
    letterSpacing: '0.25em',
    color: 'var(--accent)',
    background: 'transparent',
    border: '1px solid rgba(var(--accent-rgb),0.55)',
    borderRadius: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    textTransform: 'uppercase',
    outline: 'none',
  },
  startBtnInner: {
    position: 'relative',
    zIndex: 1,
    display: 'inline-flex',
    alignItems: 'center',
  },
  themeRow: {
    display: 'flex',
    gap: 28,
    marginTop: 44,
    justifyContent: 'center',
  },
  themeBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    fontFamily: 'inherit',
    outline: 'none',
  },
  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid rgba(var(--accent-rgb),0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  themeSwatchDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  themeLabel: {
    fontSize: 10,
    letterSpacing: '0.18em',
    transition: 'color 0.3s ease',
  },
};

Object.assign(window, { CoverPage });
