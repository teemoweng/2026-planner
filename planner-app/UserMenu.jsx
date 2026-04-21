// UserMenu: avatar pill + dropdown + create-account dialog, mounted in CoverPage top-right
const { useState: useStateUM, useEffect: useEffectUM, useRef: useRefUM } = React;

function UserMenu({ users, currentUser, onSwitch, onLogout, onCreate, onUpdate, onDelete }) {
  const [open, setOpen] = useStateUM(false);
  const [hovered, setHovered] = useStateUM(false);
  const [showCreate, setShowCreate] = useStateUM(false);
  const [showColorPicker, setShowColorPicker] = useStateUM(false);
  const rootRef = useRefUM(null);

  const cc = getAvatarColor(currentUser.color);
  const initial = (currentUser.name || '?').trim().charAt(0).toUpperCase();
  const stats = computeStats(currentUser.id);

  useEffectUM(() => {
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setShowColorPicker(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={rootRef} style={umStyles.wrap}>
      {/* Pill */}
      <div
        className="p-um-pill"
        style={umStyles.pill}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{ ...umStyles.avatar, background: cc.bg, color: cc.fg }}>{initial}</span>
        <span style={umStyles.pillName}>{currentUser.name}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Stats tooltip on hover (only when menu closed) */}
      {hovered && !open && (
        <div style={umStyles.tooltip} className="p-um-tooltip">
          <div style={umStyles.tooltipRow}>
            <span style={umStyles.tooltipLabel}>已记录</span>
            <span style={umStyles.tooltipValue}>{stats.days} 天</span>
          </div>
          <div style={umStyles.tooltipRow}>
            <span style={umStyles.tooltipLabel}>To Do 完成</span>
            <span style={umStyles.tooltipValue}>{stats.todosDone} / {stats.todosTotal}</span>
          </div>
          {currentUser.email && (
            <div style={{ ...umStyles.tooltipRow, borderTop: '1px dashed rgba(var(--accent-rgb),0.2)', paddingTop: 6, marginTop: 4 }}>
              <span style={{ ...umStyles.tooltipLabel, fontSize: 9 }}>{currentUser.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={umStyles.dropdown} className="p-um-dropdown">
          {/* Current user header */}
          <div style={umStyles.currentRow}>
            <span style={{ ...umStyles.avatarLg, background: cc.bg, color: cc.fg }}>{initial}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={umStyles.currentName}>{currentUser.name}</div>
              <div style={umStyles.currentEmail}>{currentUser.email || '—'}</div>
            </div>
            <button
              className="p-um-color-btn"
              style={umStyles.colorBtn}
              title="换头像颜色"
              onClick={() => setShowColorPicker(p => !p)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="7" r="1.2" fill="currentColor" />
                <circle cx="17" cy="12" r="1.2" fill="currentColor" />
                <circle cx="12" cy="17" r="1.2" fill="currentColor" />
                <circle cx="7" cy="12" r="1.2" fill="currentColor" />
              </svg>
            </button>
          </div>

          {/* Color picker */}
          {showColorPicker && (
            <div style={umStyles.colorGrid}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c.id}
                  className="p-um-color-swatch"
                  style={{
                    ...umStyles.colorSwatch,
                    background: c.bg,
                    outlineColor: currentUser.color === c.id ? 'var(--accent)' : 'transparent',
                  }}
                  title={c.label}
                  onClick={() => { onUpdate(currentUser.id, { color: c.id }); setShowColorPicker(false); }}
                />
              ))}
            </div>
          )}

          {/* Stats row */}
          <div style={umStyles.statsRow}>
            <div style={umStyles.statCell}>
              <div style={umStyles.statNum}>{stats.days}</div>
              <div style={umStyles.statLabel}>Days</div>
            </div>
            <div style={umStyles.statDivider} />
            <div style={umStyles.statCell}>
              <div style={umStyles.statNum}>{stats.todosDone}</div>
              <div style={umStyles.statLabel}>Done</div>
            </div>
            <div style={umStyles.statDivider} />
            <div style={umStyles.statCell}>
              <div style={umStyles.statNum}>{stats.todosTotal - stats.todosDone}</div>
              <div style={umStyles.statLabel}>Pending</div>
            </div>
          </div>

          <div style={umStyles.divider} />

          {/* Other accounts */}
          {users.filter(u => u.id !== currentUser.id).map(u => {
            const uc = getAvatarColor(u.color);
            const init = (u.name || '?').trim().charAt(0).toUpperCase();
            return (
              <div
                key={u.id}
                className="p-um-item"
                style={umStyles.item}
                onClick={() => { onSwitch(u.id); setOpen(false); }}
              >
                <span style={{ ...umStyles.avatarSm, background: uc.bg, color: uc.fg }}>{init}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={umStyles.itemName}>{u.name}</div>
                  <div style={umStyles.itemEmail}>{u.email || '—'}</div>
                </div>
                <span style={umStyles.itemAction}>切换</span>
              </div>
            );
          })}

          {/* New account */}
          <div
            className="p-um-item"
            style={{ ...umStyles.item, color: 'var(--accent)' }}
            onClick={() => { setOpen(false); setShowCreate(true); }}
          >
            <span style={{ ...umStyles.avatarSm, background: 'transparent', border: '1px dashed rgba(var(--accent-rgb),0.5)', color: 'var(--accent)' }}>+</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>新建账号</span>
          </div>

          <div style={umStyles.divider} />

          {/* Logout */}
          <div
            className="p-um-item"
            style={{ ...umStyles.item, color: 'rgba(var(--text-rgb),0.7)' }}
            onClick={() => { setOpen(false); onLogout(); }}
          >
            <span style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </span>
            <span style={{ flex: 1, fontSize: 12 }}>退出登录</span>
          </div>

          {/* Delete account (only if >1 user, not current) */}
          {users.length > 1 && (
            <div
              className="p-um-item p-um-danger"
              style={{ ...umStyles.item, color: 'rgba(220,120,120,0.8)' }}
              onClick={() => {
                if (confirm(`删除账号 "${currentUser.name}" 的所有数据？此操作不可恢复。`)) {
                  onDelete(currentUser.id);
                  setOpen(false);
                }
              }}
            >
              <span style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </span>
              <span style={{ flex: 1, fontSize: 12 }}>删除此账号</span>
            </div>
          )}
        </div>
      )}

      {/* Create account dialog */}
      {showCreate && (
        <CreateAccountDialog
          onClose={() => setShowCreate(false)}
          onCreate={(payload) => {
            const u = onCreate(payload);
            setShowCreate(false);
            if (u) onSwitch(u.id);
          }}
        />
      )}
    </div>
  );
}

