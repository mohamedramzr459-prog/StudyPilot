'use strict';
/* StudyPilot v2.0.0 — application runtime
   1 config | 2 utils | 3 i18n | 4 store | 5 design | 6 shell | 7 views | 8 features | 9 boot */

const APP_VERSION = '2.0.0';
const LS_KEY = 'studypilot.v2';
const LS_LEGACY = 'studypilot.v1';
const QURAN_API = 'https://api.alquran.cloud/v1';
const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio/128';

const FOUNDER = {
  name: 'Asjadh Rilwan',
  whatsapp: '0774209718',
  waLink: 'https://wa.me/94774209718',
  mission: 'Make effective learning, exam preparation, and personal development accessible to students.',
  tagline: 'Learn smarter. Prepare better. Grow every day.'
};

const TOOLS = [
  { route: 'focus', icon: '⏱', label: 'Focus' },
  { route: 'cards', icon: '🃏', label: 'Cards' },
  { route: 'quiz', icon: '❓', label: 'Quiz' },
  { route: 'exam', icon: '🎯', label: 'Exam' },
  { route: 'papers', icon: '📄', label: 'Papers' },
  { route: 'library', icon: '📚', label: 'Library' },
  { route: 'tutor', icon: '🤖', label: 'Tutor' },
  { route: 'quran', icon: '📖', label: 'Quran' },
  { route: 'stats', icon: '📊', label: 'Stats' },
  { route: 'research', icon: '🌐', label: 'Research' },
  { route: 'groups', icon: '👥', label: 'Groups' },
  { route: 'tools', icon: '🧰', label: 'Tools' }
];

/* ---------- 1. defaults ---------- */
const DEFAULT_SETTINGS = {
  theme: 'dark', accent: 'indigo', accentCustom: '#6366f1', wallpaper: 'gradient',
  glass: 2, motion: 'full', density: 'cozy', font: 'sans', fontScale: 1, lineHeight: 1.55,
  lang: 'en', landing: 'home', onboarded: false,
  widgets: ['greeting', 'quote', 'plan', 'exams', 'quick', 'stats', 'continue'],
  widgetsHidden: [], nav: ['home', 'plan', 'notes', 'revise', 'more'],
  goalMinutes: 120, focusWork: 25, focusBreak: 5, focusLong: 15,
  arabicSize: 1.45, showTranslation: true,
  notify: true, sounds: true, gamify: true, reminders: true,
  aiBase: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini', aiKey: '',
  searchProvider: 'wikipedia', searchKey: '',
  quranReciter: 'ar.alafasy', quranTranslation: 'en.sahih',
  qfClientId: '', qfClientSecret: '',
  groupName: '', groupMember: ''
};

function freshState() {
  return {
    v: 2,
    settings: { ...DEFAULT_SETTINGS },
    subjects: [], topics: [], tasks: [], exams: [], notes: [], folders: [],
    papers: [], decks: [], cards: [], quizzes: [], attempts: [], mistakes: [],
    sessions: [], xp: { total: 0, events: [] }, badges: [],
    quran: { last: null, bookmarks: [] },
    groups: [], recents: [], searches: [],
    cache: { surahList: null, surahListAt: 0 },
    focus: { running: false, remaining: 1500, break: false, label: 'General', endTs: 0 },
    transient: {},
    meta: { created: Date.now(), version: APP_VERSION }
  };
}

/* ---------- 2. utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
const uid = (p) => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
  return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
});
const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));
const today = () => new Date().toISOString().slice(0, 10);
const dateOf = (d) => new Date(d).toISOString().slice(0, 10);
const dayDiff = (d) => Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);
const fmtMin = (m) => { m = Math.round(m || 0); const h = Math.floor(m / 60); const r = m % 60; return h ? h + 'h ' + r + 'm' : r + 'm'; };
const fmtDate = (d) => { try { return new Date(d + (String(d).length === 10 ? 'T00:00:00' : '')).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(d); } };
const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); };
const debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms || 300); }; };
const isSafeUrl = (u) => /^https?:\/\//i.test(String(u || '').trim());

function toast(msg, kind) {
  const root = $('#toastRoot');
  if (!root) return;
  const n = document.createElement('div');
  n.className = 'toast ' + (kind || '');
  n.textContent = msg;
  root.appendChild(n);
  setTimeout(function () { n.style.opacity = '0'; setTimeout(function () { n.remove(); }, 300); }, 2600);
}

function closeOverlays() {
  const s = $('#sheetRoot'); if (s) s.innerHTML = '';
  const m = $('#modalRoot'); if (m) m.innerHTML = '';
}

function sheet(title, body, onMount) {
  closeOverlays();
  const root = $('#sheetRoot');
  if (!root) return;
  root.innerHTML = '<div class="scrim" data-act="close-overlay"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="grip"></div><div class="spread"><h2 style="margin:0 0 .6rem;font-size:1rem">' + esc(title) + '</h2><button class="iconbtn" data-act="close-overlay" aria-label="Close">✕</button></div><div class="sheet-body">' + body + '</div></div>';
  if (onMount) onMount(root);
}

function modal(title, body, onMount) {
  closeOverlays();
  const root = $('#modalRoot');
  if (!root) return;
  root.innerHTML = '<div class="scrim" data-act="close-overlay"></div><div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><h2>' + esc(title) + '</h2><div class="modal-body">' + body + '</div></div>';
  const f = root.querySelector('input,textarea,select,button');
  if (f) setTimeout(function () { f.focus(); }, 30);
  if (onMount) onMount(root);
}

function confirmAsk(title, msg, okLabel, onOk) {
  modal(title, '<p class="muted">' + esc(msg) + '</p><div class="row" style="margin-top:.9rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-danger" id="okBtn">' + esc(okLabel) + '</button></div>', function (r) {
    const b = r.querySelector('#okBtn');
    if (b) b.addEventListener('click', function () { closeOverlays(); onOk(); });
  });
}

function downloadFile(name, text, type) {
  const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------- 3. i18n ---------- */
const I18N = {
  en: { home: 'Home', plan: 'Plan', notes: 'Notes', revise: 'Revise', more: 'More', settings: 'Settings', tools: 'Tools', search: 'Search', today: 'Today', quick: 'Quick actions', upcoming: 'Upcoming', addTask: 'Add task', addSubject: 'New subject', addNote: 'New note', addDeck: 'New deck', addExam: 'Add exam', focus: 'Focus room', studyTime: 'Study time', streak: 'Streak', xp: 'XP', save: 'Save', cancel: 'Cancel', del: 'Delete', edit: 'Edit', install: 'Install', quran: 'Quran', stats: 'Analytics', about: 'About', groups: 'Study groups', tutor: 'AI Tutor', library: 'Library', papers: 'Past papers', quiz: 'Quizzes', exam: 'Exam simulator', mistakes: 'Mistake notebook', flashcards: 'Flashcards', continueLearning: 'Continue learning', configRequired: 'Configuration required', completed: 'Completed', whatNow: 'What should I study now?' },
  ta: { home: 'முகப்பு', plan: 'திட்டம்', notes: 'குறிப்புகள்', revise: 'திருப்புதல்', more: 'மேலும்', settings: 'அமைப்புகள்', tools: 'கருவிகள்', search: 'தேடல்', today: 'இன்று', quick: 'விரைவு செயல்கள்', upcoming: 'வரவிருக்கும்', addTask: 'பணி சேர்', addSubject: 'புதிய பாடம்', addNote: 'புதிய குறிப்பு', addDeck: 'புதிய தொகுப்பு', addExam: 'தேர்வு சேர்', focus: 'கவன அறை', studyTime: 'படிப்பு நேரம்', streak: 'தொடர்', xp: 'XP', save: 'சேமி', cancel: 'ரத்து', del: 'நீக்கு', edit: 'திருத்து', install: 'நிறுவு', quran: 'குர்ஆன்', stats: 'பகுப்பாய்வு', about: 'பற்றி', groups: 'படிப்புக் குழு', tutor: 'AI ஆசிரியர்', library: 'நூலகம்', papers: 'முந்தைய வினாத்தாள்', quiz: 'வினாடி வினா', exam: 'தேர்வு உருவகப்படுத்தி', mistakes: 'தவறு நோட்டு', flashcards: 'ஃபிளாஷ் கார்டு', continueLearning: 'தொடர்ந்து படி', configRequired: 'அமைவு தேவை', completed: 'முடிந்தது', whatNow: 'இப்போது எதைப் படிக்க வேண்டும்?' },
  si: { home: 'මුල් පිටුව', plan: 'සැලසුම', notes: 'සටහන්', revise: 'පුනරීක්ෂණ', more: 'තවත්', settings: 'සැකසුම්', tools: 'මෙවලම්', search: 'සොයන්න', today: 'අද', quick: 'ඉක්මන් ක්‍රියා', upcoming: 'ඉදිරියේ', addTask: 'කාර්යයක්', addSubject: 'නව විෂය', addNote: 'නව සටහන', addDeck: 'නව කට්ටලය', addExam: 'විභාගයක්', focus: 'අවධාන කාමරය', studyTime: 'අධ්‍යයන කාලය', streak: 'අඛණ්ඩතාව', xp: 'XP', save: 'සුරකින්න', cancel: 'අවලංගු', del: 'මකන්න', edit: 'සංස්කරණය', install: 'ස්ථාපනය', quran: 'කුර්ආනය', stats: 'විශ්ලේෂණ', about: 'පිළිබඳව', groups: 'කණ්ඩායම්', tutor: 'AI ගුරු', library: 'පුස්තකාලය', papers: 'පසුගිය ප්‍රශ්න පත්‍ර', quiz: 'ප්‍රශ්නාවලිය', exam: 'විභාග අනුකරණය', mistakes: 'වැරදි සටහන්', flashcards: 'ෆ්ලෑෂ් කාඩ්', continueLearning: 'දිගටම ඉගෙන ගන්න', configRequired: 'වින්‍යාසය අවශ්‍යයි', completed: 'සම්පූර්ණයි', whatNow: 'දැන් මොනවාද ඉගෙන ගත යුත්තේ?' }
};
const t = (k) => (I18N[state.settings.lang] && I18N[state.settings.lang][k]) || I18N.en[k] || k;

/* ---------- 4. store ---------- */
let state = freshState();

function migrate(raw) {
  const s = freshState();
  if (!raw || typeof raw !== 'object') return s;
  const out = Object.assign({}, s, raw);
  out.settings = Object.assign({}, DEFAULT_SETTINGS, raw.settings || {});
  ['subjects', 'topics', 'tasks', 'exams', 'notes', 'folders', 'papers', 'decks', 'cards', 'quizzes', 'attempts', 'mistakes', 'sessions', 'groups', 'recents', 'searches'].forEach(function (k) {
    out[k] = Array.isArray(raw[k]) ? raw[k] : [];
  });
  out.xp = { total: Number(raw.xp && raw.xp.total) || 0, events: Array.isArray(raw.xp && raw.xp.events) ? raw.xp.events : [] };
  out.quran = Object.assign({ last: null, bookmarks: [] }, raw.quran || {});
  out.cache = Object.assign({ surahList: null, surahListAt: 0 }, raw.cache || {});
  out.focus = Object.assign(s.focus, raw.focus || {});
  out.transient = {};
  out.v = 2;
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY) || localStorage.getItem(LS_LEGACY);
    state = migrate(raw ? JSON.parse(raw) : null);
  } catch (e) { state = freshState(); }
  validateSettings();
}

const save = debounce(function () {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch (e) { toast('Storage full — export a backup, then delete old items.', 'err'); }
}, 250);

function flush() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }

function validateSettings() {
  const s = state.settings;
  const pick = function (v, list, fb) { return list.indexOf(v) > -1 ? v : fb; };
  s.theme = pick(s.theme, ['dark', 'light', 'system', 'amoled', 'midnight', 'aurora', 'minimal', 'paper', 'ocean'], 'dark');
  s.accent = pick(s.accent, ['indigo', 'violet', 'teal', 'rose', 'amber', 'emerald', 'sky', 'crimson', 'custom'], 'indigo');
  s.motion = pick(s.motion, ['full', 'reduced', 'none'], 'full');
  s.density = pick(s.density, ['compact', 'cozy', 'spacious'], 'cozy');
  s.font = pick(s.font, ['sans', 'serif', 'mono'], 'sans');
  s.lang = pick(s.lang, ['en', 'ta', 'si'], 'en');
  s.glass = clamp(s.glass, 0, 3);
  s.fontScale = clamp(s.fontScale || 1, 0.85, 1.35);
  s.focusWork = clamp(s.focusWork || 25, 5, 120);
  s.focusBreak = clamp(s.focusBreak || 5, 1, 40);
  s.focusLong = clamp(s.focusLong || 15, 5, 60);
  s.goalMinutes = clamp(s.goalMinutes || 120, 15, 900);
  if (!Array.isArray(s.widgets) || !s.widgets.length) s.widgets = DEFAULT_SETTINGS.widgets.slice();
  if (!Array.isArray(s.nav) || s.nav.length !== 5) s.nav = DEFAULT_SETTINGS.nav.slice();
}

