'use strict';

const STORE = 'skin-routine-v1';
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Six daily checklists, each with its own step list.
const CHECKLISTS = [
  { id: 'faceAM', routine: 'faceAM', label: 'Face', when: 'Morning' },
  { id: 'handsAM', routine: 'handsAM', label: 'Hands', when: 'Morning' },
  { id: 'facePM', routine: 'facePM', label: 'Face', when: 'Night' },
  { id: 'handsPM', routine: 'handsPM', label: 'Hands', when: 'Night' },
  { id: 'hairAM', routine: 'hairAM', label: 'Hair', when: 'Morning' },
  { id: 'hairPM', routine: 'hairPM', label: 'Hair', when: 'Night' },
];

const ROUTINE_TABS = [
  { id: 'faceAM', label: 'Face AM' },
  { id: 'facePM', label: 'Face PM' },
  { id: 'handsAM', label: 'Hands AM' },
  { id: 'handsPM', label: 'Hands PM' },
  { id: 'hairAM', label: 'Hair AM' },
  { id: 'hairPM', label: 'Hair PM' },
];

/* ---------- dates ---------- */

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
const utcDay = (k) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const daysBetween = (a, b) => Math.round((utcDay(b) - utcDay(a)) / 86400000);
const fmtLong = (k) => parseKey(k).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

/* ---------- state ---------- */

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function step(name, how, product, sched) {
  return { id: uid(), name, how, product, sched: sched || { type: 'daily' } };
}

function handsSeed() {
  return {
    handsAM: { steps: [
      step('Brush under the tips', 'Lather the brush with warm water and soap. Use the wide, soft bristle side to scrub across the nail tops and gently sweep under the tips. Never use the stiff top bristles under the nail.', 'Tweezerman Dual Surface Nail Brush'),
      step('Dry and smooth edges', 'Dry hands fully and run your thumb across all ten fingertips. On any rough or peeling spot, do 3-4 light strokes in one direction until it feels glass-smooth.', 'Mont Bleu Glass File'),
      step('Urea and ceramide barrier', 'Pea-sized drop on the back of one hand. Rub the backs together, then massage into the sides and base of each nail.', 'Eucerin Advanced Repair Hand Cream'),
    ] },
    handsPM: { steps: [
      step('Hangnail check', 'After the shower, while skin is soft, check the nail borders. Snip only detached white tags flush at the base. Never cut live pink skin.', 'Tweezerman 1/2 Jaw Nippers', { type: 'optional' }),
      step('Jojoba oil', 'In bed, touch the dropper to the base of each nail (1-2 drops per hand total). Massage into the nail plate, cuticle fold, and down the sides of the thumbs.', 'Bliss Kiss Dropper Bottle'),
      step('Aquaphor seal', 'Rice-grain dab on a fingertip, swiped over the oiled cuticles to lock the oil in overnight.', 'Aquaphor'),
    ] },
  };
}

function faceSeed() {
  return {
    faceAM: { steps: [
      step('Cleanse', 'Massage gently over the face and down through the beard to clear overnight buildup. Rinse with lukewarm water and pat dry.', 'CeraVe Hydrating Cleanser'),
      step('Antioxidant serum', '3-4 drops across the forehead, temples, cheeks, and nose. Let it absorb for 1-2 minutes.', 'Timeless 20% Vitamin C + E Ferulic Acid Serum'),
      step('Beard oil', '2-3 drops on a slightly damp beard, massaged down to the skin underneath.', 'Jack Black Beard Oil', { type: 'optional' }),
    ] },
    facePM: { steps: [
      step('Cleanse', 'Wash away sunscreen, sweat, and debris from the day. Rinse and pat dry.', 'CeraVe Hydrating Cleanser'),
      // Choose one active per night, never layered. Default split: BHA Wed + Sun, Differin the other five nights.
      step('Differin', 'On completely dry skin, pea-sized amount across forehead, nose, upper cheeks, and outer eye corners. Avoid the eyelids. Not on BHA nights.', 'Differin Gel 0.1% Adapalene', { type: 'weekdays', days: [1, 2, 4, 5, 6] }),
      step('BHA exfoliant', 'Pat a few drops onto the nose, T-zone, and beard line to clear pores and prevent ingrown hairs. Replaces Differin on these nights.', '2% BHA Salicylic Acid Liquid Exfoliant', { type: 'weekdays', days: [0, 3] }),
      step('Barrier moisturizer', 'Finish with the lotion. Gently tap any excess along the orbital bone under the eyes.', 'CeraVe PM Facial Moisturizing Lotion'),
    ] },
  };
}