function CreateAccountDialog({ onClose, onCreate }) {
  const [name, setName] = useStateUM('');
  const [email, setEmail] = useStateUM('');
  const [color, setColor] = useStateUM('amber');

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name, email, color });
  };

  return (
    <div className="p-um-modal-backdrop" style={umStyles.modalBackdrop} onClick={onClose}>
      <div className="p-um-modal" style={umStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={umStyles.modalHeader}>
          <span style={umStyles.modalTitle}>新建账号</span>
          <button onClick={onClose} className="p-um-close" style={umStyles.modalClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        <div style={umStyles.modalBody}>
          <label style={umStyles.field}>
            <span style={umStyles.fieldLabel}>昵称</span>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="你的名字"
              style={umStyles.input}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
          </label>
          <label style={umStyles.field}>
            <span style={umStyles.fieldLabel}>邮箱</span>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@planner.local"
              style={umStyles.input}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
          </label>
          <div style={umStyles.field}>
            <span style={umStyles.fieldLabel}>头像颜色</span>
            <div style={umStyles.colorGridModal}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c.id}
                  className="p-um-color-swatch"
                  style={{
                    ...umStyles.colorSwatchModal,
                    background: c.bg,
                    outlineColor: color === c.id ? 'var(--accent)' : 'transparent',
                  }}
                  title={c.label}
                  onClick={() => setColor(c.id)}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={umStyles.modalFooter}>
          <button onClick={onClose} className="p-um-btn-sec" style={umStyles.btnSec}>取消</button>
          <button onClick={submit} disabled={!name.trim()} className="p-um-btn-pri" style={{ ...umStyles.btnPri, opacity: !name.trim() ? 0.4 : 1, cursor: !name.trim() ? 'not-allowed' : 'pointer' }}>创建</button>
        </div>
      </div>
    </div>
  );
}