/* ---------- 5. design ---------- */
function applyDesign() {
  const s = state.settings;
  const h = document.documentElement;
  const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  h.dataset.theme = s.theme === 'system' ? dark : s.theme;
  h.dataset.accent = s.accent;
  h.dataset.glass = String(s.glass);
  h.dataset.motion = s.motion;
  h.dataset.density = s.density;
  h.dataset.font = s.font;
  h.dataset.wallpaper = s.wallpaper;
  h.style.setProperty('--font-scale', String(s.fontScale));
  if (s.accent === 'custom') {
    h.style.setProperty('--acc', s.accentCustom);
    h.style.setProperty('--acc2', s.accentCustom);
  } else {
    h.style.removeProperty('--acc');
    h.style.removeProperty('--acc2');
  }
  document.body.style.lineHeight = String(s.lineHeight || 1.55);
  h.lang = s.lang;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(h).getPropertyValue('--bg').trim();
    meta.content = bg || '#0b0d14';
  }
}

/* ---------- 6. shell ---------- */
const ROUTES = {};
let currentRoute = 'home';
const navStack = [];

function go(route, push) {
  if (push !== false && currentRoute !== route.split('/')[0]) navStack.push(currentRoute);
  location.hash = '#/' + route;
}

function renderNav() {
  const bar = $('#tabbarIn');
  if (!bar) return;
  const labels = { home: t('home'), plan: t('plan'), notes: t('notes'), revise: t('revise'), more: t('more') };
  const icons = { home: '🏠', plan: '🗓', notes: '📝', revise: '🃏', more: '⋯' };
  bar.innerHTML = state.settings.nav.map(function (k) {
    return '<button data-act="go" data-to="' + k + '"' + (currentRoute === k ? ' aria-current="page"' : '') + '><span aria-hidden="true">' + icons[k] + '</span><span>' + esc(labels[k] || k) + '</span></button>';
  }).join('');
}