// Minoxidil Tue-Sun; microneedling Monday night, which replaces that day's minoxidil.
function hairSeed() {
  const minox = 'Apply the labeled dose to a dry scalp, directly on the thinning areas. Massage in, wash hands after, and let it dry before styling.';
  return {
    hairAM: { steps: [
      step('Minoxidil', minox, '', { type: 'weekdays', days: [2, 3, 4, 5, 6, 0] }),
    ] },
    hairPM: { steps: [
      step('Minoxidil', minox, '', { type: 'weekdays', days: [2, 3, 4, 5, 6, 0] }),
      step('Microneedling', 'Weekly. Clean scalp, sanitize the tool before and after. Work gently over the thinning areas. No minoxidil today.', '', { type: 'weekdays', days: [1] }),
    ] },
  };
}

function seed() {
  return {
    version: 1,
    rev: 5,
    startDate: todayKey(),
    routines: { ...faceSeed(), ...handsSeed(), ...hairSeed() },
    log: {},
  };
}

// rev 2: hands split into separate AM and PM lists, loaded with the real hands routine.
// rev 3: real face routine replaces the placeholders.
// rev 4: hair routine added (existing routines untouched).
// rev 5: hair moved from Sunday microneedling to Monday; only schedules still at the old default are changed.
function migrate(s) {
  if (s && s.routines && typeof s.routines === 'object') {
    const rev = s.rev || 1;
    if (rev < 2) { delete s.routines.hands; Object.assign(s.routines, handsSeed()); }
    if (rev < 3) Object.assign(s.routines, faceSeed());
    if (rev < 4) Object.assign(s.routines, hairSeed());
    if (rev < 5) {
      const move = (rid, name, from, to) => {
        for (const st of (s.routines[rid] && s.routines[rid].steps) || []) {
          if (st.name === name && JSON.stringify(st.sched) === JSON.stringify({ type: 'weekdays', days: from })) st.sched.days = to;
        }
      };
      move('hairAM', 'Minoxidil', [1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 0]);
      move('hairPM', 'Minoxidil', [1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 0]);
      move('hairPM', 'Microneedling', [0], [1]);
    }
    s.rev = Math.max(rev, 5);
  }
  return s;
}

function valid(s) {
  return s && typeof s === 'object' && typeof s.startDate === 'string' && s.log && typeof s.log === 'object' &&
    s.routines && ROUTINE_TABS.every((r) => s.routines[r.id] && Array.isArray(s.routines[r.id].steps));
}

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) { const s = migrate(JSON.parse(raw)); if (valid(s)) return s; }
  } catch (e) { /* storage unavailable or corrupt: start fresh */ }
  return seed();
}

let state = load();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };
save();

const ui = {
  tab: 'today',
  month: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })(),
  selected: todayKey(),
  routineTab: 'faceAM',
  open: new Set(),
  lastDay: todayKey(),
};

/* ---------- schedule + status ---------- */

function isDue(s, key) {
  const sc = s.sched || { type: 'daily' };
  if (sc.type === 'weekdays') return (sc.days || []).includes(parseKey(key).getDay());
  if (sc.type === 'every') {
    const diff = daysBetween(sc.start || state.startDate, key);
    return diff >= 0 && diff % Math.max(2, sc.n || 2) === 0;
  }
  return true;
}

const isOptional = (s) => !!s.sched && s.sched.type === 'optional';
// Optional ("as needed") steps are shown but never required, so they don't affect completion or streaks.
const dueSteps = (cl, key) => state.routines[cl.routine].steps.filter((s) => !isOptional(s) && isDue(s, key));
const optionalSteps = (cl) => state.routines[cl.routine].steps.filter(isOptional);
const doneIds = (cl, key) => (state.log[key] && state.log[key][cl.id]) || [];
const isDone = (cl, s, key) => doneIds(cl, key).includes(s.id);

function status(cl, key) {
  const due = dueSteps(cl, key);
  const done = due.filter((s) => isDone(cl, s, key)).length;
  return { total: due.length, done, complete: due.length > 0 && done === due.length };
}