const umStyles = {
  wrap: { position: 'relative', zIndex: 30 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 11px 4px 4px',
    border: '1px solid rgba(var(--accent-rgb),0.3)',
    borderRadius: 999,
    background: 'rgba(var(--bg-rgb),0.55)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
  },
  avatar: {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 12, letterSpacing: 0,
    fontFamily: "'Inter', sans-serif",
    flexShrink: 0,
  },
  avatarLg: {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15, flexShrink: 0,
  },
  avatarSm: {
    width: 24, height: 24, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 11, flexShrink: 0,
  },
  pillName: {
    fontSize: 12, fontWeight: 600, color: 'var(--text)',
    letterSpacing: '0.02em',
    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  tooltip: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
    background: 'rgba(var(--bg-rgb),0.98)',
    border: '1px solid rgba(var(--accent-rgb),0.22)',
    borderRadius: 8,
    padding: '8px 12px',
    minWidth: 180,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    animation: 'p-um-fade 0.18s ease-out',
  },
  tooltipRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 10, lineHeight: 1.8,
    letterSpacing: '0.02em',
  },
  tooltipLabel: { color: 'rgba(var(--text-rgb),0.55)' },
  tooltipValue: { color: 'var(--accent)', fontWeight: 600 },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 280,
    background: 'rgba(var(--bg-rgb),0.98)',
    border: '1px solid rgba(var(--accent-rgb),0.22)',
    borderRadius: 10,
    padding: '10px',
    boxShadow: '0 14px 36px rgba(0,0,0,0.38)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    animation: 'p-um-slide 0.22s cubic-bezier(0.22,1,0.36,1)',
  },
  currentRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '4px 6px 10px',
  },
  currentName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  currentEmail: { fontSize: 10, color: 'rgba(var(--text-rgb),0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  colorBtn: {
    width: 30, height: 30, borderRadius: 6,
    background: 'transparent', border: '1px solid rgba(var(--accent-rgb),0.18)',
    color: 'rgba(var(--text-rgb),0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    transition: 'color 0.15s, border-color 0.15s',
  },
  colorGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6,
    padding: '0 4px 10px',
  },
  colorSwatch: {
    width: '100%', aspectRatio: '1', borderRadius: '50%',
    border: 'none', outline: '2px solid transparent', outlineOffset: 2,
    cursor: 'pointer',
    transition: 'outline-color 0.15s, transform 0.15s',
  },
  statsRow: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(var(--accent-rgb),0.06)',
    border: '1px solid rgba(var(--accent-rgb),0.12)',
    borderRadius: 8,
    padding: '8px 0',
    margin: '0 0 6px',
  },
  statCell: { flex: 1, textAlign: 'center' },
  statNum: { fontSize: 16, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Playfair Display', serif", lineHeight: 1 },
  statLabel: { fontSize: 9, color: 'rgba(var(--text-rgb),0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 },
  statDivider: { width: 1, height: 22, background: 'rgba(var(--accent-rgb),0.15)' },
  divider: { height: 1, background: 'rgba(var(--accent-rgb),0.12)', margin: '6px 0' },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 6px', borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.12s',
  },
  itemName: { fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemEmail: { fontSize: 9, color: 'rgba(var(--text-rgb),0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemAction: { fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  // Modal
  modalBackdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
    animation: 'p-um-fade 0.2s',
  },
  modal: {
    width: 360, maxWidth: '90vw',
    background: 'rgba(var(--bg-rgb),0.98)',
    border: '1px solid rgba(var(--accent-rgb),0.3)',
    borderRadius: 14,
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    animation: 'p-um-pop 0.25s cubic-bezier(0.22,1,0.36,1)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 18px 12px',
    borderBottom: '1px solid rgba(var(--accent-rgb),0.12)',
  },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text)', fontWeight: 600 },
  modalClose: {
    width: 28, height: 28, border: 'none', borderRadius: 6,
    background: 'transparent', color: 'rgba(var(--text-rgb),0.5)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  modalBody: { padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 10, color: 'rgba(var(--text-rgb),0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 },
  input: {
    background: 'rgba(var(--accent-rgb),0.05)',
    border: '1px solid rgba(var(--accent-rgb),0.18)',
    borderRadius: 7,
    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
    padding: '9px 12px',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  },
  colorGridModal: {
    display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10,
    padding: '4px 0',
  },
  colorSwatchModal: {
    width: '100%', aspectRatio: '1', borderRadius: '50%',
    border: 'none', outline: '2px solid transparent', outlineOffset: 2,
    cursor: 'pointer',
    transition: 'outline-color 0.15s, transform 0.15s',
  },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '12px 18px 16px',
    borderTop: '1px solid rgba(var(--accent-rgb),0.08)',
  },
  btnSec: {
    padding: '8px 16px', borderRadius: 7,
    background: 'transparent', color: 'rgba(var(--text-rgb),0.7)',
    border: '1px solid rgba(var(--accent-rgb),0.2)',
    fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  btnPri: {
    padding: '8px 18px', borderRadius: 7,
    background: 'var(--accent)', color: 'var(--bg)',
    border: 'none',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
    transition: 'opacity 0.15s, transform 0.15s',
  },
};

Object.assign(window, { UserMenu, CreateAccountDialog });