function render() {
  const raw = location.hash.replace(/^#\/?/, '') || state.settings.landing || 'home';
  const parts = raw.split('?');
  const seg = parts[0].split('/');
  currentRoute = seg[0] || 'home';
  const sub = seg[1] || '';
  const view = $('#view');
  if (!view) return;
  const fn = ROUTES[currentRoute] || ROUTES.notfound;
  let html;
  try {
    html = fn({ sub: sub, params: new URLSearchParams(parts[1] || '') });
  } catch (err) {
    html = '<section class="card"><h2>Something went wrong</h2><p class="muted">' + esc(err.message) + '</p><button class="btn btn-sm btn-primary" data-act="go" data-to="home">Go home</button></section>';
  }
  view.innerHTML = '<div class="stack">' + (html || '') + '</div>';
  const bar = $('#appbar'); if (bar) bar.hidden = false;
  const tab = $('#tabbar'); if (tab) tab.hidden = false;
  const back = document.querySelector('[data-act="back"]'); if (back) back.hidden = navStack.length === 0;
  renderNav();
  window.scrollTo(0, 0);
  const after = ROUTES[currentRoute + ':after'];
  if (after) { try { after({ sub: sub }); } catch (e) {} }
  document.title = 'StudyPilot — ' + (t(currentRoute) || 'Home');
}

/* partials */
const card = (inner, cls) => '<section class="card ' + (cls || '') + '">' + inner + '</section>';
const empty = (em, msg, action) => '<div class="empty"><span class="em">' + em + '</span><span>' + esc(msg) + '</span>' + (action || '') + '</div>';
const header = (title, action) => '<div class="spread"><h1 style="font-size:1.25rem;margin:0">' + esc(title) + '</h1>' + (action || '') + '</div>';
const warn = (title, detail) => '<div class="warnbox"><b>' + esc(title) + '</b><br>' + esc(detail) + '</div>';

/* metrics */
function minutesToday() {
  return state.sessions.filter(function (s) { return s.date === today(); }).reduce(function (a, s) { return a + s.minutes; }, 0);
}
function lastN(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(dateOf(d));
  }
  return out;
}
function calcStreak() {
  let n = 0;
  const days = {};
  state.sessions.forEach(function (s) { days[s.date] = true; });
  const cur = new Date();
  for (let i = 0; i < 400; i++) {
    const k = dateOf(cur);
    if (days[k]) n++;
    else if (i > 0 || !days[k]) { if (i === 0) { /* today may be empty */ } else break; }
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}
function accuracy() {
  const done = state.attempts.filter(function (a) { return a.total > 0; });
  if (!done.length) return null;
  const s = done.reduce(function (a, x) { return a + x.score; }, 0);
  const tot = done.reduce(function (a, x) { return a + x.total; }, 0);
  return Math.round(s / tot * 100);
}
function award(points, key) {
  if (!state.settings.gamify) return;
  if (state.xp.events.indexOf(key) > -1) return;
  state.xp.events.push(key);
  if (state.xp.events.length > 4000) state.xp.events = state.xp.events.slice(-3000);
  state.xp.total += points;
  save();
}
function pushRecent(kind, id, title) {
  state.recents = state.recents.filter(function (r) { return !(r.kind === kind && r.id === id); });
  state.recents.unshift({ kind: kind, id: id, title: title, at: Date.now() });
  state.recents = state.recents.slice(0, 12);
  save();
}

/* ---------- 7. views ---------- */
ROUTES.home = function () {
  const s = state.settings;
  const name = s.groupMember || 'Student';
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todays = state.tasks.filter(function (x) { return x.date === today(); });
  const done = todays.filter(function (x) { return x.done; }).length;
  const nextExam = state.exams.filter(function (e) { return dayDiff(e.date) >= 0; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
  const due = state.cards.filter(function (c) { return c.due <= Date.now(); }).length;

  const W = {};

  W.greeting = card('<div class="hero"><p class="tiny" style="margin:0">' + new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + '</p><h1>' + esc(part) + ', ' + esc(name) + '</h1><p class="muted" style="margin:.2rem 0 0">' + esc(FOUNDER.tagline) + '</p></div>');

  W.quote = card('<p style="margin:0;font-style:italic">“Small daily improvements are the key to staggering long-term results.”</p><p class="tiny" style="margin:.3rem 0 0">Daily study quote</p>');

  W.plan = card('<div class="spread"><h2>' + esc(t('today')) + '</h2><button class="btn btn-sm" data-act="task-new">+ ' + esc(t('addTask')) + '</button></div>' +
    (todays.length ? todays.map(function (x) {
      return '<div class="rowitem" style="margin-top:.5rem"><button class="iconbtn" data-act="task-toggle" data-id="' + x.id + '" aria-label="Toggle">' + (x.done ? '✓' : '○') + '</button><div class="grow"><b style="' + (x.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(x.title) + '</b><small>' + esc(x.subject || 'General') + ' · ' + x.minutes + 'm · <span class="badge ' + (x.priority === 'high' ? 'danger' : x.priority === 'medium' ? 'warn' : '') + '">' + esc(x.priority) + '</span></small></div><button class="iconbtn" data-act="task-del" data-id="' + x.id + '" aria-label="Delete">🗑</button></div>';
    }).join('') : empty('🗒', 'No tasks for today.')) +
    (todays.length ? '<div class="bar" style="margin-top:.7rem"><i style="width:' + Math.round(done / todays.length * 100) + '%"></i></div><p class="tiny">' + done + '/' + todays.length + ' ' + esc(t('completed')) + '</p>' : ''));

  W.exams = card('<div class="spread"><h2>' + esc(t('upcoming')) + '</h2><button class="btn btn-sm" data-act="exam-new">+ ' + esc(t('addExam')) + '</button></div>' +
    (nextExam ? '<div class="rowitem" style="margin-top:.5rem"><div class="grow"><b>' + esc(nextExam.title) + '</b><small>' + esc(nextExam.subject || '') + ' · ' + fmtDate(nextExam.date) + '</small></div><span class="badge danger">' + dayDiff(nextExam.date) + 'd</span></div>' : '<p class="muted" style="margin:.5rem 0 0">No upcoming exams.</p>'));

  W.quick = card('<h2>' + esc(t('quick')) + '</h2><div class="qa">' +
    [['note-new', '📝', t('addNote')], ['deck-new', '🃏', t('flashcards')], ['go-focus', '⏱', t('focus')], ['go-tutor', '🤖', t('tutor')], ['go-papers', '📄', t('papers')], ['go-quiz', '❓', t('quiz')], ['go-quran', '📖', t('quran')], ['go-tools', '🧰', t('tools')]]
      .map(function (x) { return '<button data-act="' + x[0] + '"><span aria-hidden="true">' + x[1] + '</span><span>' + esc(x[2]) + '</span></button>'; }).join('') + '</div>');

  W.stats = card('<div class="hero-stats"><div><b>' + fmtMin(minutesToday()) + '</b><span>' + esc(t('studyTime')) + '</span></div><div><b>' + calcStreak() + '</b><span>' + esc(t('streak')) + '</span></div><div><b>' + state.xp.total + '</b><span>' + esc(t('xp')) + '</span></div></div><p class="tiny" style="text-align:center;margin:.5rem 0 0">' + due + ' cards due · <a href="#/stats">' + esc(t('stats')) + '</a></p>');

  W.continue = state.recents.length ? card('<h2>' + esc(t('continueLearning')) + '</h2>' + state.recents.slice(0, 4).map(function (r) {
    return '<div class="rowitem" style="margin-top:.4rem" data-act="open-recent" data-kind="' + esc(r.kind) + '" data-id="' + esc(r.id) + '"><div class="grow"><b>' + esc(r.title) + '</b><small>' + esc(r.kind) + '</small></div><span>›</span></div>';
  }).join('')) : '';

  const visible = s.widgets.filter(function (w) { return s.widgetsHidden.indexOf(w) === -1 && W[w]; });

  return visible.map(function (w) { return W[w]; }).join('') +
    card('<div class="spread"><div><b>' + esc(t('whatNow')) + '</b><p class="tiny" style="margin:.2rem 0 0">Based on deadlines and weak topics.</p></div><button class="btn btn-sm btn-primary" data-act="what-now">Suggest</button></div>') +
    card('<h2>' + esc(t('tools')) + '</h2><div class="grid3">' + TOOLS.map(function (x) {
      return '<button class="btn btn-sm" data-act="go" data-to="' + x.route + '">' + x.icon + ' ' + esc(x.label) + '</button>';
    }).join('') + '</div>');
};

ROUTES.notfound = function () {
  return card(empty('🧭', 'Page not found') + '<button class="btn btn-block btn-primary" data-act="go" data-to="home">Go home</button>');
};

ROUTES.plan = function (ctx) {
  if (ctx.sub === 'subjects') return subjectsView();
  const overdue = state.tasks.filter(function (x) { return !x.done && x.date < today(); });
  const upcoming = state.tasks.filter(function (x) { return !x.done && x.date >= today(); }).sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(0, 25);
  return header(t('plan'), '<button class="btn btn-sm btn-primary" data-act="task-new">+ ' + esc(t('addTask')) + '</button>') +
    '<div class="pill-nav"><button aria-current="page">Tasks</button><button data-act="go" data-to="plan/subjects">Subjects</button><button data-act="go" data-to="exam">Exams</button><button data-act="go" data-to="stats">Progress</button></div>' +
    card('<div class="spread"><div><b>' + esc(t('whatNow')) + '</b><p class="tiny" style="margin:.2rem 0 0">Uses confidence, revision age and deadline.</p></div><button class="btn btn-sm" data-act="what-now">Show</button></div>') +
    (overdue.length ? card('<h2>Missed (' + overdue.length + ')</h2><p class="tiny">Rescheduling keeps history.</p>' + overdue.map(function (x) {
      return '<div class="rowitem" style="margin-top:.4rem"><div class="grow"><b>' + esc(x.title) + '</b><small>' + fmtDate(x.date) + '</small></div><button class="btn btn-sm" data-act="task-resched" data-id="' + x.id + '">Move</button></div>';
    }).join('') + '<button class="btn btn-sm btn-block" style="margin-top:.5rem" data-act="task-resched-all">Move all to today</button>') : '') +
    card('<h2>Upcoming</h2>' + (upcoming.length ? upcoming.map(function (x) {
      return '<div class="rowitem" style="margin-top:.4rem"><button class="iconbtn" data-act="task-toggle" data-id="' + x.id + '" aria-label="Complete">○</button><div class="grow"><b>' + esc(x.title) + '</b><small>' + fmtDate(x.date) + ' · ' + x.minutes + 'm · ' + esc(x.subject || 'General') + '</small></div><button class="iconbtn" data-act="task-del" data-id="' + x.id + '" aria-label="Delete">🗑</button></div>';
    }).join('') : empty('🗓', 'No upcoming tasks.')));
};

function subjectsView() {
  return header('Subjects', '<button class="btn btn-sm btn-primary" data-act="subject-new">+ ' + esc(t('addSubject')) + '</button>') +
    card('<p class="tiny" style="margin:0">Syllabus tracker. Confidence drives revision priority.</p>') +
    (state.subjects.filter(function (s) { return !s.archived; }).length ? state.subjects.filter(function (s) { return !s.archived; }).map(function (s) {
      const tp = state.topics.filter(function (x) { return x.subjectId === s.id; });
      const doneN = tp.filter(function (x) { return x.done; }).length;
      const pct = tp.length ? Math.round(doneN / tp.length * 100) : 0;
      return card('<div class="spread"><div><b>' + esc(s.name) + '</b><p class="tiny" style="margin:0">' + doneN + '/' + tp.length + ' topics · ' + pct + '%</p></div><div class="row"><button class="btn btn-sm" data-act="topic-new" data-id="' + s.id + '">+ Topic</button><button class="iconbtn" data-act="subject-edit" data-id="' + s.id + '" aria-label="Edit">✎</button></div></div><div class="bar" style="margin:.5rem 0"><i style="width:' + pct + '%"></i></div>' +
        tp.map(function (x) {
          return '<div class="rowitem" style="margin-top:.35rem"><button class="iconbtn" data-act="topic-done" data-id="' + x.id + '" aria-label="Done">' + (x.done ? '✓' : '○') + '</button><div class="grow"><b>' + esc(x.name) + '</b><small>confidence ' + x.confidence + '/5 · ' + (x.lastRevised ? 'revised ' + fmtDate(x.lastRevised) : 'never revised') + '</small></div><button class="iconbtn" data-act="topic-conf" data-id="' + x.id + '" aria-label="Confidence">±</button></div>';
        }).join(''));
    }).join('') : card(empty('📚', 'No subjects yet.', '<button class="btn btn-sm btn-primary" data-act="subject-new">Create subject</button>')));
}

ROUTES.notes = function (ctx) {
  if (ctx.sub === 'new') return noteEditor(null);
  if (ctx.sub) {
    const n = state.notes.filter(function (x) { return x.id === ctx.sub; })[0];
    return n ? noteEditor(n) : ROUTES.notfound();
  }
  const q = (state.transient.noteQuery || '').toLowerCase();
  let list = state.notes.filter(function (n) { return !q || (n.title + ' ' + n.body).toLowerCase().indexOf(q) > -1; });
  if (state.transient.noteFolder) list = list.filter(function (n) { return n.folderId === state.transient.noteFolder; });
  list.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
  return header(t('notes'), '<button class="btn btn-sm btn-primary" data-act="note-new">+ ' + esc(t('addNote')) + '</button>') +
    card('<input type="text" id="noteSearch" value="' + esc(state.transient.noteQuery || '') + '" placeholder="Search notes…"><div class="chips" style="margin-top:.5rem">' +
      state.folders.map(function (f) { return '<button class="chip" data-act="note-folder" data-id="' + f.id + '" aria-pressed="' + (state.transient.noteFolder === f.id) + '">' + esc(f.name) + '</button>'; }).join('') +
      '<button class="chip" data-act="folder-new">+ Folder</button></div>') +
    (list.length ? list.map(function (n) {
      return card('<div class="spread"><div style="min-width:0"><b>' + esc(n.title || 'Untitled') + '</b><p class="tiny" style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(String(n.body || '').slice(0, 90)) + '</p></div><button class="iconbtn" data-act="note-fav" data-id="' + n.id + '" aria-label="Favourite">' + (n.fav ? '★' : '☆') + '</button></div><div class="row" style="margin-top:.5rem"><button class="btn btn-sm" data-act="note-open" data-id="' + n.id + '">Open</button><button class="btn btn-sm" data-act="note-ai" data-id="' + n.id + '">Make cards</button></div>', 'tap');
    }).join('') : card(empty('📝', 'No notes here yet.', '<button class="btn btn-sm btn-primary" data-act="note-new">Create note</button>')));
};

function noteEditor(n) {
  const isNew = !n;
  const d = n || { id: '', title: '', body: '' };
  return header(isNew ? 'New note' : 'Edit note', '<button class="btn btn-sm btn-primary" data-act="note-save" data-id="' + d.id + '">' + esc(t('save')) + '</button>') +
    card('<label class="field">Title<input type="text" id="noteTitle" value="' + esc(d.title) + '" placeholder="Note title"></label><label class="field" style="margin-top:.6rem">Body<textarea id="noteBody" placeholder="Write here…">' + esc(d.body) + '</textarea></label><div class="row" style="margin-top:.5rem"><button class="btn btn-sm" data-act="note-export" data-id="' + d.id + '">Export .md</button><label class="btn btn-sm">Import<input type="file" id="noteImport" accept=".txt,.md,text/plain" hidden></label></div>');
}

ROUTES.revise = function () {
  return card(header(t('revise')) + '<div class="grid2" style="margin-top:.6rem"><button class="btn" data-act="go" data-to="cards">🃏 ' + esc(t('flashcards')) + '</button><button class="btn" data-act="go" data-to="quiz">❓ ' + esc(t('quiz')) + '</button><button class="btn" data-act="go" data-to="exam">🎯 ' + esc(t('exam')) + '</button><button class="btn" data-act="go" data-to="mistakes">🔁 ' + esc(t('mistakes')) + '</button></div><p class="tiny" style="margin:.7rem 0 0">' + state.cards.filter(function (c) { return c.due <= Date.now(); }).length + ' cards due today.</p>');
};

ROUTES.cards = function () {
  const due = state.cards.filter(function (c) { return c.due <= Date.now(); });
  return header(t('flashcards'), '<button class="btn btn-sm btn-primary" data-act="deck-new">+ ' + esc(t('addDeck')) + '</button>') +
    card('<div class="spread"><b>' + due.length + ' due</b><button class="btn btn-sm btn-primary"' + (due.length ? '' : ' disabled') + ' data-act="card-review">Review</button></div>') +
    (state.decks.length ? state.decks.map(function (d) {
      const cs = state.cards.filter(function (c) { return c.deckId === d.id; });
      return card('<div class="spread"><div><b>' + esc(d.name) + '</b><p class="tiny" style="margin:0">' + cs.length + ' cards · ' + cs.filter(function (c) { return c.due <= Date.now(); }).length + ' due</p></div><button class="btn btn-sm" data-act="card-new" data-id="' + d.id + '">+ Card</button></div>');
    }).join('') : card(empty('🃏', 'No decks yet.', '<button class="btn btn-sm btn-primary" data-act="deck-new">Create deck</button>')));
};

ROUTES.quiz = function () {
  return header(t('quiz'), '<button class="btn btn-sm btn-primary" data-act="quiz-new">+ New quiz</button>') +
    card('<p class="tiny" style="margin:0">Auto-graded objective questions, retry incorrect answers.</p>') +
    (state.quizzes.length ? state.quizzes.map(function (qz) {
      return card('<div class="spread"><div><b>' + esc(qz.title) + '</b><p class="tiny" style="margin:0">' + qz.questions.length + ' questions</p></div><button class="btn btn-sm btn-primary" data-act="quiz-start" data-id="' + qz.id + '">Start</button></div>');
    }).join('') : card(empty('❓', 'No quizzes yet.', '<button class="btn btn-sm btn-primary" data-act="quiz-new">Create quiz</button>')));
};

ROUTES.exam = function () {
  const list = state.exams.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
  return header(t('exam'), '<button class="btn btn-sm btn-primary" data-act="exam-new">+ ' + esc(t('addExam')) + '</button>') +
    card('<h2>Upcoming exams</h2>' + (list.length ? list.map(function (e) {
      return '<div class="rowitem" style="margin-top:.4rem"><div class="grow"><b>' + esc(e.title) + '</b><small>' + fmtDate(e.date) + ' · ' + esc(e.subject || '') + '</small></div><span class="badge ' + (dayDiff(e.date) < 7 ? 'danger' : 'warn') + '">' + dayDiff(e.date) + 'd</span><button class="iconbtn" data-act="exam-del" data-id="' + e.id + '" aria-label="Delete">🗑</button></div>';
    }).join('') : empty('🎯', 'No exams added.'))) +
    card('<h2>Recent attempts</h2>' + (state.attempts.length ? state.attempts.slice(-5).reverse().map(function (a) {
      return '<div class="rowitem" style="margin-top:.4rem"><div class="grow"><b>' + esc(a.quizTitle) + '</b><small>' + a.score + '/' + a.total + ' · ' + fmtDate(a.at) + '</small></div><span class="badge ' + (a.score / a.total >= 0.5 ? 'ok' : 'danger') + '">' + Math.round(a.score / a.total * 100) + '%</span></div>';
    }).join('') : empty('📊', 'No attempts yet.')));
};

ROUTES.mistakes = function () {
  return header(t('mistakes'), '<button class="btn btn-sm btn-primary" data-act="mistake-retry">Retry</button>') +
    (state.mistakes.length ? state.mistakes.map(function (m) {
      return card('<div class="spread"><div><b>' + esc(m.q) + '</b><p class="tiny" style="margin:.2rem 0 0">Your answer: ' + esc(m.given || '—') + ' · Correct: ' + esc(m.correct) + '</p></div><button class="iconbtn" data-act="mistake-fix" data-id="' + m.id + '" aria-label="Mark corrected">' + (m.fixed ? '✓' : '○') + '</button></div>');
    }).join('') : card(empty('🔁', 'No mistakes saved. They appear after quizzes.')));
};

ROUTES.focus = function () {
  const f = state.focus;
  const left = f.running ? Math.max(0, (f.endTs - Date.now()) / 1000) : f.remaining;
  return card('<h2>' + esc(t('focus')) + '</h2><p class="timer' + (f.break ? ' break' : '') + '" id="timer">' + fmtTime(left) + '</p><p class="tiny" style="text-align:center;margin:0 0 .7rem">' + (f.break ? 'Break' : 'Focus') + ' · ' + esc(f.label) + '</p><div class="row" style="justify-content:center"><button class="btn btn-primary" data-act="focus-toggle">' + (f.running ? 'Pause' : 'Start') + '</button><button class="btn" data-act="focus-finish">Finish</button><button class="btn btn-ghost" data-act="focus-reset">Reset</button></div><div class="row" style="margin-top:.9rem;justify-content:center"><button class="btn btn-sm" data-act="focus-sound">' + (state.settings.sounds ? '🔊 Sound on' : '🔇 Sound off') + '</button><button class="btn btn-sm" data-act="go" data-to="settings/focus">Durations</button></div><p class="tiny" style="margin:.8rem 0 0">Elapsed time is computed from timestamps, so it stays correct after backgrounding.</p>');
};

ROUTES.stats = function () {
  const week = lastN(7).map(function (d) { return { d: d, m: state.sessions.filter(function (s) { return s.date === d; }).reduce(function (a, s) { return a + s.minutes; }, 0) }; });
  const max = Math.max(1, Math.max.apply(null, week.map(function (w) { return w.m; })));
  const acc = accuracy();
  return header(t('stats')) +
    card('<div class="hero-stats"><div><b>' + fmtMin(minutesToday()) + '</b><span>Today</span></div><div><b>' + fmtMin(state.sessions.reduce(function (a, s) { return a + s.minutes; }, 0)) + '</b><span>Total</span></div><div><b>' + (acc === null ? '—' : acc + '%') + '</b><span>Accuracy</span></div></div><p class="tiny" style="margin:.5rem 0 0">Accuracy and mastery are separate. Mastery is confidence plus revision recency, not an exam guarantee.</p>') +
    card('<h2>Last 7 days</h2><div class="row" style="align-items:flex-end;height:110px;gap:.4rem">' + week.map(function (w) {
      return '<div style="flex:1;text-align:center"><div style="height:' + Math.round(w.m / max * 84) + 'px;background:var(--acc);border-radius:6px"></div><small class="tiny">' + w.d.slice(5) + '</small></div>';
    }).join('') + '</div>') +
    card('<h2>Heatmap</h2><div class="heat">' + lastN(56).map(function (d) {
      const m = state.sessions.filter(function (s) { return s.date === d; }).reduce(function (a, s) { return a + s.minutes; }, 0);
      const l = m === 0 ? 0 : m < 20 ? 1 : m < 45 ? 2 : m < 90 ? 3 : 4;
      return '<i data-l="' + l + '" title="' + d + ': ' + m + 'm"></i>';
    }).join('') + '</div>') +
    card('<h2>Export</h2><div class="row"><button class="btn btn-sm" data-act="export-csv">CSV</button><button class="btn btn-sm" data-act="export-json">Backup JSON</button></div>');
};

ROUTES.quran = function () {
  const list = state.cache.surahList;
  if (!list) {
    refreshSurahs();
    return card('<h2>' + esc(t('quran')) + '</h2><div class="skel"></div><div class="skel" style="margin-top:.5rem"></div>');
  }
  const q = (state.transient.quranQuery || '').toLowerCase();
  const filtered = list.filter(function (s) { return !q || s.englishName.toLowerCase().indexOf(q) > -1 || s.name.indexOf(q) > -1; });
  return header(t('quran'), '<button class="iconbtn" data-act="go" data-to="quran/settings" aria-label="Settings">⚙</button>') +
    card('<input type="text" id="quranSearch" value="' + esc(state.transient.quranQuery || '') + '" placeholder="Search surah…">' + (state.quran.last ? '<button class="btn btn-sm btn-block" style="margin-top:.5rem" data-act="quran-resume">Continue: ' + esc(state.quran.last.name) + ' ' + state.quran.last.ayah + '</button>' : '')) +
    card('<h2>114 Surahs</h2>' + filtered.map(function (s) {
      return '<div class="rowitem" style="margin-top:.35rem" data-act="quran-open" data-id="' + s.number + '"><span class="badge">' + s.number + '</span><div class="grow"><b>' + esc(s.englishName) + '</b><small>' + esc(s.name) + ' · ' + s.numberOfAyahs + ' ayah · ' + esc(s.revelationType) + '</small></div><span>›</span></div>';
    }).join(''));
};

ROUTES.quran_settings = function () {
  return header('Quran settings', '<button class="btn btn-sm" data-act="back">Back</button>') +
    card('<label class="field">Translation<select id="qTr"><option value="en.sahih"' + (state.settings.quranTranslation === 'en.sahih' ? ' selected' : '') + '>English — Sahih International</option><option value="ta.tamil"' + (state.settings.quranTranslation === 'ta.tamil' ? ' selected' : '') + '>Tamil</option><option value="si.naseemismail"' + (state.settings.quranTranslation === 'si.naseemismail' ? ' selected' : '') + '>Sinhala</option><option value="none"' + (state.settings.quranTranslation === 'none' ? ' selected' : '') + '>None</option></select></label><label class="switch" style="margin-top:.6rem">Show translation<input type="checkbox" id="qShow"' + (state.settings.showTranslation ? ' checked' : '') + '></label><label class="field" style="margin-top:.6rem">Arabic size <input type="range" min="1.1" max="2.4" step="0.05" id="qSize" value="' + state.settings.arabicSize + '"></label><div class="row" style="margin-top:.8rem"><button class="btn btn-sm" data-act="quran-reciters">Reciter: ' + esc(state.settings.quranReciter) + '</button></div><p class="tiny" style="margin:.8rem 0 0">Text and audio: AlQuran Cloud + Islamic Network CDN. Quran Foundation credentials can be added in Integrations.</p>');
};

ROUTES['quran_settings:after'] = function () {
  const tr = $('#qTr');
  if (tr) tr.addEventListener('change', function () { state.settings.quranTranslation = tr.value; save(); });
  const sh = $('#qShow');
  if (sh) sh.addEventListener('change', function () { state.settings.showTranslation = sh.checked; save(); });
  const sz = $('#qSize');
  if (sz) sz.addEventListener('input', function () { state.settings.arabicSize = Number(sz.value); save(); });
};

ROUTES['quran/read'] = function () {
  return '<div id="quranReader"><div class="skel" style="height:220px"></div></div>';
};

ROUTES['quran/read:after'] = function () {
  loadSurah(Number(state.transient.quranNum || 1));
};

ROUTES.tutor = function () {
  const cfg = !!state.settings.aiKey;
  return header(t('tutor')) +
    (cfg ? '' : warn(t('configRequired'), 'Add a base URL, model and API key in Settings → Integrations. Keys stay in this browser.')) +
    card('<div class="chips">' + ['Teach me', 'Explain simply', 'Step by step', 'Examples', 'Hints only', 'Test me', 'Summarize', 'Ask my notes'].map(function (m, i) {
      return '<button class="chip" data-act="tutor-mode" data-id="' + i + '" aria-pressed="' + (state.transient.tutorMode === i) + '">' + esc(m) + '</button>';
    }).join('') + '</div><textarea id="tutorIn" placeholder="Ask about a topic, or paste notes…" style="margin-top:.6rem"></textarea><div class="row" style="margin-top:.5rem"><button class="btn btn-primary" data-act="tutor-send"' + (cfg ? '' : ' disabled') + '>Ask</button><button class="btn btn-sm" data-act="tutor-local">Local tools</button></div>') +
    card('<h2>Answer</h2><div id="tutorOut" class="stack">' + (state.transient.tutorOut ? '<p>' + esc(state.transient.tutorOut) + '</p>' : '<p class="muted">No answer yet.</p>') + '</div>') +
    card('<h2>Research</h2><p class="tiny">Web results are cited separately from generated text.</p><button class="btn btn-sm btn-block" data-act="go" data-to="research">Open web research</button>');
};

ROUTES.research = function () {
  return header('Web research') +
    card('<input type="text" id="rsq" placeholder="Search educational topics…"><button class="btn btn-primary btn-block" style="margin-top:.5rem" data-act="research-run">Search</button><p class="tiny" style="margin:.5rem 0 0">Provider: Wikipedia API (no key needed). Sources are listed with links.</p>') +
    '<div id="rsOut" class="stack">' + (state.transient.rsHtml || '') + '</div>';
};

ROUTES.papers = function () {
  return header(t('papers'), '<button class="btn btn-sm btn-primary" data-act="paper-new">+ Import</button>') +
    card('<p class="tiny" style="margin:0">Store links to official papers you are permitted to use. Always verify the source.</p>') +
    (state.papers.length ? state.papers.map(function (p) {
      return card('<div class="spread"><div><b>' + esc(p.title) + '</b><p class="tiny" style="margin:0">' + esc(p.board || '') + ' · ' + esc(p.subject || '') + ' · ' + esc(p.year || '') + '</p><p class="src">' + esc(p.url) + '</p></div><button class="iconbtn" data-act="paper-del" data-id="' + p.id + '" aria-label="Delete">🗑</button></div><div class="row" style="margin-top:.4rem"><button class="btn btn-sm" data-act="paper-open" data-id="' + p.id + '">Open</button><button class="btn btn-sm" data-act="paper-fav" data-id="' + p.id + '">' + (p.fav ? '★' : '☆') + '</button></div>');
    }).join('') : card(empty('📄', 'No papers saved.')));
};

ROUTES.library = function () {
  return header(t('library')) + card('<input type="text" id="libQuery" value="' + esc(state.transient.libQuery || '') + '" placeholder="Search everything…">') + '<div id="libOut">' + libraryResults() + '</div>';
};

function libraryResults() {
  const q = (state.transient.libQuery || '').toLowerCase().trim();
  if (!q) return card(empty('🔎', 'Type to search notes, cards, papers and subjects.'));
  const hits = [];
  state.notes.forEach(function (n) { if ((n.title + ' ' + n.body).toLowerCase().indexOf(q) > -1) hits.push({ kind: 'note', id: n.id, title: n.title, sub: 'Note' }); });
  state.cards.forEach(function (c) { if ((c.front + ' ' + c.back).toLowerCase().indexOf(q) > -1) hits.push({ kind: 'card', id: c.id, title: c.front, sub: 'Flashcard' }); });
  state.papers.forEach(function (p) { if ((p.title + ' ' + (p.subject || '')).toLowerCase().indexOf(q) > -1) hits.push({ kind: 'paper', id: p.id, title: p.title, sub: 'Paper' }); });
  state.subjects.forEach(function (s) { if (s.name.toLowerCase().indexOf(q) > -1) hits.push({ kind: 'subject', id: s.id, title: s.name, sub: 'Subject' }); });
  if (!hits.length) return card(empty('🔎', 'No matches.'));
  return card(hits.slice(0, 40).map(function (h) {
    return '<div class="rowitem" style="margin-top:.35rem" data-act="open-recent" data-kind="' + h.kind + '" data-id="' + h.id + '"><div class="grow"><b>' + esc(h.title || 'Untitled') + '</b><small>' + esc(h.sub) + '</small></div><span>›</span></div>';
  }).join(''));
}

ROUTES.search = function () {
  return header(t('search')) +
    card('<input type="text" id="globalSearch" placeholder="Notes, subjects, cards, papers…"><div class="chips" style="margin-top:.5rem">' + state.searches.slice(0, 6).map(function (s) {
      return '<button class="chip" data-act="search-again" data-id="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('') + '</div>') +
    '<div id="searchOut"></div>';
};

ROUTES.tools = function () {
  return header(t('tools')) +
    card('<div class="grid3">' + TOOLS.map(function (x) { return '<button class="btn btn-sm" data-act="go" data-to="' + x.route + '">' + x.icon + ' ' + esc(x.label) + '</button>'; }).join('') + '</div>') +
    card('<h2>Calculator</h2><input type="text" id="calcIn" placeholder="2*(3+4)^2"><button class="btn btn-sm btn-block" style="margin-top:.4rem" data-act="calc">Evaluate</button><p id="calcOut" class="muted" style="margin:.5rem 0 0"></p>') +
    card('<h2>Unit converter</h2><div class="row"><input type="number" id="ucVal" value="1" style="flex:1"><select id="ucFrom" style="flex:1"><option value="km">km</option><option value="mi">mi</option><option value="m">m</option><option value="ft">ft</option><option value="kg">kg</option><option value="lb">lb</option></select><select id="ucTo" style="flex:1"><option value="mi">mi</option><option value="km">km</option><option value="ft">ft</option><option value="m">m</option><option value="lb">lb</option><option value="kg">kg</option></select></div><button class="btn btn-sm btn-block" style="margin-top:.4rem" data-act="convert">Convert</button><p id="ucOut" class="muted" style="margin:.5rem 0 0"></p>');
};

ROUTES.groups = function () {
  return header(t('groups')) +
    warn('Local prototype', 'Groups work in this browser only. Multi-device sync needs a backend.') +
    card('<label class="field">Your display name<input type="text" id="gMember" value="' + esc(state.settings.groupMember) + '" placeholder="Name shown to members"></label><label class="field" style="margin-top:.5rem">Group name<input type="text" id="gName" value="' + esc(state.settings.groupName) + '" placeholder="e.g. A/L Physics 2027"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-primary btn-sm" data-act="group-create">Create</button><button class="btn btn-sm" data-act="group-join">Join by code</button></div>') +
    (state.groups.length ? state.groups.map(function (g) {
      return card('<div class="spread"><div><b>' + esc(g.name) + '</b><p class="tiny" style="margin:0">Code ' + esc(g.code) + ' · ' + g.members.length + ' member(s)</p></div><button class="iconbtn" data-act="group-leave" data-id="' + g.id + '" aria-label="Leave">✕</button></div><div class="row" style="margin-top:.4rem"><button class="btn btn-sm" data-act="group-checkin" data-id="' + g.id + '">Check in</button><button class="btn btn-sm" data-act="group-announce" data-id="' + g.id + '">Announce</button></div>' +
        (g.announcements || []).slice(-3).map(function (a) { return '<p class="tiny" style="margin:.4rem 0 0">• ' + esc(a) + '</p>'; }).join(''));
    }).join('') : card(empty('👥', 'No groups yet.')));
};

ROUTES.about = function () {
  return header(t('about')) +
    card('<div class="row"><span style="font-size:2rem">🧭</span><div><b>StudyPilot</b><p class="tiny" style="margin:0">v' + APP_VERSION + '</p></div></div><p style="margin:.6rem 0 0">' + esc(FOUNDER.tagline) + '</p><p class="muted" style="margin:.4rem 0 0">' + esc(FOUNDER.mission) + '</p><p class="tiny" style="margin:.6rem 0 0">Founder: ' + esc(FOUNDER.name) + ' · WhatsApp ' + esc(FOUNDER.whatsapp) + '</p><div class="row" style="margin-top:.7rem"><a class="btn btn-primary btn-sm" href="' + FOUNDER.waLink + '" target="_blank" rel="noopener">WhatsApp founder</a><button class="btn btn-sm" data-act="feedback">Send feedback</button></div>') +
    card('<h2>How feedback works</h2><p class="tiny">Feedback opens WhatsApp with a prefilled message. Nothing is sent automatically.</p><p class="tiny">Quran text and translations via AlQuran Cloud, © respective publishers.</p>') +
    card('<h2>Privacy</h2><p class="tiny">All study data stays in this browser. AI and research calls go straight to the provider you configure. No analytics, no tracking.</p><button class="btn btn-sm btn-block" style="margin-top:.5rem" data-act="go" data-to="settings/data">Data controls</button>');
};

ROUTES.settings = function (ctx) {
  if (ctx.sub === 'data') return dataSettings();
  if (ctx.sub === 'focus') return focusSettings();
  if (ctx.sub === 'integrations') return integrationSettings();
  const s = state.settings;
  const chips = function (key, values) {
    return '<div class="chips" style="margin-top:.6rem">' + values.map(function (v) {
      return '<button class="chip" data-act="set" data-k="' + key + '" data-v="' + v + '" aria-pressed="' + (s[key] === v) + '">' + v + '</button>';
    }).join('') + '</div>';
  };
  return header(t('settings')) +
    card('<h2>Theme</h2>' + chips('theme', ['dark', 'light', 'system', 'amoled', 'midnight', 'aurora', 'minimal', 'paper', 'ocean']) +
      '<h2 style="margin-top:.8rem">Accent</h2>' + chips('accent', ['indigo', 'violet', 'teal', 'rose', 'amber', 'emerald', 'sky', 'crimson']) +
      '<label class="field" style="margin-top:.6rem">Custom accent<input type="color" id="acCustom" value="' + s.accentCustom + '"></label>' +
      '<label class="field" style="margin-top:.6rem">Glass intensity <input type="range" min="0" max="3" step="1" id="glassR" value="' + s.glass + '"></label>' +
      '<label class="field" style="margin-top:.6rem">Text size <input type="range" min="0.85" max="1.35" step="0.05" id="fsR" value="' + s.fontScale + '"></label>' +
      '<h2 style="margin-top:.8rem">Motion</h2>' + chips('motion', ['full', 'reduced', 'none']) +
      '<h2 style="margin-top:.8rem">Density</h2>' + chips('density', ['compact', 'cozy', 'spacious'])) +
    card('<h2>Language</h2><div class="chips" style="margin-top:.5rem">' + [['en', 'English'], ['ta', 'தமிழ்'], ['si', 'සිංහල']].map(function (x) {
      return '<button class="chip" data-act="set" data-k="lang" data-v="' + x[0] + '" aria-pressed="' + (s.lang === x[0]) + '">' + x[1] + '</button>';
    }).join('') + '</div>') +
    card('<h2>Study</h2><label class="field">Daily goal (minutes)<input type="number" min="15" max="900" id="goalIn" value="' + s.goalMinutes + '"></label><div class="row" style="margin-top:.5rem"><button class="btn btn-sm" data-act="go" data-to="settings/focus">Focus durations</button><button class="btn btn-sm" data-act="widgets">Dashboard widgets</button></div>') +
    card('<h2>System</h2><button class="btn btn-sm btn-block" data-act="go" data-to="settings/integrations">Integrations & keys</button><button class="btn btn-sm btn-block" style="margin-top:.4rem" data-act="go" data-to="settings/data">Data, backup & reset</button><button class="btn btn-sm btn-block" style="margin-top:.4rem" data-act="update-check">Check for updates</button>');
};

ROUTES['settings:after'] = function () {
  const ac = $('#acCustom');
  if (ac) ac.addEventListener('input', function () { state.settings.accent = 'custom'; state.settings.accentCustom = ac.value; applyDesign(); save(); });
  const gl = $('#glassR');
  if (gl) gl.addEventListener('input', function () { state.settings.glass = Number(gl.value); applyDesign(); save(); });
  const fs = $('#fsR');
  if (fs) fs.addEventListener('input', function () { state.settings.fontScale = Number(fs.value); applyDesign(); save(); });
  const gi = $('#goalIn');
  if (gi) gi.addEventListener('change', function () { state.settings.goalMinutes = clamp(gi.value, 15, 900); save(); });
};

function focusSettings() {
  return header('Focus durations', '<button class="btn btn-sm" data-act="back">Back</button>') +
    card('<label class="field">Focus (minutes)<input type="number" min="5" max="120" id="fwIn" value="' + state.settings.focusWork + '"></label><label class="field" style="margin-top:.5rem">Short break<input type="number" min="1" max="40" id="fbIn" value="' + state.settings.focusBreak + '"></label><label class="field" style="margin-top:.5rem">Long break<input type="number" min="5" max="60" id="flIn" value="' + state.settings.focusLong + '"></label>');
}

ROUTES['focus_settings:after'] = function () {
  ['fwIn:focusWork', 'fbIn:focusBreak', 'flIn:focusLong'].forEach(function (pair) {
    const p = pair.split(':');
    const el = document.getElementById(p[0]);
    if (el) el.addEventListener('change', function () {
      state.settings[p[1]] = clamp(el.value, 1, 120);
      if (!state.focus.running && !state.focus.break) state.focus.remaining = state.settings.focusWork * 60;
      save(); render();
    });
  });
};

function integrationSettings() {
  return header('Integrations', '<button class="btn btn-sm" data-act="back">Back</button>') +
    card('<h2>AI provider</h2>' + warn('Stored locally', 'Visible to anyone with device access. Proxy through a server for production use.') +
      '<label class="field" style="margin-top:.5rem">Base URL<input type="url" id="aiBaseIn" value="' + esc(state.settings.aiBase) + '"></label><label class="field" style="margin-top:.5rem">Model<input type="text" id="aiModelIn" value="' + esc(state.settings.aiModel) + '"></label><label class="field" style="margin-top:.5rem">API key<input type="password" id="aiKeyIn" value="' + esc(state.settings.aiKey) + '" placeholder="sk-…"></label><button class="btn btn-sm btn-block" style="margin-top:.6rem" data-act="save-integrations">Save</button>') +
    card('<h2>Quran Foundation (optional)</h2><p class="tiny">The default AlQuran Cloud source needs no key. Quran Foundation requires client credentials.</p><label class="field" style="margin-top:.5rem">Client ID<input type="text" id="qfId" value="' + esc(state.settings.qfClientId) + '"></label><label class="field" style="margin-top:.5rem">Client secret<input type="password" id="qfSec" value="' + esc(state.settings.qfClientSecret) + '"></label>');
}

function dataSettings() {
  return header('Data', '<button class="btn btn-sm" data-act="back">Back</button>') +
    card('<h2>Backup</h2><button class="btn btn-sm btn-block" data-act="export-json">Export full backup</button><label class="btn btn-sm btn-block" style="margin-top:.4rem">Import backup<input type="file" id="importJson" accept="application/json" hidden></label><button class="btn btn-sm btn-block" style="margin-top:.4rem" data-act="export-csv">Export study CSV</button>') +
    card('<h2>Storage</h2><p class="tiny" id="storageInfo">Calculating…</p>') +
    card('<h2>Danger zone</h2><button class="btn btn-sm btn-block btn-danger" data-act="reset-all">Delete all data</button><button class="btn btn-sm btn-block" style="margin-top:.4rem" data-act="reset-prefs">Reset preferences only</button>');
}

ROUTES['data_settings:after'] = function () {
  const el = document.getElementById('storageInfo');
  if (!el) return;
  let bytes = 0;
  try { bytes = (localStorage.getItem(LS_KEY) || '').length; } catch (e) {}
  el.textContent = (bytes / 1024).toFixed(1) + ' KB used in localStorage (typical limit ~5 MB).';
};

/* ---------- 8. features ---------- */
function taskForm() {
  sheet(t('addTask'), '<div class="stack"><label class="field">Title<input type="text" id="tkTitle" placeholder="e.g. Revise kinematics"></label><label class="field">Subject<select id="tkSubject"><option value="">General</option>' + state.subjects.map(function (s) { return '<option>' + esc(s.name) + '</option>'; }).join('') + '</select></label><div class="row"><label class="field" style="flex:1">Minutes<input type="number" id="tkMin" value="30" min="5" max="240"></label><label class="field" style="flex:1">Date<input type="date" id="tkDate" value="' + today() + '"></label></div><label class="field">Priority<select id="tkPrio"><option>low</option><option selected>medium</option><option>high</option></select></label><button class="btn btn-primary btn-block" data-act="task-save">Save task</button></div>');
}

function taskSave() {
  const el = $('#tkTitle');
  if (!el) return;
  const title = el.value.trim();
  if (!title) return toast('Title required', 'err');
  state.tasks.push({ id: uid('t'), title: title, subject: $('#tkSubject').value, minutes: clamp($('#tkMin').value, 5, 240), date: $('#tkDate').value || today(), priority: $('#tkPrio').value, done: false, createdAt: Date.now() });
  save(); closeOverlays(); render(); toast('Task added', 'ok');
}

function subjectForm(existing) {
  modal(existing ? 'Edit subject' : t('addSubject'), '<div class="stack"><label class="field">Name<input type="text" id="sjName" value="' + esc(existing ? existing.name : '') + '"></label><div class="row"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="sjSave">Save</button></div></div>', function (r) {
    const b = r.querySelector('#sjSave');
    if (b) b.addEventListener('click', function () {
      const name = $('#sjName').value.trim();
      if (!name) return toast('Name required', 'err');
      if (existing) existing.name = name;
      else state.subjects.push({ id: uid('s'), name: name, archived: false, createdAt: Date.now() });
      save(); closeOverlays(); render();
    });
  });
}

function noteSave(id) {
  const titleEl = $('#noteTitle');
  const bodyEl = $('#noteBody');
  if (!titleEl || !bodyEl) return;
  const title = titleEl.value.trim() || 'Untitled';
  const body = bodyEl.value;
  let n = state.notes.filter(function (x) { return x.id === id; })[0];
  if (!n) { n = { id: uid('n'), title: title, body: body, fav: false, folderId: state.transient.noteFolder || null, created: Date.now(), updated: Date.now(), versions: [] }; state.notes.push(n); }
  else {
    n.versions = (n.versions || []).concat({ body: n.body, at: Date.now() }).slice(-10);
    n.title = title; n.body = body; n.updated = Date.now();
  }
  save(); toast('Note saved', 'ok'); go('notes');
}

function reviewSession() {
  const queue = state.cards.filter(function (c) { return c.due <= Date.now(); });
  if (!queue.length) return toast('Nothing due');
  let i = 0;
  const show = function () {
    if (i >= queue.length) { closeOverlays(); render(); return toast('Reviewed ' + queue.length + ' cards', 'ok'); }
    const c = queue[i];
    modal('Card ' + (i + 1) + '/' + queue.length, '<div class="card" style="margin:0"><p style="margin:0;font-weight:700">' + esc(c.front) + '</p></div><p id="backTxt" class="muted" hidden style="margin:.6rem 0 0">' + esc(c.back) + '</p><div class="row" style="margin-top:.8rem" id="revBtns"><button class="btn btn-sm" id="reveal">Reveal</button></div>', function (r) {
      const rev = r.querySelector('#reveal');
      if (rev) rev.addEventListener('click', function () {
        const bt = r.querySelector('#backTxt');
        if (bt) bt.hidden = false;
        const wrap = r.querySelector('#revBtns');
        if (!wrap) return;
        wrap.innerHTML = ['hard', 'good', 'easy'].map(function (g) { return '<button class="btn btn-sm" data-grade="' + g + '">' + g + '</button>'; }).join('');
        $$('[data-grade]', wrap).forEach(function (b) {
          b.addEventListener('click', function () { gradeCard(c, b.dataset.grade); i++; show(); });
        });
      });
    });
  };
  show();
}

function gradeCard(c, grade) {
  const now = Date.now();
  c.ease = c.ease || 2.5;
  if (grade === 'hard') { c.ease = Math.max(1.3, c.ease - 0.2); c.interval = Math.max(1, (c.interval || 1) * 0.6); }
  else if (grade === 'good') { c.interval = (c.interval || 1) * c.ease; }
  else { c.ease = Math.min(3.2, c.ease + 0.15); c.interval = (c.interval || 1) * c.ease * 1.3; }
  c.interval = Math.min(365, Math.max(1, Math.round(c.interval)));
  c.due = now + c.interval * 86400000;
  c.reps = (c.reps || 0) + 1;
  c.history = (c.history || []).concat({ grade: grade, at: now }).slice(-30);
  award(2, 'card:' + c.id + ':' + c.reps);
  save();
}

function startQuiz(id) {
  const qz = state.quizzes.filter(function (x) { return x.id === id; })[0];
  if (!qz || !qz.questions.length) return toast('Quiz is empty', 'err');
  let i = 0, score = 0;
  const ask = function () {
    if (i >= qz.questions.length) return finish();
    const q = qz.questions[i];
    const opts = q.type === 'tf' ? ['True', 'False'] : q.options;
    const correctText = q.type === 'tf' ? (q.answer === true || q.answer === 'true' ? 'True' : 'False') : q.type === 'short' ? String(q.answer) : q.options[q.correct];
    modal('Q' + (i + 1) + '/' + qz.questions.length, '<p style="font-weight:700;margin:0 0 .6rem">' + esc(q.prompt) + '</p>' +
      (q.type === 'short' ? '<input type="text" id="sa">' : opts.map(function (o, oi) {
        return '<label class="rowitem" style="margin-top:.35rem;cursor:pointer"><input type="radio" name="opt" value="' + oi + '"><span>' + esc(o) + '</span></label>';
      }).join('')) +
      '<button class="btn btn-primary btn-block" style="margin-top:.7rem" id="nextQ">Next</button>', function (r) {
        const nb = r.querySelector('#nextQ');
        if (!nb) return;
        nb.addEventListener('click', function () {
          let given = '';
          let ok = false;
          if (q.type === 'short') {
            const sa = r.querySelector('#sa');
            given = sa ? sa.value.trim() : '';
            ok = given.toLowerCase() === String(q.answer).toLowerCase();
          } else {
            const sel = r.querySelector('input[name=opt]:checked');
            given = sel ? opts[Number(sel.value)] : '';
            ok = given === correctText;
          }
          if (ok) score++;
          else state.mistakes.push({ id: uid('m'), q: q.prompt, given: given, correct: correctText, fixed: false, at: Date.now() });
          i++;
          ask();
        });
      });
  };
  const finish = function () {
    state.attempts.push({ id: uid('a'), quizId: qz.id, quizTitle: qz.title, score: score, total: qz.questions.length, at: Date.now() });
    award(5, 'quiz:' + qz.id + ':' + state.attempts.length);
    save();
    modal('Result', '<p style="font-size:1.4rem;font-weight:800;margin:0">' + score + ' / ' + qz.questions.length + '</p><p class="muted">' + Math.round(score / qz.questions.length * 100) + '% correct. Wrong answers were saved to your mistake notebook.</p><div class="row" style="margin-top:.8rem"><button class="btn btn-sm" data-act="go" data-to="mistakes">Review mistakes</button><button class="btn btn-sm btn-primary" data-act="close-overlay">Done</button></div>');
    closeOverlays();
    modal('Result', '<p style="font-size:1.4rem;font-weight:800;margin:0">' + score + ' / ' + qz.questions.length + '</p><p class="muted">' + Math.round(score / qz.questions.length * 100) + '% correct. Wrong answers saved to your mistake notebook.</p><div class="row" style="margin-top:.8rem"><button class="btn btn-sm" data-act="go" data-to="mistakes">Review mistakes</button><button class="btn btn-sm btn-primary" data-act="close-overlay">Done</button></div>');
    render();
  };
  ask();
}

/* focus timer */
let focusTimer = null;

function focusTick() {
  const f = state.focus;
  if (!f.running) return;
  const left = Math.max(0, (f.endTs - Date.now()) / 1000);
  f.remaining = left;
  const el = document.getElementById('timer');
  if (el) el.textContent = fmtTime(left);
  if (left <= 0) {
    f.running = false;
    if (f.break) { f.break = false; f.remaining = state.settings.focusWork * 60; toast('Break over — back to focus', 'ok'); }
    else { logSession(); f.break = true; f.remaining = state.settings.focusBreak * 60; toast('Session complete. Take a break.', 'ok'); }
    beep();
    save();
    if (currentRoute === 'focus') render();
  }
}

function logSession() {
  const f = state.focus;
  const planned = (state.settings.focusWork * 60);
  const elapsed = Math.max(0, planned - f.remaining);
  if (elapsed < 30) return;
  const minutes = Math.round(elapsed / 60);
  const id = uid('f');
  state.sessions.push({ id: id, date: today(), minutes: minutes, subject: f.label, at: Date.now() });
  award(Math.min(20, minutes), 'focus:' + id);
  save();
}

function beep() {
  if (!state.settings.sounds) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

/* quran */
function refreshSurahs() {
  if (state.cache.surahList && Date.now() - state.cache.surahListAt < 7 * 86400000) return;
  fetch(QURAN_API + '/surah')
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.data) throw new Error('bad payload');
      state.cache.surahList = j.data.map(function (s) {
        return { number: s.number, name: s.name, englishName: s.englishName, numberOfAyahs: s.numberOfAyahs, revelationType: s.revelationType };
      });
      state.cache.surahListAt = Date.now();
      save();
      if (currentRoute === 'quran') render();
    })
    .catch(function () { toast('Could not load surah list', 'err'); });
}

function loadSurah(n) {
  const box = document.getElementById('quranReader');
  if (!box) return;
  const tr = state.settings.quranTranslation;
  const eds = 'quran-uthmani' + (tr !== 'none' ? ',' + tr : '');
  fetch(QURAN_API + '/surah/' + n + '/editions/' + eds)
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.data || !j.data[0]) throw new Error('bad payload');
      const ar = j.data[0];
      const trans = j.data[1] || null;
      const surah = { number: ar.number, name: ar.name, englishName: ar.englishName };
      state.quran.last = { number: surah.number, name: surah.englishName, ayah: 1, at: Date.now() };
      save();
      box.innerHTML = '<div class="spread"><h1 style="font-size:1.1rem;margin:0">' + surah.number + '. ' + esc(surah.englishName) + '</h1><span class="badge">' + ar.ayahs.length + ' ayah</span></div>' +
        '<p class="tiny">' + esc(ar.name) + '</p>' +
        '<div class="row" style="margin:.6rem 0"><button class="btn btn-sm btn-primary" data-act="quran-play" data-id="' + surah.number + '">▶ Play surah</button><button class="btn btn-sm" data-act="quran-stop">■ Stop</button></div>' +
        '<div class="card">' + ar.ayahs.map(function (a) {
          const trText = trans ? trans.ayahs[a.numberInSurah - 1].text : '';
          return '<div class="ayah" id="ay' + a.numberInSurah + '"><p class="ar" style="font-size:' + state.settings.arabicSize + 'rem">' + esc(a.text) + '<span class="num">' + a.numberInSurah + '</span></p>' +
            (state.settings.showTranslation && trText ? '<p class="muted" style="margin:.3rem 0 0">' + esc(trText) + '</p>' : '') +
            '<button class="btn btn-sm" style="margin-top:.3rem" data-act="quran-verse" data-id="' + a.number + '" data-s="' + surah.number + '" data-v="' + a.numberInSurah + '">▶ ' + a.numberInSurah + '</button></div>';
        }).join('') + '</div>' +
        '<p class="src">Text: AlQuran Cloud (quran-uthmani). Translation edition: ' + esc(tr) + '. Audio: Islamic Network CDN.</p>';
    })
    .catch(function () {
      box.innerHTML = '<div class="card"><p class="muted">Could not load this surah. Check your connection and retry.</p><button class="btn btn-sm btn-primary" data-act="quran-retry">Retry</button></div>';
    });
}

let qAudio = null;
let qQueue = [];

function playVerse(globalNum, label) {
  stopAudio();
  qAudio = new Audio(AUDIO_CDN + '/' + state.settings.quranReciter + '/' + globalNum + '.mp3');
  qAudio.play().catch(function () { toast('Audio unavailable', 'err'); });
  if (label) toast(label);
}

function stopAudio() {
  if (qAudio) { qAudio.pause(); qAudio = null; }
  qQueue = [];
}

/* research */
function runResearch() {
  const inp = document.getElementById('rsq');
  const out = document.getElementById('rsOut');
  if (!inp || !out) return;
  const q = inp.value.trim();
  if (!q) return toast('Enter a search term', 'err');
  out.innerHTML = '<div class="card"><div class="skel"></div></div>';
  fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=' + encodeURIComponent(q) + '&gsrlimit=8&prop=extracts|info&exintro=1&explaintext=1&inprop=url')
    .then(function (r) { return r.json(); })
    .then(function (j) {
      const pages = j && j.query && j.query.pages ? Object.keys(j.query.pages).map(function (k) { return j.query.pages[k]; }) : [];
      if (!pages.length) { out.innerHTML = '<div class="card"><p class="muted">No results.</p></div>'; return; }
      out.innerHTML = pages.map(function (p) {
        return '<div class="card"><b>' + esc(p.title) + '</b><p class="muted" style="margin:.3rem 0">' + esc(String(p.extract || '').slice(0, 320)) + '…</p><a class="src" href="' + esc(p.fullurl || ('https://en.wikipedia.org/wiki/' + encodeURIComponent(p.title))) + '" target="_blank" rel="noopener">' + esc(p.fullurl || 'en.wikipedia.org') + '</a></div>';
      }).join('');
    })
    .catch(function () { out.innerHTML = '<div class="card"><p class="muted">Search failed. Check your connection.</p></div>'; });
}

/* tutor */
function tutorSend() {
  const inp = document.getElementById('tutorIn');
  const out = document.getElementById('tutorOut');
  if (!inp || !out) return;
  const q = inp.value.trim();
  if (!q) return toast('Type a question', 'err');
  if (!state.settings.aiKey) return toast('Add an API key in Integrations', 'err');
  const modes = ['Teach me', 'Explain simply', 'Step by step', 'Give examples', 'Hints only', 'Test me', 'Summarize', 'Ask my notes'];
  out.innerHTML = '<p class="muted">Thinking…</p>';
  fetch(state.settings.aiBase.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.settings.aiKey },
    body: JSON.stringify({
      model: state.settings.aiModel,
      messages: [
        { role: 'system', content: 'You are StudyPilot, a study tutor. Mode: ' + modes[state.transient.tutorMode || 0] + '. Answer in ' + state.settings.lang + '. Keep equations and units exact.' },
        { role: 'user', content: q }
      ]
    })
  })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (j) {
      const txt = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : 'No content';
      state.transient.tutorOut = txt;
      out.innerHTML = '<p style="white-space:pre-wrap">' + esc(txt) + '</p>';
    })
    .catch(function (e) { out.innerHTML = '<p class="muted">Request failed: ' + esc(e.message) + '</p>'; });
}