function overall(key) {
  let total = 0, done = 0, all = true;
  for (const cl of CHECKLISTS) {
    const s = status(cl, key);
    if (!s.total) continue;
    total += s.total; done += s.done;
    if (!s.complete) all = false;
  }
  return { total, done, complete: total > 0 && all };
}

// A day with nothing due neither adds to nor breaks a streak. Today only counts once complete.
function streak(statusFn) {
  const today = todayKey();
  let n = statusFn(today).complete ? 1 : 0;
  for (let k = addDays(today, -1); k >= state.startDate; k = addDays(k, -1)) {
    const s = statusFn(k);
    if (!s.total) continue;
    if (!s.complete) break;
    n++;
  }
  return n;
}

const clStreak = (cl) => streak((k) => status(cl, k));
const overallStreak = () => streak(overall);

function toggle(cl, s, key) {
  const day = (state.log[key] = state.log[key] || {});
  const ids = (day[cl.id] = day[cl.id] || []);
  const i = ids.indexOf(s.id);
  if (i >= 0) ids.splice(i, 1); else ids.push(s.id);
  save();
  render();
}

/* ---------- tiny DOM helper ---------- */

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function schedText(s) {
  const sc = s.sched || { type: 'daily' };
  if (sc.type === 'weekdays') return (sc.days || []).slice().sort().map((d) => DOW_NAMES[d]).join(', ') || 'No days';
  if (sc.type === 'every') return `Every ${sc.n} days`;
  if (sc.type === 'optional') return 'As needed';
  return 'Daily';
}

/* ---------- views ---------- */

function stepRow(cl, s, key) {
  const done = isDone(cl, s, key);
  const ek = cl.id + s.id;
  const open = ui.open.has(ek);
  const expandable = !!(s.how || s.product);
  const check = h('button', {
    class: 'check', type: 'button', 'aria-pressed': String(done),
    'aria-label': `${done ? 'Uncheck' : 'Check'} ${s.name}`,
    onclick: () => toggle(cl, s, key),
  });
  check.innerHTML = TICK;
  return h('div', { class: 'step' + (done ? ' done' : '') },
    check,
    h('div', {
      class: 'step-main',
      onclick: () => { if (!expandable) return; open ? ui.open.delete(ek) : ui.open.add(ek); render(); },
    },
      h('div', { class: 'step-name' }, s.name),
      s.product && h('div', { class: 'step-sub' }, s.product),
      open && s.how && h('div', { class: 'step-how' }, s.how),
    ),
  );
}

function optionalRows(cl, key) {
  const opt = optionalSteps(cl);
  return opt.length && [h('div', { class: 'opt-label' }, 'As needed'), opt.map((s) => stepRow(cl, s, key))];
}

function checklistCard(cl, key, showStreak) {
  const st = status(cl, key);
  const meta = [];
  if (st.total) meta.push(`${st.done}/${st.total}`);
  if (showStreak) { const n = clStreak(cl); if (n) meta.push(`${n} day streak`); }
  return h('section', { class: 'card' },
    h('div', { class: 'card-head' },
      h('div', { class: 'card-title' }, cl.label),
      h('div', { class: 'card-meta' }, meta.join(' · ')),
    ),
    st.total
      ? dueSteps(cl, key).map((s) => stepRow(cl, s, key))
      : !optionalSteps(cl).length && h('div', { class: 'empty' }, 'Nothing due today'),
    optionalRows(cl, key),
  );
}

function statTile(num, label) {
  return h('div', { class: 'stat' }, h('div', { class: 'stat-num' }, String(num)), h('div', { class: 'stat-label' }, label));
}

function viewToday() {
  const key = todayKey();
  const o = overall(key);
  const out = [
    h('div', { class: 'eyebrow' }, new Date().toLocaleDateString(undefined, { weekday: 'long' })),
    h('h1', {}, parseKey(key).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })),
    h('div', { class: 'summary' },
      statTile(overallStreak(), 'day streak'),
      statTile(o.total ? `${o.done}/${o.total}` : '–', 'done today'),
    ),
  ];
  for (const when of ['Morning', 'Night']) {
    out.push(h('h2', {}, when));
    for (const cl of CHECKLISTS.filter((c) => c.when === when)) out.push(checklistCard(cl, key, true));
  }
  return out;
}

