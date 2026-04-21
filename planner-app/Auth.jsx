// Auth module: users list + current user + namespaced storage for all per-user planner data
// Stored as plain localStorage (no backend, no real password)

const AUTH_USERS_KEY = 'planner_users';
const AUTH_CURRENT_KEY = 'planner_current_user';

// 6 avatar palette swatches (bg + fg contrast)
const AVATAR_COLORS = [
  { id: 'amber',  bg: '#c9a260', fg: '#1c1a17', label: 'Amber' },
  { id: 'rose',   bg: '#f1b3c0', fg: '#5c2a3a', label: 'Rose' },
  { id: 'sage',   bg: '#a8c09a', fg: '#263521', label: 'Sage' },
  { id: 'sky',    bg: '#9fc5e3', fg: '#1a3050', label: 'Sky' },
  { id: 'lilac',  bg: '#c4a6d4', fg: '#3a2848', label: 'Lilac' },
  { id: 'coral',  bg: '#eb9982', fg: '#4a1f12', label: 'Coral' },
];

function getAvatarColor(id) {
  return AVATAR_COLORS.find(c => c.id === id) || AVATAR_COLORS[0];
}

// Data keys that should be namespaced per-user (i.e. scoped to the logged-in user)
const SCOPED_BASE_KEYS = [
  'planner_2026_data',
  'planner_2026_week_data',
  'planner_2026_notes',
  'planner_2026_day_data',
  'planner_theme',
  'planner_view',
  'planner_year',
  'planner_month',
  'planner_day',
  'planner_started',
];

function _loadUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]'); }
  catch { return []; }
}
function _saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}
function _getCurrentId() {
  return localStorage.getItem(AUTH_CURRENT_KEY) || '';
}
function _setCurrentId(id) {
  if (id) localStorage.setItem(AUTH_CURRENT_KEY, id);
  else localStorage.removeItem(AUTH_CURRENT_KEY);
}

// Rename existing unsuffixed keys to be scoped under a given user id (runs once on first init)
function _migrateLegacyKeysTo(uid) {
  SCOPED_BASE_KEYS.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) {
      const scoped = `${k}:${uid}`;
      if (localStorage.getItem(scoped) === null) {
        localStorage.setItem(scoped, val);
      }
      localStorage.removeItem(k);
    }
  });
}

// Run this once before App mounts — ensures a current user exists
function ensureInitialUser() {
  let users = _loadUsers();
  if (users.length === 0) {
    // First visit: create a default user and migrate any existing (legacy, unsuffixed) planner data into it.
    const defaultUser = {
      id: 'u_default',
      name: '我',
      email: 'me@planner.local',
      color: 'amber',
      createdAt: Date.now(),
    };
    users = [defaultUser];
    _saveUsers(users);
    _setCurrentId(defaultUser.id);
    _migrateLegacyKeysTo(defaultUser.id);
  } else if (!_getCurrentId() || !users.find(u => u.id === _getCurrentId())) {
    _setCurrentId(users[0].id);
  }
  return { users, currentId: _getCurrentId() };
}

function uKey(baseName) {
  const id = _getCurrentId() || 'u_default';
  return `${baseName}:${id}`;
}

function createUser({ name, email, color }) {
  const users = _loadUsers();
  const id = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const user = {
    id,
    name: (name || '').trim() || 'User',
    email: (email || '').trim(),
    color: color || 'amber',
    createdAt: Date.now(),
  };
  users.push(user);
  _saveUsers(users);
  return user;
}

function updateUser(id, patch) {
  const users = _loadUsers();
  const i = users.findIndex(u => u.id === id);
  if (i === -1) return null;
  users[i] = { ...users[i], ...patch };
  _saveUsers(users);
  return users[i];
}

function deleteUser(id) {
  let users = _loadUsers();
  users = users.filter(u => u.id !== id);
  _saveUsers(users);
  // drop all of this user's scoped data
  SCOPED_BASE_KEYS.forEach(k => localStorage.removeItem(`${k}:${id}`));
  if (_getCurrentId() === id) {
    _setCurrentId(users[0] ? users[0].id : '');
  }
  return users;
}

function switchUser(id) {
  const users = _loadUsers();
  if (!users.find(u => u.id === id)) return false;
  _setCurrentId(id);
  return true;
}

function computeStats(uid) {
  try {
    const data = JSON.parse(localStorage.getItem(`planner_2026_data:${uid}`) || '{}');
    const dayData = JSON.parse(localStorage.getItem(`planner_2026_day_data:${uid}`) || '{}');
    const daysSet = new Set();
    Object.keys(data).forEach(k => { if (data[k] && String(data[k]).trim()) daysSet.add(k); });
    Object.keys(dayData).forEach(k => {
      const d = dayData[k];
      if (!d) return;
      const has = (d.schedule && Object.keys(d.schedule).some(h => d.schedule[h])) ||
                  (d.notes && d.notes.trim()) ||
                  (d.mainFocus && d.mainFocus.trim()) ||
                  (d.todos && d.todos.some(t => t && t.text)) ||
                  d.weather || d.mood ||
                  (typeof d.water === 'number' && d.water > 0) ||
                  (typeof d.sleep === 'number' && d.sleep > 0);
      if (has) daysSet.add(k);
    });
    let todosDone = 0, todosTotal = 0;
    Object.values(dayData).forEach(d => {
      if (d && d.todos) d.todos.forEach(t => {
        if (t && t.text) { todosTotal++; if (t.done) todosDone++; }
      });
    });
    return { days: daysSet.size, todosDone, todosTotal };
  } catch { return { days: 0, todosDone: 0, todosTotal: 0 }; }
}

Object.assign(window, {
  AVATAR_COLORS,
  getAvatarColor,
  ensureInitialUser,
  _loadUsers_: _loadUsers,
  _getCurrentId_: _getCurrentId,
  createUser,
  updateUser,
  deleteUser,
  switchUser,
  computeStats,
  uKey,
});