function localTools() {
  const inp = document.getElementById('tutorIn');
  const txt = inp ? inp.value.trim() : '';
  if (!txt) return toast('Paste some text first', 'err');
  const sents = txt.split(/(?<=[.!?])\s+/).filter(function (s) { return s.length > 25; }).slice(0, 8);
  const qa = sents.map(function (s) {
    const words = s.split(' ');
    const key = words.slice(0, 4).join(' ');
    return { front: key + '…?', back: s };
  });
  sheet('Local tools (no AI)', '<p class="tiny">Built from your text with pattern rules. Nothing is sent anywhere.</p><div class="row" style="margin-top:.6rem"><button class="btn btn-sm" id="mkCards">Make ' + qa.length + ' flashcards</button><button class="btn btn-sm" id="summarise">Summarise</button></div><div id="ltOut" style="margin-top:.6rem"></div>', function (r) {
    const mc = r.querySelector('#mkCards');
    if (mc) mc.addEventListener('click', function () {
      let deck = state.decks.filter(function (d) { return d.name === 'Imported'; })[0];
      if (!deck) { deck = { id: uid('d'), name: 'Imported', createdAt: Date.now() }; state.decks.push(deck); }
      qa.forEach(function (c) { state.cards.push({ id: uid('c'), deckId: deck.id, front: c.front, back: c.back, due: Date.now(), interval: 1, ease: 2.5, reps: 0 }); });
      save(); closeOverlays(); toast(qa.length + ' cards added', 'ok');
    });
    const sm = r.querySelector('#summarise');
    if (sm) sm.addEventListener('click', function () {
      r.querySelector('#ltOut').innerHTML = '<p style="white-space:pre-wrap">' + esc(sents.slice(0, 3).join(' ')) + '</p>';
    });
  });
}