function viewHistory() {
  const y = ui.month.getFullYear(), m = ui.month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = todayKey();
  const now = new Date();
  const atCurrent = y === now.getFullYear() && m === now.getMonth();

  const cells = DOW.map((d) => h('div', { class: 'dow' }, d));
  for (let i = 0; i < first; i++) cells.push(h('div', { class: 'day blank' }));
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${pad(m + 1)}-${pad(d)}`;
    const future = key > today;
    const o = future ? { total: 0 } : overall(key);
    const fill = o.complete ? 'full' : o.done > 0 ? 'partial' : 'none';
    cells.push(h('button', {
      type: 'button', class: 'day' + (key === today ? ' today' : '') + (key === ui.selected ? ' sel' : ''),
      'data-fill': fill, disabled: future, 'aria-label': fmtLong(key),
      onclick: () => { ui.selected = key; render(); },
    }, String(d)));
  }

  const sel = ui.selected;
  const so = overall(sel);
  const out = [
    h('h1', {}, 'History'),
    h('div', { class: 'cal-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous month', onclick: () => { ui.month = new Date(y, m - 1, 1); render(); } }, '‹'),
      h('div', { class: 'cal-title' }, ui.month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next month', disabled: atCurrent, onclick: () => { ui.month = new Date(y, m + 1, 1); render(); } }, '›'),
    ),
    h('div', { class: 'cal' }, cells),
    h('div', { class: 'legend' },
      h('span', {}, h('i'), 'None'), h('span', {}, h('i', { class: 'p' }), 'Partial'), h('span', {}, h('i', { class: 'f' }), 'Complete')),
    h('h2', {}, fmtLong(sel) + (so.total ? ` · ${so.done}/${so.total}` : '')),
  ];
  for (const cl of CHECKLISTS) {
    const st = status(cl, sel);
    if (!st.total && !optionalSteps(cl).length) continue;
    out.push(h('section', { class: 'card' },
      h('div', { class: 'card-head' },
        h('div', { class: 'card-title' }, `${cl.label} · ${cl.when}`),
        h('div', { class: 'card-meta' }, st.total ? `${st.done}/${st.total}` : '')),
      dueSteps(cl, sel).map((s) => stepRow(cl, s, sel)),
      optionalRows(cl, sel)));
  }
  if (!so.total) out.push(h('div', { class: 'empty' }, 'Nothing was due on this day.'));
  return out;
}

function viewRoutines() {
  const rid = ui.routineTab;
  const steps = state.routines[rid].steps;
  const out = [
    h('h1', {}, 'Routines'),
    h('div', { class: 'seg' }, ROUTINE_TABS.map((r) =>
      h('button', { type: 'button', 'aria-current': String(r.id === rid), onclick: () => { ui.routineTab = r.id; render(); } }, r.label))),
  ];
  const card = h('section', { class: 'card' });
  if (!steps.length) card.append(h('div', { class: 'empty' }, 'No steps yet.'));
  steps.forEach((s, i) => {
    card.append(h('div', { class: 'edit-row' },
      h('div', { class: 'step-main', onclick: () => openStepDialog(rid, s) },
        h('div', { class: 'step-name' }, s.name),
        h('div', { class: 'step-sub' }, [s.product, schedText(s)].filter(Boolean).join(' · '))),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => move(rid, i, -1) }, '↑'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move down', disabled: i === steps.length - 1, onclick: () => move(rid, i, 1) }, '↓'),
    ));
  });
  out.push(card);
  out.push(h('button', { class: 'btn primary block', type: 'button', onclick: () => openStepDialog(rid, null) }, 'Add step'));
  return out;
}

function move(rid, i, d) {
  const a = state.routines[rid].steps;
  [a[i], a[i + d]] = [a[i + d], a[i]];
  save(); render();
}

function viewData() {
  return [
    h('h1', {}, 'Data'),
    h('p', { class: 'note' }, 'Everything is stored only on this phone. Export a backup now and then, especially before clearing browser data.'),
    h('div', { class: 'stack' },
      h('button', { class: 'btn block', type: 'button', onclick: exportData }, 'Export backup'),
      h('button', { class: 'btn block', type: 'button', onclick: () => document.getElementById('importFile').click() }, 'Import backup'),
      h('button', { class: 'btn block danger', type: 'button', onclick: resetData }, 'Reset everything'),
    ),
  ];
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `skin-routine-${todayKey()}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function resetData() {
  if (!confirm('Delete all routines and history on this phone? Export a backup first if unsure.')) return;
  state = seed(); save(); ui.selected = todayKey(); render();
}

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const s = migrate(JSON.parse(await file.text()));
    if (!valid(s)) throw new Error('bad shape');
    if (!confirm('Replace everything on this phone with this backup?')) return;
    state = s; save(); ui.selected = todayKey(); render();
  } catch (err) {
    alert('That file is not a valid Skin Routine backup.');
  }
});

