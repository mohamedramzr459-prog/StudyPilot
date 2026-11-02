const KEY = 'studypilot_v1';
const def = {name:'',goal:60,focus:25,brk:5,tasks:[],notes:[],cards:[],sessions:[],exam:null};
let S;
try { S = Object.assign({}, def, JSON.parse(localStorage.getItem(KEY) || '{}')); }
catch (e) { S = Object.assign({}, def); }

const $ = id => document.getElementById(id);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const day = d => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const PR = {high:'🔴', med:'🟡', low:'🟢'};
const ORDER = {high:0, med:1, low:2};

/* ---------- Navigation ---------- */
function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === id));
  render(); window.scrollTo(0, 0);
}
function sub(id) {
  ['tasksV', 'notesV', 'cardsV'].forEach(v => $(v).hidden = v !== id);
  document.querySelectorAll('.tabs button[data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === id));
  render();
}

/* ---------- Stats helpers ---------- */
const minsOn = d => S.sessions.filter(s => s.date === d).reduce((a, s) => a + s.min, 0);
function streak() {
  let n = 0, d = new Date();
  if (!minsOn(day(d))) d.setDate(d.getDate() - 1);
  while (minsOn(day(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- Tasks ---------- */
function addTask() {
  const t = $('tTitle').value.trim();
  if (!t) return $('tTitle').focus();
  S.tasks.push({id:uid(), t, sub:$('tSub').value.trim() || 'General', due:$('tDue').value, pri:$('tPri').value, done:false});
  $('tTitle').value = ''; save(); render();
}
function toggleTask(id) {
  const t = S.tasks.find(x => x.id === id);
  if (t) { t.done = !t.done; save(); render(); }
}
function delTask(id) { S.tasks = S.tasks.filter(x => x.id !== id); save(); render(); }
function taskHTML(t) {
  return `<div class="item ${t.done ? 'done' : ''}">
    <button class="chk" onclick="toggleTask('${t.id}')">${t.done ? '✅' : '⬜'}</button>
    <div class="grow"><b>${esc(t.t)}</b><small>${PR[t.pri]} ${esc(t.sub)}${t.due ? ' • 📅 ' + esc(t.due) : ''}</small></div>
    <button class="x" onclick="delTask('${t.id}')">🗑</button></div>`;
}
function sortedTasks(list) {
  return list.slice().sort((a, b) => (a.done - b.done) || (ORDER[a.pri] - ORDER[b.pri]) || (a.due || '9').localeCompare(b.due || '9'));
}
function renderTasks() {
  const q = $('tSearch').value.toLowerCase(), f = $('tFilter').value;
  const list = sortedTasks(S.tasks).filter(t =>
    (f === 'all' || (f === 'done') === t.done) &&
    (t.t + ' ' + t.sub).toLowerCase().includes(q));
  $('taskList').innerHTML = list.map(taskHTML).join('') || '<div class="empty">No tasks yet ✨</div>';
}

/* ---------- Notes ---------- */
function addNote() {
  const t = $('nTitle').value.trim(), b = $('nBody').value.trim();
  if (!t && !b) return;
  S.notes.unshift({id:uid(), t:t || 'Untitled', b, date:day()});
  $('nTitle').value = ''; $('nBody').value = ''; save(); render();
}
function delNote(id) { S.notes = S.notes.filter(n => n.id !== id); save(); render(); }
function renderNotes() {
  $('noteList').innerHTML = S.notes.map(n => `<div class="item">
    <div class="grow"><b>${esc(n.t)}</b><small>${esc(n.date)}</small><p>${esc(n.b)}</p></div>
    <button class="x" onclick="delNote('${n.id}')">🗑</button></div>`).join('') || '<div class="empty">No notes yet 📝</div>';
}

/* ---------- Flashcards ---------- */
let ci = 0, flip = false;
function addCard() {
  const q = $('cQ').value.trim(), a = $('cA').value.trim();
  if (!q || !a) return;
  S.cards.push({id:uid(), q, a}); $('cQ').value = ''; $('cA').value = '';
  ci = S.cards.length - 1; flip = false; save(); render();
}
function drawCard() {
  const c = S.cards;
  if (!c.length) { $('fc').textContent = 'Add a card to start revising 🧠'; $('cCount').textContent = ''; return; }
  ci = ci % c.length;
  $('fc').textContent = flip ? '💡 ' + c[ci].a : '❓ ' + c[ci].q;
  $('cCount').textContent = 'Card ' + (ci + 1) + ' of ' + c.length + ' • tap card to flip';
}
function flipC() { flip = !flip; drawCard(); }
function nextC() { ci++; flip = false; drawCard(); }
function delCard() {
  if (!S.cards.length) return;
  S.cards.splice(ci, 1); flip = false; save(); render();
}

/* ---------- Focus timer ---------- */
let T = {left:0, end:0, run:false, mode:'focus', id:null};
function setMode(m) {
  clearInterval(T.id); T.mode = m; T.run = false;
  T.left = (m === 'focus' ? S.focus : S.brk) * 60;
  $('mF').classList.toggle('on', m === 'focus');
  $('mB').classList.toggle('on', m === 'break');
  drawT();
}
function startT() {
  if (T.run || T.left <= 0) return;
  T.run = true; T.end = Date.now() + T.left * 1000;
  T.id = setInterval(tick, 500); drawT();
}
function pauseT() {
  if (!T.run) return;
  T.left = Math.max(0, Math.round((T.end - Date.now()) / 1000));
  T.run = false; clearInterval(T.id); drawT();
}
function resetT() { setMode(T.mode); }
function tick() {
  T.left = Math.max(0, Math.round((T.end - Date.now()) / 1000));
  drawT();
  if (T.left <= 0) { clearInterval(T.id); T.run = false; finish(); }
}
function drawT() {
  const t = pad(Math.floor(T.left / 60)) + ':' + pad(T.left % 60);
  $('time').textContent = t;
  $('tState').textContent = T.run ? (T.mode === 'focus' ? '🎯 Stay focused...' : '☕ Relax...') : 'Ready';
  $('fToday').textContent = 'Focused today: ' + minsOn(day()) + ' min';
  document.title = T.run ? t + ' • StudyPilot' : 'StudyPilot';
}
function finish() {
  if (T.mode === 'focus') {
    S.sessions.push({id:uid(), date:day(), min:S.focus, sub:$('fSub').value.trim() || 'General'});
    save();
  }
  if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  alert(T.mode === 'focus' ? '🎉 Focus session complete! Take a break.' : '⏰ Break over. Ready to focus?');
  setMode(T.mode === 'focus' ? 'break' : 'focus'); render();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && T.run) tick(); });

/* ---------- Exam ---------- */
function saveExam() {
  const n = $('examName').value.trim(), d = $('examDate').value;
  S.exam = (n && d) ? {name:n, date:d} : null; save(); render();
}

/* ---------- Home ---------- */
function renderHome() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  $('greet').textContent = g + (S.name ? ', ' + S.name : '') + ' 👋';
  $('date').textContent = new Date().toLocaleDateString(undefined, {weekday:'long', day:'numeric', month:'long'});
  const m = minsOn(day()), pct = Math.min(100, Math.round(m / S.goal * 100));
  $('ring').style.setProperty('--v', pct);
  $('ringTxt').textContent = pct + '%';
  $('goalTxt').textContent = m + ' / ' + S.goal + ' min focused';
  $('stStreak').textContent = streak();
  $('stPending').textContent = S.tasks.filter(t => !t.done).length;
  const next = sortedTasks(S.tasks.filter(t => !t.done)).slice(0, 4);
  $('homeTasks').innerHTML = next.map(taskHTML).join('') || '<div class="empty">All clear 🎉</div>';
  if (S.exam) {
    const left = Math.ceil((new Date(S.exam.date + 'T00:00') - new Date(day() + 'T00:00')) / 864e5);
    $('examTxt').textContent = left > 0 ? '📅 ' + S.exam.name + ' in ' + left + ' day' + (left === 1 ? '' : 's')
      : left === 0 ? '🔥 ' + S.exam.name + ' is TODAY. Good luck!' : S.exam.name + ' has passed.';
  } else $('examTxt').textContent = 'No exam set yet.';
}

/* ---------- Progress ---------- */
function renderProgress() {
  let wk = 0, mx = 1, html = '';
  const L = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const m = minsOn(day(d)); wk += m; mx = Math.max(mx, m);
    L.push([d.toLocaleDateString(undefined, {weekday:'short'}).slice(0, 3), m]);
  }
  L.forEach(([l, m]) => html += `<div class="bar"><div class="col"><i style="height:${Math.round(m / mx * 100)}%"></i></div><small>${m}</small><em>${l}</em></div>`);
  $('bars').innerHTML = html;
  $('pToday').textContent = minsOn(day());
  $('pWeek').textContent = wk;
  $('pDone').textContent = S.tasks.filter(t => t.done).length;
  $('pStreak').textContent = streak();

  const subs = {};
  S.tasks.forEach(t => { subs[t.sub] = subs[t.sub] || {d:0, n:0}; subs[t.sub].n++; if (t.done) subs[t.sub].d++; });
  $('subProg').innerHTML = Object.keys(subs).map(k => {
    const p = Math.round(subs[k].d / subs[k].n * 100);
    return `<div><b>${esc(k)}</b> <span class="muted">${subs[k].d}/${subs[k].n}</span><div class="pbar"><i style="width:${p}%"></i></div></div>`;
  }).join('') || '<div class="empty">Add tasks to see subject progress</div>';

  $('recent').innerHTML = S.sessions.slice(-5).reverse().map(s =>
    `<div class="item"><div class="grow"><b>${esc(s.sub)}</b><small>${esc(s.date)}</small></div><b>${s.min} min</b></div>`
  ).join('') || '<div class="empty">No sessions yet. Start a focus timer ⏱</div>';
}

/* ---------- Settings & data ---------- */
function initFields() {
  $('sName').value = S.name; $('sGoal').value = S.goal; $('sFocus').value = S.focus; $('sBrk').value = S.brk;
  if (S.exam) { $('examName').value = S.exam.name; $('examDate').value = S.exam.date; }
}
function saveSettings() {
  S.name = $('sName').value.trim();
  S.goal = Math.max(1, +$('sGoal').value || 60);
  S.focus = Math.min(180, Math.max(1, +$('sFocus').value || 25));
  S.brk = Math.min(60, Math.max(1, +$('sBrk').value || 5));
  save(); if (!T.run) setMode(T.mode); render();
}
function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], {type:'application/json'}));
  a.download = 'studypilot-backup-' + day() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
}
function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || typeof d !== 'object') throw 0;
      S = Object.assign({}, def, d);
      ['tasks', 'notes', 'cards', 'sessions'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
      save(); initFields(); setMode('focus'); render(); alert('✅ Data restored');
    } catch (x) { alert('❌ Invalid backup file'); }
  };
  r.readAsText(f); e.target.value = '';
}
function clearData() {
  if (confirm('Delete ALL your StudyPilot data? This cannot be undone.')) {
    S = Object.assign({}, def, {tasks:[], notes:[], cards:[], sessions:[]});
    save(); initFields(); setMode('focus'); render();
  }
}

/* ---------- Start ---------- */
function render() { renderHome(); renderTasks(); renderNotes(); drawCard(); renderProgress(); drawT(); }
initFields(); setMode('focus'); render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