/* backup */
function exportJson() {
  downloadFile('studypilot-backup-' + today() + '.json', JSON.stringify(state, null, 2), 'application/json');
  toast('Backup downloaded', 'ok');
}

function exportCsv() {
  const rows = [['type', 'date', 'detail', 'value']];
  state.sessions.forEach(function (s) { rows.push(['session', s.date, s.subject || '', s.minutes]); });
  state.attempts.forEach(function (a) { rows.push(['quiz', dateOf(a.at), a.quizTitle, a.score + '/' + a.total]); });
  state.tasks.forEach(function (x) { rows.push(['task', x.date, x.title, x.done ? 'done' : 'open']); });
  downloadFile('studypilot-' + today() + '.csv', rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
  toast('CSV downloaded', 'ok');
}

function importJson(file) {
  const fr = new FileReader();
  fr.onload = function () {
    try {
      const parsed = JSON.parse(String(fr.result));
      state = migrate(parsed);
      validateSettings();
      applyDesign();
      save();
      render();
      toast('Backup restored', 'ok');
    } catch (e) { toast('Invalid backup file', 'err'); }
  };
  fr.readAsText(file);
}

function whatNow() {
  const candidates = state.topics.filter(function (x) { return !x.done; });
  if (!candidates.length) {
    const task = state.tasks.filter(function (x) { return !x.done; })[0];
    return modal(t('whatNow'), task ? '<p>Next open task: <b>' + esc(task.title) + '</b></p><button class="btn btn-sm btn-primary" data-act="go" data-to="plan">Open plan</button>' : '<p class="muted">Add subjects and topics to get recommendations.</p>');
  }
  candidates.sort(function (a, b) {
    const ageA = a.lastRevised ? (Date.now() - new Date(a.lastRevised).getTime()) / 86400000 : 99;
    const ageB = b.lastRevised ? (Date.now() - new Date(b.lastRevised).getTime()) / 86400000 : 99;
    return (b.confidence ? 6 - b.confidence : 3) + ageB / 10 - ((a.confidence ? 6 - a.confidence : 3) + ageA / 10);
  });
  const pick = candidates[0];
  const subj = state.subjects.filter(function (s) { return s.id === pick.subjectId; })[0];
  modal(t('whatNow'), '<p style="font-weight:700;margin:0">' + esc(pick.name) + '</p><p class="muted">' + esc(subj ? subj.name : '') + ' · confidence ' + pick.confidence + '/5 · ' + (pick.lastRevised ? 'last revised ' + fmtDate(pick.lastRevised) : 'never revised') + '</p><div class="row" style="margin-top:.7rem"><button class="btn btn-sm btn-primary" data-act="go" data-to="focus">Start focus</button><button class="btn btn-sm" id="markRev">Mark revised</button></div>', function (r) {
    const b = r.querySelector('#markRev');
    if (b) b.addEventListener('click', function () { pick.lastRevised = today(); save(); closeOverlays(); toast('Marked revised', 'ok'); });
  });
}

/* ---------- 9. boot ---------- */
function bindDelegation() {
  document.addEventListener('click', function (e) {
    const el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    const act = el.dataset.act;
    const id = el.dataset.id;

    switch (act) {
      case 'go': go(el.dataset.to); break;
      case 'back': { const prev = navStack.pop() || 'home'; location.hash = '#/' + prev; break; }
      case 'close-overlay': closeOverlays(); break;
      case 'install': doInstall(); break;
      case 'dismiss-install': { const b = $('#installBanner'); if (b) b.hidden = true; break; }

      case 'task-new': taskForm(); break;
      case 'task-save': taskSave(); break;
      case 'task-toggle': {
        const x = state.tasks.filter(function (t2) { return t2.id === id; })[0];
        if (x) { x.done = !x.done; if (x.done) award(3, 'task:' + x.id); save(); render(); }
        break;
      }
      case 'task-del': {
        const x = state.tasks.filter(function (t2) { return t2.id === id; })[0];
        if (x) confirmAsk('Delete task', x.title, 'Delete', function () { state.tasks = state.tasks.filter(function (t2) { return t2.id !== id; }); save(); render(); });
        break;
      }
      case 'task-resched': {
        const x = state.tasks.filter(function (t2) { return t2.id === id; })[0];
        if (x) { x.rescheduled = (x.rescheduled || 0) + 1; x.date = today(); save(); render(); }
        break;
      }
      case 'task-resched-all':
        state.tasks.forEach(function (x) { if (!x.done && x.date < today()) { x.date = today(); x.rescheduled = (x.rescheduled || 0) + 1; } });
        save(); render(); break;

      case 'subject-new': subjectForm(null); break;
      case 'subject-edit': { const s = state.subjects.filter(function (x) { return x.id === id; })[0]; if (s) subjectForm(s); break; }
      case 'topic-new': {
        modal('New topic', '<label class="field">Topic name<input type="text" id="tpName"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="tpSave">Save</button></div>', function (r) {
          const b = r.querySelector('#tpSave');
          if (b) b.addEventListener('click', function () {
            const name = $('#tpName').value.trim();
            if (!name) return toast('Name required', 'err');
            state.topics.push({ id: uid('tp'), subjectId: id, name: name, done: false, confidence: 3, lastRevised: null });
            save(); closeOverlays(); render();
          });
        });
        break;
      }
      case 'topic-done': {
        const x = state.topics.filter(function (t2) { return t2.id === id; })[0];
        if (x) { x.done = !x.done; if (x.done) { x.lastRevised = today(); award(4, 'topic:' + x.id); } save(); render(); }
        break;
      }
      case 'topic-conf': {
        const x = state.topics.filter(function (t2) { return t2.id === id; })[0];
        if (x) { x.confidence = x.confidence >= 5 ? 1 : x.confidence + 1; save(); render(); toast('Confidence ' + x.confidence + '/5'); }
        break;
      }

      case 'note-new': go('notes/new'); break;
      case 'note-open': go('notes/' + id); break;
      case 'note-save': noteSave(id); break;
      case 'note-fav': { const n = state.notes.filter(function (x) { return x.id === id; })[0]; if (n) { n.fav = !n.fav; save(); render(); } break; }
      case 'note-folder': { state.transient.noteFolder = state.transient.noteFolder === id ? null : id; render(); break; }
      case 'folder-new': {
        modal('New folder', '<label class="field">Name<input type="text" id="fdName"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="fdSave">Save</button></div>', function (r) {
          const b = r.querySelector('#fdSave');
          if (b) b.addEventListener('click', function () {
            const name = $('#fdName').value.trim();
            if (!name) return toast('Name required', 'err');
            state.folders.push({ id: uid('f2'), name: name });
            save(); closeOverlays(); render();
          });
        });
        break;
      }
      case 'note-export': {
        const n = state.notes.filter(function (x) { return x.id === id; })[0];
        if (n) downloadFile((n.title || 'note') + '.md', '# ' + n.title + '\n\n' + n.body, 'text/markdown');
        break;
      }
      case 'note-ai': {
        const n = state.notes.filter(function (x) { return x.id === id; })[0];
        if (!n) break;
        const sents = String(n.body || '').split(/(?<=[.!?])\s+/).filter(function (s) { return s.length > 25; }).slice(0, 10);
        if (!sents.length) return toast('Note too short', 'err');
        let deck = state.decks.filter(function (d) { return d.name === 'From notes'; })[0];
        if (!deck) { deck = { id: uid('d'), name: 'From notes', createdAt: Date.now() }; state.decks.push(deck); }
        sents.forEach(function (s) { state.cards.push({ id: uid('c'), deckId: deck.id, front: s.split(' ').slice(0, 4).join(' ') + '…?', back: s, due: Date.now(), interval: 1, ease: 2.5, reps: 0 }); });
        save(); toast(sents.length + ' cards created', 'ok');
        break;
      }

      case 'deck-new': {
        modal(t('addDeck'), '<label class="field">Deck name<input type="text" id="dkName"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="dkSave">Save</button></div>', function (r) {
          const b = r.querySelector('#dkSave');
          if (b) b.addEventListener('click', function () {
            const name = $('#dkName').value.trim();
            if (!name) return toast('Name required', 'err');
            state.decks.push({ id: uid('d'), name: name, createdAt: Date.now() });
            save(); closeOverlays(); render();
          });
        });
        break;
      }
      case 'card-new': {
        modal('New card', '<label class="field">Front<input type="text" id="cdF"></label><label class="field" style="margin-top:.5rem">Back<input type="text" id="cdB"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="cdSave">Save</button></div>', function (r) {
          const b = r.querySelector('#cdSave');
          if (b) b.addEventListener('click', function () {
            const f = $('#cdF').value.trim();
            const bk = $('#cdB').value.trim();
            if (!f || !bk) return toast('Both sides required', 'err');
            state.cards.push({ id: uid('c'), deckId: id, front: f, back: bk, due: Date.now(), interval: 1, ease: 2.5, reps: 0 });
            save(); closeOverlays(); render(); toast('Card added', 'ok');
          });
        });
        break;
      }
      case 'card-review': reviewSession(); break;

      case 'quiz-new': {
        modal('New quiz', '<label class="field">Title<input type="text" id="qzT"></label><label class="field" style="margin-top:.5rem">Question<input type="text" id="qzQ"></label><label class="field" style="margin-top:.5rem">Correct answer<input type="text" id="qzA"></label><label class="field" style="margin-top:.5rem">Wrong option 1<input type="text" id="qzW1"></label><label class="field" style="margin-top:.5rem">Wrong option 2<input type="text" id="qzW2"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="qzSave">Save</button></div><p class="tiny" style="margin:.5rem 0 0">Add one question now; more can be added later.</p>', function (r) {
          const b = r.querySelector('#qzSave');
          if (b) b.addEventListener('click', function () {
            const title = $('#qzT').value.trim();
            const prompt = $('#qzQ').value.trim();
            const ans = $('#qzA').value.trim();
            const w1 = $('#qzW1').value.trim();
            const w2 = $('#qzW2').value.trim();
            if (!title || !prompt || !ans) return toast('Title, question and answer required', 'err');
            const options = [ans, w1 || 'None of these', w2 || 'All of these'];
            state.quizzes.push({ id: uid('q'), title: title, questions: [{ prompt: prompt, type: 'mcq', options: options, correct: 0 }], createdAt: Date.now() });
            save(); closeOverlays(); render(); toast('Quiz created', 'ok');
          });
        });
        break;
      }
      case 'quiz-start': startQuiz(id); break;

      case 'exam-new': {
        modal(t('addExam'), '<label class="field">Exam title<input type="text" id="exT"></label><label class="field" style="margin-top:.5rem">Subject<input type="text" id="exS"></label><label class="field" style="margin-top:.5rem">Date<input type="date" id="exD" value="' + today() + '"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="exSave">Save</button></div>', function (r) {
          const b = r.querySelector('#exSave');
          if (b) b.addEventListener('click', function () {
            const title = $('#exT').value.trim();
            if (!title) return toast('Title required', 'err');
            state.exams.push({ id: uid('e'), title: title, subject: $('#exS').value.trim(), date: $('#exD').value || today() });
            save(); closeOverlays(); render(); toast('Exam added', 'ok');
          });
        });
        break;
      }
      case 'exam-del': state.exams = state.exams.filter(function (x) { return x.id !== id; }); save(); render(); break;

      case 'mistake-fix': { const m = state.mistakes.filter(function (x) { return x.id === id; })[0]; if (m) { m.fixed = !m.fixed; save(); render(); } break; }
      case 'mistake-retry': {
        const open = state.mistakes.filter(function (m) { return !m.fixed; });
        if (!open.length) return toast('No open mistakes');
        modal('Retry', '<p class="muted">' + open.length + ' open mistakes. Review them in the notebook and mark each one corrected.</p><button class="btn btn-sm btn-primary" data-act="close-overlay">OK</button>');
        break;
      }

      case 'focus-toggle': {
        const f = state.focus;
        if (f.running) { f.remaining = Math.max(0, (f.endTs - Date.now()) / 1000); f.running = false; }
        else { f.endTs = Date.now() + f.remaining * 1000; f.running = true; }
        save(); render(); break;
      }
      case 'focus-finish': {
        const f = state.focus;
        if (f.running) f.remaining = Math.max(0, (f.endTs - Date.now()) / 1000);
        f.running = false;
        if (!f.break) logSession();
        f.break = false;
        f.remaining = state.settings.focusWork * 60;
        save(); render(); break;
      }
      case 'focus-reset': {
        const f = state.focus;
        f.running = false; f.break = false; f.remaining = state.settings.focusWork * 60;
        save(); render(); break;
      }
      case 'focus-sound': state.settings.sounds = !state.settings.sounds; save(); render(); break;

      case 'quran-open': state.transient.quranNum = Number(id); go('quran/read'); break;
      case 'quran-resume': if (state.quran.last) { state.transient.quranNum = state.quran.last.number; go('quran/read'); } break;
      case 'quran-retry': loadSurah(Number(state.transient.quranNum || 1)); break;
      case 'quran-play': {
        const box = document.getElementById('quranReader');
        if (!box) break;
        const btns = $$('[data-act="quran-verse"]', box);
        qQueue = btns.map(function (b) { return { g: b.dataset.id, v: b.dataset.v, s: b.dataset.s }; });
        const next = function () {
          const item = qQueue.shift();
          if (!item) return;
          playVerse(item.g, 'Ayah ' + item.v);
          if (qAudio) qAudio.onended = function () { $$('.ayah.playing').forEach(function (x) { x.classList.remove('playing'); }); const cur = document.getElementById('ay' + item.v); if (cur) cur.classList.add('playing'); next(); };
        };
        next();
        break;
      }
      case 'quran-verse': playVerse(id, 'Ayah ' + el.dataset.v); break;
      case 'quran-stop': stopAudio(); break;
      case 'quran-reciters': {
        modal('Reciter', '<div class="stack">' + ['ar.alafasy', 'ar.abdulbasitmurattal', 'ar.minshawi', 'ar.husary'].map(function (r2) {
          return '<button class="btn btn-sm" data-act="set-reciter" data-id="' + r2 + '">' + r2 + '</button>';
        }).join('') + '</div><p class="tiny" style="margin:.6rem 0 0">Identifier list from AlQuran Cloud audio editions.</p>');
        break;
      }
      case 'set-reciter': state.settings.quranReciter = id; save(); closeOverlays(); render(); toast('Reciter set'); break;

      case 'tutor-mode': state.transient.tutorMode = Number(id); render(); break;
      case 'tutor-send': tutorSend(); break;
      case 'tutor-local': localTools(); break;
      case 'research-run': runResearch(); break;

      case 'paper-new': {
        modal('Import paper', '<label class="field">Title<input type="text" id="ppT"></label><label class="field" style="margin-top:.5rem">Source URL<input type="url" id="ppU" placeholder="https://…"></label><div class="row"><label class="field" style="flex:1">Board<input type="text" id="ppB"></label><label class="field" style="flex:1">Year<input type="number" id="ppY"></label></div><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="ppSave">Save</button></div>', function (r) {
          const b = r.querySelector('#ppSave');
          if (b) b.addEventListener('click', function () {
            const title = $('#ppT').value.trim();
            const url = $('#ppU').value.trim();
            if (!title) return toast('Title required', 'err');
            if (url && !isSafeUrl(url)) return toast('URL must start with http(s)', 'err');
            state.papers.push({ id: uid('p'), title: title, url: url, board: $('#ppB').value.trim(), year: $('#ppY').value.trim(), fav: false });
            save(); closeOverlays(); render();
          });
        });
        break;
      }
      case 'paper-open': {
        const p = state.papers.filter(function (x) { return x.id === id; })[0];
        if (p && isSafeUrl(p.url)) window.open(p.url, '_blank', 'noopener');
        else toast('No valid URL', 'err');
        break;
      }
      case 'paper-fav': { const p = state.papers.filter(function (x) { return x.id === id; })[0]; if (p) { p.fav = !p.fav; save(); render(); } break; }
      case 'paper-del': state.papers = state.papers.filter(function (x) { return x.id !== id; }); save(); render(); break;

      case 'open-recent': {
        const kind = el.dataset.kind;
        if (kind === 'note') go('notes/' + id);
        else if (kind === 'subject') go('plan/subjects');
        else if (kind === 'paper') { const p = state.papers.filter(function (x) { return x.id === id; })[0]; if (p && isSafeUrl(p.url)) window.open(p.url, '_blank', 'noopener'); }
        else if (kind === 'card') go('cards');
        break;
      }
      case 'search-again': { const s = document.getElementById('globalSearch'); if (s) { s.value = id; runGlobalSearch(id); } break; }

      case 'set': {
        const k = el.dataset.k, v = el.dataset.v;
        state.settings[k] = v;
        if (k === 'lang') { applyDesign(); }
        applyDesign(); save(); render();
        break;
      }
      case 'widgets': {
        sheet('Dashboard widgets', '<p class="tiny">Toggle visibility. Order follows the list below.</p><div class="stack" style="margin-top:.6rem">' +
          state.settings.widgets.map(function (w) {
            const on = state.settings.widgetsHidden.indexOf(w) === -1;
            return '<label class="switch">' + esc(w) + '<input type="checkbox" data-widget="' + w + '"' + (on ? ' checked' : '') + '></label>';
          }).join('') + '</div>', function (r) {
            $$('[data-widget]', r).forEach(function (c) {
              c.addEventListener('change', function () {
                const w = c.dataset.widget;
                if (c.checked) state.settings.widgetsHidden = state.settings.widgetsHidden.filter(function (x) { return x !== w; });
                else if (state.settings.widgetsHidden.indexOf(w) === -1) state.settings.widgetsHidden.push(w);
                save(); render();
              });
            });
          });
        break;
      }
      case 'save-integrations': {
        const b = document.getElementById('aiBaseIn'), m = document.getElementById('aiModelIn'), k = document.getElementById('aiKeyIn');
        if (b) state.settings.aiBase = b.value.trim() || DEFAULT_SETTINGS.aiBase;
        if (m) state.settings.aiModel = m.value.trim() || DEFAULT_SETTINGS.aiModel;
        if (k) state.settings.aiKey = k.value.trim();
        const qi = document.getElementById('qfId'), qs = document.getElementById('qfSec');
        if (qi) state.settings.qfClientId = qi.value.trim();
        if (qs) state.settings.qfClientSecret = qs.value.trim();
        save(); toast('Saved', 'ok');
        break;
      }
      case 'export-json': exportJson(); break;
      case 'export-csv': exportCsv(); break;
      case 'reset-all':
        confirmAsk('Delete all data', 'Notes, cards, sessions and settings will be erased. Export a backup first.', 'Delete everything', function () {
          localStorage.removeItem(LS_KEY);
          localStorage.removeItem(LS_LEGACY);
          state = freshState();
          applyDesign(); save(); go('home'); toast('All data deleted', 'ok');
        });
        break;
      case 'reset-prefs':
        confirmAsk('Reset preferences', 'Appearance and study settings return to defaults. Your study data is kept.', 'Reset', function () {
          state.settings = Object.assign({}, DEFAULT_SETTINGS);
          applyDesign(); save(); render(); toast('Preferences reset', 'ok');
        });
        break;
      case 'update-check': checkUpdate(); break;

      case 'calc': {
        const i = document.getElementById('calcIn'), o = document.getElementById('calcOut');
        if (!i || !o) break;
        try {
          const expr = i.value.replace(/\^/g, '**').replace(/[^0-9+\-*/(). %]/g, '');
          const r2 = Function('"use strict";return (' + expr + ')')();
          o.textContent = String(r2);
        } catch (e) { o.textContent = 'Invalid expression'; }
        break;
      }
      case 'convert': {
        const v = Number(document.getElementById('ucVal').value);
        const from = document.getElementById('ucFrom').value;
        const to = document.getElementById('ucTo').value;
        const o = document.getElementById('ucOut');
        const table = { km: 1000, m: 1, mi: 1609.344, ft: 0.3048, kg: 1, lb: 0.45359237 };
        if (!table[from] || !table[to]) { o.textContent = 'Pick compatible units'; break; }
        o.textContent = v + ' ' + from + ' = ' + (v * table[from] / table[to]).toFixed(4) + ' ' + to;
        break;
      }

      case 'group-create': {
        const nm = document.getElementById('gName');
        const mm = document.getElementById('gMember');
        if (mm) state.settings.groupMember = mm.value.trim();
        if (!nm || !nm.value.trim()) return toast('Group name required', 'err');
        state.groups.push({ id: uid('g'), name: nm.value.trim(), code: Math.random().toString(36).slice(2, 8).toUpperCase(), members: [state.settings.groupMember || 'You'], announcements: [] });
        save(); render(); toast('Group created', 'ok');
        break;
      }
      case 'group-join': {
        modal('Join group', '<label class="field">Join code<input type="text" id="gjCode"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="gjOk">Join</button></div>', function (r) {
          const b = r.querySelector('#gjOk');
          if (b) b.addEventListener('click', function () {
            const code = $('#gjCode').value.trim().toUpperCase();
            const g = state.groups.filter(function (x) { return x.code === code; })[0];
            if (g) toast('Already in this group');
            else { state.groups.push({ id: uid('g'), name: 'Group ' + code, code: code, members: [state.settings.groupMember || 'You'], announcements: [] }); save(); render(); toast('Joined', 'ok'); }
            closeOverlays();
          });
        });
        break;
      }
      case 'group-checkin': {
        const g = state.groups.filter(function (x) { return x.id === id; })[0];
        if (g) { g.announcements = (g.announcements || []).concat((state.settings.groupMember || 'You') + ' checked in ' + new Date().toLocaleTimeString()); save(); render(); }
        break;
      }
      case 'group-announce': {
        modal('Announce', '<label class="field">Message<input type="text" id="gaMsg"></label><div class="row" style="margin-top:.6rem"><button class="btn btn-ghost" data-act="close-overlay">Cancel</button><button class="btn btn-primary" id="gaOk">Post</button></div>', function (r) {
          const b = r.querySelector('#gaOk');
          if (b) b.addEventListener('click', function () {
            const msg = $('#gaMsg').value.trim();
            const g = state.groups.filter(function (x) { return x.id === id; })[0];
            if (msg && g) { g.announcements = (g.announcements || []).concat(msg); save(); closeOverlays(); render(); }
          });
        });
        break;
      }
      case 'group-leave': state.groups = state.groups.filter(function (x) { return x.id !== id; }); save(); render(); break;

      case 'feedback': {
        const msg = 'StudyPilot feedback (v' + APP_VERSION + ')%0A%0A';
        window.open(FOUNDER.waLink + '?text=' + msg, '_blank', 'noopener');
        break;
      }
      case 'what-now': whatNow(); break;

      default: break;
    }
  });

  document.addEventListener('input', debounce(function (e) {
    const id = e.target.id;
    if (id === 'noteSearch') { state.transient.noteQuery = e.target.value; const l = state.notes; render(); const el = document.getElementById('noteSearch'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
    if (id === 'libQuery') { state.transient.libQuery = e.target.value; const o = document.getElementById('libOut'); if (o) o.innerHTML = libraryResults(); }
    if (id === 'quranSearch') { state.transient.quranQuery = e.target.value; }
    if (id === 'globalSearch') runGlobalSearch(e.target.value);
  }, 220));

  document.addEventListener('change', function (e) {
    if (e.target.id === 'importJson' && e.target.files[0]) importJson(e.target.files[0]);
    if (e.target.id === 'noteImport' && e.target.files[0]) {
      const fr = new FileReader();
      fr.onload = function () { const b = document.getElementById('noteBody'); if (b) b.value += String(fr.result); toast('Imported into note'); };
      fr.readAsText(e.target.files[0]);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOverlays();
  });
}

function runGlobalSearch(q) {
  const out = document.getElementById('searchOut');
  if (!out) return;
  q = String(q || '').toLowerCase().trim();
  if (!q) { out.innerHTML = ''; return; }
  state.searches = [q].concat(state.searches.filter(function (s) { return s !== q; })).slice(0, 10);
  const hits = [];
  state.notes.forEach(function (n) { if ((n.title + ' ' + n.body).toLowerCase().indexOf(q) > -1) hits.push({ k: 'note', id: n.id, t: n.title, s: 'Note' }); });
  state.cards.forEach(function (c) { if ((c.front + ' ' + c.back).toLowerCase().indexOf(q) > -1) hits.push({ k: 'card', id: c.id, t: c.front, s: 'Card' }); });
  state.subjects.forEach(function (s) { if (s.name.toLowerCase().indexOf(q) > -1) hits.push({ k: 'subject', id: s.id, t: s.name, s: 'Subject' }); });
  state.papers.forEach(function (p) { if ((p.title + ' ' + (p.subject || '')).toLowerCase().indexOf(q) > -1) hits.push({ k: 'paper', id: p.id, t: p.title, s: 'Paper' }); });
  const list = state.cache.surahList || [];
  list.forEach(function (s) { if (s.englishName.toLowerCase().indexOf(q) > -1) hits.push({ k: 'surah', id: s.number, t: s.englishName, s: 'Surah' }); });
  out.innerHTML = hits.length ? '<div class="card">' + hits.slice(0, 40).map(function (h) {
    return '<div class="rowitem" style="margin-top:.35rem" data-act="open-recent" data-kind="' + h.k + '" data-id="' + h.id + '"><div class="grow"><b>' + esc(h.t || 'Untitled') + '</b><small>' + esc(h.s) + '</small></div><span>›</span></div>';
  }).join('') + '</div>' : '<div class="card"><div class="empty"><span class="em">🔎</span><span>No matches.</span></div></div>';
  save();
}

/* install + service worker */
let deferredPrompt = null;
let swReg = null;

function doInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (c) {
      if (c.outcome === 'accepted') toast('Installing…', 'ok');
      deferredPrompt = null;
      const b = $('#installBanner'); if (b) b.hidden = true;
    });
  } else {
    modal('Install StudyPilot', '<p class="muted">Chrome/Edge: menu ⋮ → “Install app” or “Add to Home screen”. iOS Safari: Share → “Add to Home Screen”. The prompt only appears after the app has been opened from HTTPS once.</p>');
  }
}

function checkUpdate() {
  if (!swReg) return toast('Service worker not active');
  swReg.update();
  if (swReg.waiting) {
    modal('Update ready', '<p class="muted">A newer version is available.</p><div class="row" style="margin-top:.6rem"><button class="btn btn-sm" data-act="close-overlay">Later</button><button class="btn btn-sm btn-primary" id="doUpdate">Reload</button></div>', function (r) {
      const b = r.querySelector('#doUpdate');
      if (b) b.addEventListener('click', function () { swReg.waiting.postMessage('SKIP_WAITING'); });
    });
  } else {
    toast('You are on the latest version', 'ok');
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (reg) {
    swReg = reg;
    reg.addEventListener('updatefound', function () {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', function () {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('Update available — Settings → Check for updates');
      });
    });
  }).catch(function () {});
  navigator.serviceWorker.addEventListener('controllerchange', function () { location.reload(); });
}