/* ---------- step dialog ---------- */

const dlg = document.getElementById('stepDialog');
const f = {
  name: document.getElementById('fName'), product: document.getElementById('fProduct'),
  how: document.getElementById('fHow'), sched: document.getElementById('fSched'),
  daysWrap: document.getElementById('fDaysWrap'), everyWrap: document.getElementById('fEveryWrap'),
  every: document.getElementById('fEvery'), del: document.getElementById('fDelete'),
};
let editing = null; // { rid, step | null }
let pickedDays = new Set();

function renderDayChips() {
  f.daysWrap.replaceChildren(...DOW.map((label, d) => h('button', {
    type: 'button', 'aria-pressed': String(pickedDays.has(d)), 'aria-label': DOW_NAMES[d],
    onclick: () => { pickedDays.has(d) ? pickedDays.delete(d) : pickedDays.add(d); renderDayChips(); },
  }, DOW_NAMES[d].slice(0, 2))));
}

function syncSchedFields() {
  f.daysWrap.hidden = f.sched.value !== 'weekdays';
  f.everyWrap.hidden = f.sched.value !== 'every';
}

function openStepDialog(rid, s) {
  editing = { rid, step: s };
  document.getElementById('stepDialogTitle').textContent = s ? 'Edit step' : 'New step';
  f.name.value = s ? s.name : '';
  f.product.value = s ? s.product || '' : '';
  f.how.value = s ? s.how || '' : '';
  const sc = (s && s.sched) || { type: 'daily' };
  f.sched.value = sc.type;
  pickedDays = new Set(sc.type === 'weekdays' ? sc.days : []);
  f.every.value = sc.type === 'every' ? sc.n : 2;
  f.del.hidden = !s;
  renderDayChips(); syncSchedFields();
  dlg.showModal();
}

f.sched.addEventListener('change', syncSchedFields);
document.getElementById('fCancel').addEventListener('click', () => dlg.close());

f.del.addEventListener('click', () => {
  if (!confirm(`Delete "${editing.step.name}"?`)) return;
  const a = state.routines[editing.rid].steps;
  a.splice(a.indexOf(editing.step), 1);
  save(); dlg.close(); render();
});

document.getElementById('stepForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const type = f.sched.value;
  let sched = { type: 'daily' };
  if (type === 'optional') sched = { type };
  else if (type === 'weekdays') {
    if (!pickedDays.size) { alert('Pick at least one weekday.'); return; }
    sched = { type, days: [...pickedDays].sort() };
  } else if (type === 'every') {
    const n = Math.min(60, Math.max(2, parseInt(f.every.value, 10) || 2));
    // Keep the original anchor date when the interval is unchanged so the cycle doesn't shift.
    const old = editing.step && editing.step.sched;
    sched = { type, n, start: old && old.type === 'every' && old.n === n ? old.start : todayKey() };
  }
  const data = { name: f.name.value.trim(), product: f.product.value.trim(), how: f.how.value.trim(), sched };
  if (!data.name) return;
  if (editing.step) Object.assign(editing.step, data);
  else state.routines[editing.rid].steps.push({ id: uid(), ...data });
  save(); dlg.close(); render();
});

/* ---------- shell ---------- */

const VIEWS = { today: viewToday, history: viewHistory, routines: viewRoutines, data: viewData };
const view = document.getElementById('view');

function render() {
  view.replaceChildren(...VIEWS[ui.tab]());
  document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.tab === ui.tab)));
}

document.getElementById('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  ui.tab = b.dataset.tab;
  if (ui.tab === 'history') { ui.selected = todayKey(); const d = new Date(); ui.month = new Date(d.getFullYear(), d.getMonth(), 1); }
  render();
  window.scrollTo(0, 0);
});

// Roll over at midnight even if the app stays open.
function checkRollover() {
  const k = todayKey();
  if (k !== ui.lastDay) { ui.lastDay = k; ui.selected = k; render(); }
}
setInterval(checkRollover, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkRollover(); render(); } });

render();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