function initNetwork() {
  const bar = $('#netbar');
  const set = function () { if (bar) bar.hidden = navigator.onLine; };
  window.addEventListener('online', function () { set(); toast('Back online', 'ok'); });
  window.addEventListener('offline', set);
  set();
}

function initInstall() {
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    const b = $('#installBtn'); if (b) b.hidden = false;
    const banner = $('#installBanner'); if (banner) banner.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    const b = $('#installBtn'); if (b) b.hidden = true;
    const banner = $('#installBanner'); if (banner) banner.hidden = true;
    toast('Installed', 'ok');
  });
}

function initOnboarding() {
  if (state.settings.onboarded) return;
  sheet('Welcome to StudyPilot', '<p class="muted">Plan study, keep notes, revise with real spaced repetition, and track honest progress. Everything is stored on this device.</p><label class="field" style="margin-top:.6rem">Your name (optional)<input type="text" id="obName" placeholder="What should we call you?"></label><label class="field" style="margin-top:.5rem">Daily goal (minutes)<input type="number" id="obGoal" value="120" min="15" max="900"></label><div class="row" style="margin-top:.8rem"><button class="btn btn-ghost" id="obSkip">Skip</button><button class="btn btn-primary" id="obDone">Get started</button></div>', function (r) {
    const finish = function () {
      const nm = r.querySelector('#obName'), gl = r.querySelector('#obGoal');
      if (nm && nm.value.trim()) state.settings.groupMember = nm.value.trim();
      if (gl) state.settings.goalMinutes = clamp(gl.value, 15, 900);
      state.settings.onboarded = true;
      save(); closeOverlays(); render();
    };
    r.querySelector('#obDone').addEventListener('click', finish);
    r.querySelector('#obSkip').addEventListener('click', function () { state.settings.onboarded = true; save(); closeOverlays(); });
  });
}

function boot() {
  load();
  applyDesign();
  bindDelegation();
  initNetwork();
  initInstall();

  const f = state.focus;
  if (f.running) { f.remaining = Math.max(0, (f.endTs - Date.now()) / 1000); if (f.remaining <= 0) f.running = false; }
  else if (!f.remaining) f.remaining = state.settings.focusWork * 60;

  focusTimer = setInterval(focusTick, 500);

  if (!location.hash) location.hash = '#/' + (state.settings.landing || 'home');
  window.addEventListener('hashchange', render);
  render();

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = function () { if (state.settings.theme === 'system') applyDesign(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);

  setTimeout(function () {
    const sp = $('#splash');
    if (sp) { sp.classList.add('hide'); setTimeout(function () { sp.remove(); }, 400); }
  }, 450);

  initOnboarding();
  registerSW();
  refreshSurahs();
}

document.addEventListener('DOMContentLoaded', function () {
  try { boot(); }
  catch (e) {
    const v = document.getElementById('view');
    if (v) v.innerHTML = '<div class="card"><h2>Startup error</h2><p class="muted">' + esc(e.message) + '</p></div>';
    console.error(e);
  }
});
