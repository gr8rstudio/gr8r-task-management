/* =====================================================================
   ACTIONS · INPUT HANDLERS · DRAG & DROP · KEYBOARD · INIT
   ===================================================================== */
const A = {}, IN = {}, KEY = {}, DBL = {}, BLUR = {};

/* ---------- task mutations ---------- */
function nextKey(p) { p.seq = (p.seq || 200) + 1; return p.key + '-' + p.seq; }
function createTask(f) {
  const p = proj(f.project) || visibleProjects().find(canSee);
  const maxO = Math.max(0, ...D().tasks.map(t => t.order));
  const t = Object.assign({ project: p.id, title: 'Untitled', status: 'todo', assignee: null, priority: 'none', due: null, start: null, labels: [], subtasks: [], attachments: [], deps: [], desc: '', estimate: null, created: Date.now(), updated: Date.now(), order: maxO + 1, fav: false, recur: null }, f, { project: p.id });
  t.id = f.id || uid('t'); t.key = f.key || nextKey(p);
  D().tasks.push(t); fxSet({ added: t.id }); logAct('created', t);
  return t;
}
const RECUR_DAYS = { Daily: 1, Weekly: 7, 'Every 2 weeks': 14, Monthly: 30 };
function applyPatch(t, patch) {
  const msgs = [];
  for (const k of Object.keys(patch)) {
    const old = t[k], nv = patch[k];
    if (JSON.stringify(old) === JSON.stringify(nv)) continue;
    t[k] = nv;
    if (k === 'status') {
      if (nv === 'done') { t.completedAt = Date.now(); t.prevStatus = old; logAct('completed', t); fxSet({ done: t.id }); }
      else logAct('moved', t, `from ${ST[old].name} to ${ST[nv].name}`);
      if (nv === 'done' && t.recur && t.due) {
        const nd = iso(addD(parse(t.due), RECUR_DAYS[t.recur] || 7));
        const n = createTask({ ...JSON.parse(JSON.stringify(t)), id: undefined, key: undefined, status: 'todo', due: nd, start: nd, subtasks: t.subtasks.map(s => ({ ...s, done: false })), completedAt: null, attachments: [] });
        delete n.prevStatus;
        msgs.push(`Next “${t.title}” scheduled for ${fmtDate(nd)}`);
      }
    } else if (k === 'assignee') logAct('assigned', t, nv ? `to ${mem(nv)?.name}` : '(unassigned)');
    else if (k === 'priority') logAct('changed priority of', t, `to ${PR[nv].name}`);
    else if (k === 'due') logAct('changed due date of', t, nv ? `to ${fmtDate(nv)}` : '(cleared)');
    else if (k === 'start') logAct('changed start date of', t, nv ? `to ${fmtDate(nv)}` : '(cleared)');
    else if (k === 'project') { const p = proj(nv); t.key = nextKey(p); logAct('moved', t, `to ${p.name}`); }
    else if (k === 'labels') logAct('updated labels on', t);
    else if (k === 'title') logAct('renamed', t, `to “${nv}”`);
    else if (k === 'recur') logAct('set repeat on', t, nv ? nv.toLowerCase() : 'off');
    else if (k === 'estimate') logAct('estimated', t, nv || 'none');
    else if (k === 'deps') logAct('updated dependencies of', t);
    t.updated = Date.now();
  }
  return msgs;
}
function updateTask(id, patch) {
  if (id === '__form') { Object.assign(S.ui.form, patch); render(); return; }
  const t = task(id); if (!t) return;
  let msgs = [];
  if (mutate(() => { msgs = applyPatch(t, patch); })) msgs.forEach(m => toast(m, { kind: 'info' }));
}
function confirmDlg(o) { S.ui.confirmText = ''; openModal({ type: 'confirm', ...o }); }
function snapshot() { return JSON.stringify(S.data); }
function restore(snap) { S.data = JSON.parse(snap); save(); render(); }
async function copy(text, msg = 'Link copied') {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch (e) { toast('Copy isn\'t available here — ' + text, { kind: 'info', ms: 6000 }); }
}
function loadingBtn(id, ms, fn) {
  const b = document.getElementById(id); if (b) { b.classList.add('is-loading'); b.setAttribute('aria-busy', 'true'); }
  setTimeout(fn, ms);
}
function curProjectId() { if (S.ui.route === 'project') return S.ui.params.id; return null; }
function projectFromKey(key) { if (!key) return null; if (key.startsWith('p:')) return key.slice(2); if (key.startsWith('sv:')) return D().savedViews.find(v => v.id === key.slice(3))?.project; return null; }

/* ---------- navigation ---------- */
A.go = el => {
  const r = el.dataset.r; const p = {};
  if (el.dataset.id) p.id = el.dataset.id;
  if (el.dataset.tab) p.tab = el.dataset.tab; else if (r === 'project') p.tab = S.prefs.defaultTab || 'board';
  if (el.dataset.sec) p.sec = el.dataset.sec;
  S.ui.palette = null;
  const tabOnly = r === 'project' && S.ui.route === 'project' && S.ui.params.id === p.id;
  go(r, p, { tab: tabOnly });
};
A.back = () => { const h = S.ui.history.pop(); if (h) go(h.route, h.params, { back: true }); else go('home'); };
A.reload = () => render();
A.openProject = el => go('project', { id: el.dataset.id, tab: S.prefs.defaultTab || 'board' });
A.set = el => { const k = el.dataset.k; let v = el.dataset.v; if (/Tab$|Cat$|Mode$|View$/.test(k)) fxSet({ tabs: true }); if (k === 'inboxSel' && !v) v = null; S.ui[k] = v; if (k === 'membersTab' || k === 'searchCat') S.ui.pop = null; render(); };
A.toggleSide = () => { S.ui.collapsed = !S.ui.collapsed; save(); render(); };
A.openMnav = () => { S.ui.mnav = true; render(); };
A.closeMnav = () => { S.ui.mnav = false; render(); };
A.toggleExpand = el => { S.ui.expanded[el.dataset.id] = !S.ui.expanded[el.dataset.id]; render(); };
A.goTasks = el => {
  const f = el.dataset.f; const v = viewOf('tasks'); v.mode = 'list';
  v.filters = f === 'open' ? [{ f: 'status', op: 'not', v: ['done'] }] : f === 'done' ? [{ f: 'status', op: 'is', v: ['done'] }, { f: 'updated', op: 'is', v: ['7'] }] : f === 'overdue' ? [{ f: 'due', op: 'is', v: ['overdue'] }] : [];
  go('tasks');
};
A.goFilteredList = el => { const v = viewOf('p:' + el.dataset.id); v.filters = [{ f: 'status', op: 'is', v: [el.dataset.st] }]; v.group = 'status'; go('project', { id: el.dataset.id, tab: 'list' }, { tab: true }); };

/* ---------- theme ---------- */
A.setTheme = el => { S.prefs.theme = el.dataset.v; save(); render(); };
A.toggleDark = () => { S.prefs.theme = effectiveDark() ? 'light' : 'dark'; save(); S.ui.palette = null; render(); toast(effectiveDark() ? 'Dark mode on' : 'Light mode on', { kind: 'info', ms: 1800 }); };
A.setPref = el => { S.prefs[el.dataset.k] = el.dataset.v; save(); render(); };

/* ---------- popovers ---------- */
A.pop = (el, e) => {
  const d = el.dataset; const p = S.ui.pop;
  if (p && p.type === d.pop && p.id === d.id && p.key === d.key && p.i == (d.i != null ? +d.i : undefined) && p.field === d.field) { closePop(); return; }
  openPop(el);
};
A.ctxBtn = el => {
  const r = el.getBoundingClientRect(); const d = el.dataset;
  const p = S.ui.pop; if (p && p.type === 'ctx' && p.id === d.id && p.ctx === d.ctx) { closePop(); return; }
  S.ui.pop = { type: 'ctx', ctx: d.ctx, id: d.id, key: d.key, vid: d.vid, x: r.left, y: r.bottom + 4, top: r.top, w: r.width };
  render();
};
A.popPick = el => {
  const p = S.ui.pop; let v = el.dataset.v;
  if (p.type === 'subassignee' || (p.type === 'date' && p.field === 'subdue')) {
    const t = task(p.id); const sb = t?.subtasks[p.i]; if (!sb) return; const k = p.type === 'subassignee' ? 'assignee' : 'due'; v = v || null; S.ui.pop = null;
    mutate(() => { sb[k] = v; logAct(k === 'assignee' ? 'assigned a subtask on' : 'set a subtask due date on', t, k === 'assignee' ? (v ? `to ${mem(v).name}` : '(unassigned)') : (v ? fmtDate(v) : '(cleared)')); });
    return;
  }
  if (p.type === 'pstatus') { const pr = proj(p.id); mutate(() => { pr.status = v; D().activity.unshift({ id: uid('a'), by: D().me, verb: 'changed status of project', task: null, project: pr.id, at: Date.now(), extra: 'to ' + PSTAT[v].name }); }); S.ui.pop = null; render(); toast(`${pr.name} marked ${PSTAT[v].name}`); return; }
  if (p.type === 'role') { const m = mem(p.id); mutate(() => { m.role = v; }); S.ui.pop = null; render(); toast(`${m.name} is now ${v === 'Admin' ? 'an' : 'a'} ${v}`); return; }
  const field = { status: 'status', priority: 'priority', assignee: 'assignee', project: 'project', recur: 'recur', estimate: 'estimate', date: p.field }[p.type];
  if (!field) return;
  if (field === 'assignee' && !v) v = null;
  if (field === 'recur' && v === 'Does not repeat') v = null;
  if ((field === 'estimate' || field === 'due' || field === 'start') && !v) v = null;
  S.ui.pop = null;
  const patch = { [field]: v };
  if (field === 'due' && v && p.id !== '__form') { const t = task(p.id); if (t.start && t.start > v) patch.start = v; }
  updateTask(p.id, patch);
};
A.popToggleLabel = el => { const p = S.ui.pop; const t = tgt(p); const v = el.dataset.v; const labels = t.labels.includes(v) ? t.labels.filter(x => x !== v) : [...t.labels, v]; updateTask(p.id, { labels }); };
A.popToggleDep = el => { const p = S.ui.pop; const t = task(p.id); const v = el.dataset.v; updateTask(p.id, { deps: t.deps.includes(v) ? t.deps.filter(x => x !== v) : [...t.deps, v] }); };
A.popMonth = el => { const p = S.ui.pop; const m = parse(p.m); p.m = iso(new Date(m.getFullYear(), m.getMonth() + +el.dataset.d, 1)); render(); };
IN.popQ = el => { if (S.ui.pop) { S.ui.pop.q = el.value; render(); } };
const ctxTo = type => () => { S.ui.pop = { ...S.ui.pop, type, q: '' }; if (type === 'date') S.ui.pop.m = iso(TODAY); render(); };
A.ctxStatus = ctxTo('status'); A.ctxAssign = ctxTo('assignee'); A.ctxPrio = ctxTo('priority'); A.ctxMove = ctxTo('project'); A.ctxRole = ctxTo('role');

/* ---------- tasks ---------- */
A.openTask = (el, e) => {
  const id = el.dataset.id; if (!task(id)) return;
  if (!canSee(proj(task(id).project))) { toast("You don't have access to that task", { kind: 'err' }); return; }
  if (!S.ui.drawer || !document.activeElement?.closest?.('.drawer')) S.ui.drawerOpener = el.isConnected ? focusKey(el) : S.ui.drawerOpener;
  S.ui.drawer = id; S.ui.drawerFull = S.prefs.openTasks === 'full' || S.ui.drawerFull && S.ui.drawer === id; S.ui.pop = null; S.ui.palette = null; S.ui.modals = []; S.ui.mention = null; S.ui.subOpen = null;
  S.ui.drawerTab = S.ui.drawerTab || 'comments';
  render();
  const dr = $('.drawer'); if (dr && !dr.contains(document.activeElement)) dr.focus({ preventScroll: true });
};
A.closeDrawer = () => { S.ui.drawer = null; S.ui.drawerFull = false; S.ui.subOpen = null; render(); };
A.skipToContent = () => { const c = $('#main-content'); c?.focus(); };
A.projUp = el => A._projMove(el, -1); A.projDown = el => A._projMove(el, 1);
A._projMove = (el, d) => { const vis = visibleProjects().map(p => p.id); const i = vis.indexOf(el.dataset.id); const j = i + d; if (j < 0 || j >= vis.length) return; const o = D().projOrder; const a = o.indexOf(vis[i]), b = o.indexOf(vis[j]); [o[a], o[b]] = [o[b], o[a]]; S.ui.pop = null; save(); render(); toast(`Moved ${proj(el.dataset.id).name} ${d < 0 ? 'up' : 'down'}`, { ms: 1600 }); };
A.toggleDrawerFull = () => { S.ui.drawerFull = !S.ui.drawerFull; render(); };
A.toggleDone = el => {
  const t = task(el.dataset.id); if (!t) return;
  const wasDone = t.status === 'done';
  S.ui.pop = null;
  updateTask(t.id, { status: wasDone ? (t.prevStatus && t.prevStatus !== 'done' ? t.prevStatus : 'todo') : 'done' });
  if (!wasDone && !S.ui.offline) toast(`Completed “${t.title}”`, { action: 'Undo', onAction: () => updateTask(t.id, { status: t.prevStatus || 'todo' }) });
};
A.toggleFavTask = el => { const t = task(el.dataset.id); mutate(() => { t.fav = !t.fav; }); S.ui.pop = null; toast(t.fav ? 'Added to favorites' : 'Removed from favorites', { ms: 1800 }); render(); };
A.toggleFavProj = el => { const p = proj(el.dataset.id); mutate(() => { p.fav = !p.fav; }); S.ui.pop = null; render(); toast(p.fav ? `Added ${p.name} to favorites` : 'Removed from favorites', { ms: 1800 }); };
A.copyLink = el => { S.ui.pop = null; render(); const d = el.dataset; const path = d.id && task(d.id) ? `task/${task(d.id).key}` : d.pid ? `project/${proj(d.pid).key.toLowerCase()}` : d.fid ? `file/${d.fid}` : d.id && proj(d.id) ? `project/${proj(d.id).key.toLowerCase()}` : ''; copy(`https://gr8rstudio.com/${D().ws.url}/${path}`); };
A.copyText = el => copy(el.dataset.text, 'Copied to clipboard');
A.copyEmail = el => { S.ui.pop = null; render(); copy(mem(el.dataset.id).email, 'Email copied'); };
A.dupTask = el => { const t = task(el.dataset.id); S.ui.pop = null; let n; mutate(() => { n = createTask({ ...JSON.parse(JSON.stringify(t)), id: uid('t'), key: undefined, title: t.title + ' (copy)', created: Date.now(), fav: false }); n.key = nextKey(proj(n.project)); }); toast('Task duplicated', { action: 'Open', onAction: () => A.openTask({ dataset: { id: n.id } }) }); };
A.archiveTask = el => { const t = task(el.dataset.id); const snap = snapshot(); S.ui.pop = null; if (S.ui.drawer === t.id) S.ui.drawer = null; mutate(() => { t.archived = true; t.archivedAt = Date.now(); logAct('archived', t); }); toast(`Archived “${t.title}”`, { action: 'Undo', onAction: () => restore(snap) }); };
function deleteTasks(ids) { const set = new Set(ids); D().tasks = D().tasks.filter(t => !set.has(t.id)); D().tasks.forEach(t => t.deps = t.deps.filter(d => !set.has(d))); D().comments = D().comments.filter(c => !set.has(c.task)); if (set.has(S.ui.drawer)) S.ui.drawer = null; ids.forEach(i => S.ui.sel.delete(i)); }
A.delTask = el => {
  const t = task(el.dataset.id); S.ui.pop = null; if (!t) return;
  const run = () => { const snap = snapshot(); if (mutate(() => deleteTasks([t.id]))) toast(`Deleted “${t.title}”`, { action: 'Undo', onAction: () => restore(snap) }); };
  if (S.prefs.confirmDel === false && !el.dataset.demo) return run();
  confirmDlg({ title: 'Delete task?', body: `<b>${esc(t.title)}</b>${t.subtasks.length ? `, its ${t.subtasks.length} subtasks,` : ''} and ${commentsOf(t.id).length} comment${commentsOf(t.id).length === 1 ? '' : 's'} will be permanently deleted.`, ok: 'Delete task', danger: true, run });
};
A.editTask = el => {
  const t = task(el.dataset.id); if (!t) return;
  S.ui.form = { title: t.title, desc: (t.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), project: t.project, status: t.status, assignee: t.assignee, priority: t.priority, due: t.due, start: t.start, labels: [...t.labels], subtasks: t.subtasks.map(s => ({ ...s })), files: [], recur: t.recur, more: false };
  S.ui.errors = {}; openModal({ type: 'task', edit: t.id });
};
A.newTask = el => {
  const d = el?.dataset || {};
  const pid = d.project || curProjectId() || projectFromKey(S.ui.composer?.ctx) || (S.ui.drawer && task(S.ui.drawer)?.project) || visibleProjects().find(p => canSee(p) && p.status !== 'complete')?.id;
  S.ui.form = { title: '', desc: '', project: canSee(proj(pid)) ? pid : 'p1', status: 'todo', assignee: d.assignee || D().me, priority: 'medium', due: d.due || null, start: null, labels: [], subtasks: [], files: [], recur: null, more: S.ui.form?.more || false };
  S.ui.errors = {}; S.ui.drawer = S.ui.drawer; openModal({ type: 'task' });
};
IN.form = el => { S.ui.form[el.dataset.f] = el.value; if (el.dataset.f === 'title' && S.ui.errors.title && el.value.trim()) { S.ui.errors.title = null; render(); } };
IN.formMore = el => { S.ui.form.more = el.checked; };
IN.formFiles = el => { [...el.files].forEach(f => S.ui.form.files.push({ name: f.name, size: fsize(f.size), type: fileType(f.name) })); render(); };
KEY.formAddSub = el => { const v = el.value.trim(); if (!v) return; S.ui.form.subtasks.push({ id: uid('s'), title: v, done: false }); render(); setTimeout(() => $('#f-sub')?.focus(), 0); };
A.formRmSub = el => { S.ui.form.subtasks.splice(+el.dataset.i, 1); render(); };
A.formRmFile = el => { S.ui.form.files.splice(+el.dataset.i, 1); render(); };
A.submitTask = () => {
  const m = S.ui.modals[S.ui.modals.length - 1]; const f = S.ui.form;
  const title = ($('#f-title')?.value ?? f.title).trim(); f.title = title; f.desc = $('#f-desc')?.value ?? f.desc;
  if (!title) { S.ui.errors.title = 'Give the task a name'; render(); $('#f-title')?.focus(); return; }
  S.ui.errors = {};
  const files = f.files.map(x => ({ id: uid('a'), name: x.name, type: x.type, size: x.size, by: D().me, at: Date.now() }));
  const base = { title, project: f.project, status: f.status, assignee: f.assignee, priority: f.priority, due: f.due, start: f.start && f.due && f.start > f.due ? f.due : f.start, labels: f.labels, recur: f.recur, subtasks: f.subtasks };
  if (m.edit) {
    const t = task(m.edit);
    if (!mutate(() => { applyPatch(t, base); if (f.desc !== (t.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) t.desc = f.desc ? `<p>${esc(f.desc)}</p>` : ''; t.attachments.push(...files); })) return;
    S.ui.modals.pop(); render(); toast('Changes saved'); return;
  }
  let t;
  if (!mutate(() => { t = createTask({ ...base, desc: f.desc ? `<p>${esc(f.desc)}</p>` : '', attachments: files }); files.forEach(x => D().files.unshift({ ...x, project: t.project, task: t.id })); })) return;
  if (f.more) { Object.assign(f, { title: '', desc: '', subtasks: [], files: [] }); render(); setTimeout(() => $('#f-title')?.focus(), 0); toast(`Created ${t.key}`, { ms: 2000 }); return; }
  S.ui.modals.pop(); fxSet({ added: t.id }); render();
  toast(`Created ${t.key} in ${proj(t.project).name}`, { action: 'Open', onAction: () => A.openTask({ dataset: { id: t.id } }) });
};

/* inline composer */
A.startComposer = el => { S.ui.composer = { ctx: el.dataset.ctx, group: el.dataset.group, gb: JSON.parse(el.dataset.gb || '{}') }; S.ui.pop = null; render(); setTimeout(() => $('#composer-in')?.focus(), 0); };
A.cancelComposer = () => { S.ui.composer = null; render(); };
KEY.commitComposer = () => A.commitComposer();
A.commitComposer = () => {
  const c = S.ui.composer; const el = $('#composer-in'); const v = el?.value.trim();
  if (!c) return; if (!v) { A.cancelComposer(); return; }
  const f = { title: v, ...c.gb };
  f.project = f.project || projectFromKey(c.ctx) || curProjectId() || 'p1';
  if (c.ctx === 'mytasks') f.assignee = D().me;
  let t; mutate(() => { t = createTask(f); });
  setTimeout(() => $('#composer-in')?.focus(), 0);
};
KEY.commitTitle = el => DBL._commitTitle(el);
DBL.editTitle = el => { const row = el.closest('[data-task-row]'); if (!row) return; S.ui.drawer = null; S.ui.editCell = { id: row.dataset.taskRow, f: 'title' }; render(); const i = $('#edit-title'); if (i) { i.focus(); i.select(); } };
DBL._commitTitle = el => { const c = S.ui.editCell; if (!c) return; S.ui.editCell = null; const v = el.value.trim(); if (v && v !== task(c.id).title) updateTask(c.id, { title: v }); else render(); };
DBL.editCell = el => { S.ui.drawer = null; S.ui.editCell = { id: el.dataset.id || el.closest('[data-id]').dataset.id, f: el.dataset.f }; render(); const i = $('#edit-cell'); if (i) { i.focus(); i.select(); } };
A.editCell = el => DBL.editCell(el);
KEY.commitCell = el => { const c = S.ui.editCell; if (!c) return; S.ui.editCell = null; const v = el.value.trim(); if (c.f === 'title' && !v) { render(); return; } updateTask(c.id, { [c.f]: v || null }); };
BLUR.commitCell = el => KEY.commitCell(el);
BLUR.commitTitle = el => DBL._commitTitle(el);
BLUR.commitDrawerTitle = el => { const t = task(el.dataset.id); const v = el.value.trim(); if (t && v && v !== t.title) updateTask(t.id, { title: v }); };
KEY.blur = el => el.blur();

/* subtasks */
A.toggleSub = el => { const t = task(el.dataset.id); const s = t.subtasks.find(x => x.id === el.dataset.sid); if (!s.done) fxSet({ done: s.id }); mutate(() => { s.done = !s.done; logAct(s.done ? 'completed subtask on' : 'reopened subtask on', t, `“${s.title}”`); }); };
A.rmSub = el => { const t = task(el.dataset.id); mutate(() => { t.subtasks = t.subtasks.filter(x => x.id !== el.dataset.sid); }); };
KEY.addSub = el => { const t = task(el.dataset.id); const v = el.value.trim(); if (!v) return; const nid = uid('s'); fxSet({ added: nid }); mutate(() => { t.subtasks.push({ id: nid, title: v, done: false }); logAct('added subtask to', t, `“${v}”`); }); setTimeout(() => $('#d-sub')?.focus(), 0); };
A.expandRow = el => { S.ui.openTasks[el.dataset.id] = !S.ui.openTasks[el.dataset.id]; render(); };

/* attachments */
A.rmAttach = el => { const t = task(el.dataset.id); const f = t.attachments.find(a => a.id === el.dataset.aid); mutate(() => { t.attachments = t.attachments.filter(a => a.id !== el.dataset.aid); logAct('removed a file from', t); }); toast(`Removed ${f.name}`); };
A.filePreview = el => { const t = task(el.dataset.tid); const f = t.attachments.find(a => a.id === el.dataset.aid); openModal({ type: 'filePreview', file: f, tid: t.id }); };
A.previewFile = el => { const f = D().files.find(x => x.id === el.dataset.id); S.ui.pop = null; if (f) openModal({ type: 'filePreview', file: f, tid: f.task }); };
function handleFiles(files, ctx) {
  if (!files || !files.length) return;
  if (S.ui.offline) { toast("Upload failed — you're offline.", { kind: 'err', action: 'Try again', onAction: () => { } }); return; }
  S.ui.uploads = S.ui.uploads || [];
  [...files].forEach(file => {
    const up = { id: uid('u'), name: file.name, size: fsize(file.size), project: ctx.project, task: ctx.task, pct: 0 };
    S.ui.uploads.push(up);
    const iv = setInterval(() => {
      up.pct = Math.min(100, up.pct + 9 + Math.round(Math.random() * 22));
      const bar = document.getElementById('upbar-' + up.id), pc = document.getElementById('upct-' + up.id);
      if (bar) bar.style.setProperty('--p', up.pct / 100); if (pc) pc.textContent = up.pct + '%';
      if (up.pct >= 100) {
        clearInterval(iv);
        S.ui.uploads = S.ui.uploads.filter(x => x !== up);
        const rec = { id: uid('f'), name: up.name, type: fileType(up.name), size: up.size, by: D().me, at: Date.now() };
        D().files.unshift({ ...rec, project: up.project, task: up.task || null });
        if (up.task) { const t = task(up.task); t.attachments.push(rec); logAct('added a file to', t, up.name); }
        save(); render(); toast(`Uploaded ${up.name}`);
      }
    }, 220);
  });
  render();
}
IN.uploadFiles = el => { handleFiles(el.files, { project: el.dataset.project, task: el.dataset.task }); el.value = ''; };

/* comments */
IN.draft = el => {
  const id = el.dataset.id; S.ui.drafts[id] = el.value;
  const before = el.value.slice(0, el.selectionStart); const m = before.match(/(?:^|\s)@([A-Za-z]*)$/);
  const prev = JSON.stringify(S.ui.mention);
  S.ui.mention = m ? { tid: id, q: m[1] } : null;
  if (prev !== JSON.stringify(S.ui.mention)) render();
  if (el.dataset.autosize != null) autosize(el);
};
A.pickMention = el => { const id = el.dataset.id; const d = S.ui.drafts[id] || ''; S.ui.drafts[id] = d.replace(/@([A-Za-z]*)$/, '@' + el.dataset.name + ' '); S.ui.mention = null; render(); const ta = $('#d-cmt'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } };
A.insertAt = el => { const id = el.dataset.id; const d = S.ui.drafts[id] || ''; S.ui.drafts[id] = d + (d && !d.endsWith(' ') ? ' @' : '@'); S.ui.mention = { tid: id, q: '' }; render(); const ta = $('#d-cmt'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } };
KEY.postComment = el => A.postComment(el);
A.postComment = el => {
  const id = el.dataset.id; const txt = (S.ui.drafts[id] || '').trim(); if (!txt) { $('#d-cmt, #inbox-reply')?.focus(); return; }
  const t = task(id);
  if (mutate(() => { D().comments.push({ id: uid('c'), task: id, by: D().me, at: Date.now(), text: txt, re: {} }); logAct('commented on', t); S.ui.drafts[id] = ''; S.ui.mention = null; S.ui.drawerTab = 'comments'; })) { if (S.ui.route === 'inbox') toast('Reply posted'); }
};
A.delComment = el => { const c = D().comments.find(x => x.id === el.dataset.id); const snap = snapshot(); mutate(() => { D().comments = D().comments.filter(x => x !== c); }); toast('Comment deleted', { action: 'Undo', onAction: () => restore(snap) }); };
A.react = el => { const c = D().comments.find(x => x.id === el.dataset.id); const e = el.dataset.e; S.ui.pop = null; mutate(() => { c.re = c.re || {}; const l = c.re[e] || []; c.re[e] = l.includes(D().me) ? l.filter(x => x !== D().me) : [...l, D().me]; }); };

/* rich text description */
document.addEventListener('mousedown', e => {
  const b = e.target.closest('[data-cmd]'); if (!b) return; e.preventDefault();
  const [cmd, arg] = b.dataset.cmd.split(':');
  if (cmd === 'createLink') { const s = String(getSelection()); if (/^https?:\/\//.test(s)) document.execCommand('createLink', false, s); else toast('Select a URL starting with https:// to turn it into a link', { kind: 'info' }); }
  else document.execCommand(cmd, false, arg ? `<${arg}>` : null);
  const ed = $('#d-desc'); if (ed) { const t = task(ed.dataset.rte); t.desc = ed.innerHTML; save(); }
});
document.addEventListener('input', e => { const ed = e.target.closest?.('[data-rte]'); if (!ed) return; const t = task(ed.dataset.rte); if (t) { t.desc = ed.innerHTML; t.updated = Date.now(); save(); } });

/* selection & bulk */
A.selRow = el => { const id = el.dataset.id; S.ui.sel.has(id) ? S.ui.sel.delete(id) : S.ui.sel.add(id); render(); };
A.selAll = el => { const ids = $$('[data-task-row]', el.closest('.tlist')).map(r => r.dataset.taskRow); const all = ids.every(i => S.ui.sel.has(i)); ids.forEach(i => all ? S.ui.sel.delete(i) : S.ui.sel.add(i)); render(); };
A.clearSel = () => { S.ui.sel.clear(); render(); };
A.bulkSet = el => { const f = el.dataset.f; let v = el.dataset.v || null; const ids = [...S.ui.sel]; S.ui.pop = null; if (mutate(() => ids.forEach(id => applyPatch(task(id), { [f]: v })))) toast(`Updated ${ids.length} task${ids.length > 1 ? 's' : ''}`); };
A.bulkDelete = () => { const ids = [...S.ui.sel]; confirmDlg({ title: `Delete ${ids.length} task${ids.length > 1 ? 's' : ''}?`, body: 'The selected tasks, their subtasks, and comments will be permanently deleted.', ok: `Delete ${ids.length} task${ids.length > 1 ? 's' : ''}`, danger: true, run: () => { const snap = snapshot(); if (mutate(() => deleteTasks(ids))) toast(`Deleted ${ids.length} tasks`, { action: 'Undo', onAction: () => restore(snap) }); } }); };

/* views: sort, group, filters, columns */
A.sortBy = el => { const v = viewOf(el.dataset.key); const f = el.dataset.f; if (S.ui.justResized) return; v.sort = v.sort.f === f ? { f, dir: -v.sort.dir } : { f, dir: 1 }; save(); render(); };
A.setSort = el => { const v = viewOf(el.dataset.key); v.sort = { f: el.dataset.v, dir: v.sort.dir || 1 }; S.ui.pop = null; save(); render(); };
A.setSortDir = el => { viewOf(el.dataset.key).sort.dir = +el.dataset.v; save(); render(); };
A.setGroup = el => { viewOf(el.dataset.key).group = el.dataset.v; S.ui.pop = null; save(); render(); };
A.toggleGroup = el => { const gk = el.dataset.gk; S.ui.collapsedGroups[gk] = el.getAttribute('aria-expanded') === 'true'; render(); };
A.setViewMode = el => { viewOf(el.dataset.key).mode = el.dataset.v; save(); render(); };
A.toggleCol2 = el => { const v = viewOf(el.dataset.key); const c = el.dataset.v; v.hidden = v.hidden.includes(c) ? v.hidden.filter(x => x !== c) : [...v.hidden, c]; save(); render(); };
A.resetCols = el => { viewOf(el.dataset.key).colW = {}; S.ui.pop = null; save(); render(); };
IN.viewQ = el => { viewOf(el.dataset.key).q = el.value; render(); };
A.addFilter = el => { const v = viewOf(el.dataset.key); v.filters.push({ f: el.dataset.f, op: 'is', v: [] }); if (S.ui.pop?.type === 'filter') S.ui.pop.edit = v.filters.length - 1; else { const r = el.getBoundingClientRect(); S.ui.pop = { type: 'filter', key: el.dataset.key, x: r.left, y: r.bottom + 4, edit: v.filters.length - 1 }; } save(); render(); };
A.fEdit = el => { const p = S.ui.pop; p.edit = p.edit === +el.dataset.i ? null : +el.dataset.i; render(); };
A.fToggleVal = el => { const f = viewOf(el.dataset.key).filters[+el.dataset.i]; const x = el.dataset.v; f.v = f.v.includes(x) ? f.v.filter(y => y !== x) : [...f.v, x]; save(); render(); };
A.rmFilter = el => { const v = viewOf(el.dataset.key); v.filters.splice(+el.dataset.i, 1); if (S.ui.pop && (S.ui.pop.type === 'fvals')) S.ui.pop = null; if (S.ui.pop?.type === 'filter') S.ui.pop.edit = null; save(); render(); };
A.clearFilters = el => { const v = viewOf(el.dataset.key); v.filters = []; v.q = ''; S.ui.pop = null; save(); render(); };
IN.fField = el => { const f = viewOf(el.dataset.key).filters[+el.dataset.i]; f.f = el.value; f.v = []; S.ui.pop.edit = +el.dataset.i; save(); render(); };
IN.fOp = el => { viewOf(el.dataset.key).filters[+el.dataset.i].op = el.value; save(); render(); };
A.saveView = el => { const k = 'p:' + el.dataset.id; openModal({ type: 'saveView', pid: el.dataset.id, nf: viewOf(k).filters.length }); };
A.saveViewSubmit = () => {
  const m = S.ui.modals[S.ui.modals.length - 1]; const name = $('#sv-name').value.trim() || 'Untitled view'; const type = $('#sv-type').value;
  const sv = { id: uid('v'), project: m.pid, name, type, filters: JSON.parse(JSON.stringify(viewOf('p:' + m.pid).filters)) };
  D().savedViews.push(sv); save(); S.ui.modals.pop(); go('project', { id: m.pid, tab: 'v:' + sv.id }, { tab: true }); toast(`Saved view “${name}”`);
};
A.renameView = el => { const v = D().savedViews.find(x => x.id === el.dataset.id); S.ui.pop = null; openModal({ type: 'prompt', title: 'Rename view', label: 'View name', value: v.name, run: val => { if (val) { v.name = val; save(); } } }); };
A.delView = el => { const v = D().savedViews.find(x => x.id === el.dataset.id); S.ui.pop = null; D().savedViews = D().savedViews.filter(x => x !== v); save(); if (S.ui.params.tab === 'v:' + v.id) go('project', { id: v.project, tab: 'list' }, { tab: true }); else render(); toast(`Deleted view “${v.name}”`); };

/* board column menu */
A.toggleCol = el => { delete S.ui.collapsedCols[el.dataset.ck]; render(); };
A.colCollapse = el => { S.ui.collapsedCols[S.ui.pop.key + ':' + el.dataset.id] = true; S.ui.pop = null; render(); };
A.colAdd = el => { const key = S.ui.pop.key; const pid = projectFromKey(key); S.ui.pop = null; A.startComposer({ dataset: { ctx: key, group: el.dataset.id, gb: JSON.stringify({ status: el.dataset.id, ...(pid ? { project: pid } : {}) }) } }); };
function colTasks(key, st) { const pid = projectFromKey(key); return (pid ? tasksOf(pid) : allTasks()).filter(t => t.status === st); }
A.colDoneAll = el => { const ts = colTasks(S.ui.pop.key, el.dataset.id); S.ui.pop = null; if (!ts.length) { render(); return; } const snap = snapshot(); if (mutate(() => ts.forEach(t => applyPatch(t, { status: 'done' })))) toast(`Marked ${ts.length} tasks as done`, { action: 'Undo', onAction: () => restore(snap) }); };
A.colArchive = el => { const ts = colTasks(S.ui.pop.key, 'done'); S.ui.pop = null; const snap = snapshot(); if (mutate(() => ts.forEach(t => { t.archived = true; t.archivedAt = Date.now(); }))) toast(`Archived ${ts.length} completed tasks`, { action: 'Undo', onAction: () => restore(snap) }); };
A.colSortPrio = el => { const ts = colTasks(S.ui.pop.key, el.dataset.id).sort((a, b) => PR[b.priority].w - PR[a.priority].w); const base = Math.min(...ts.map(t => t.order)); S.ui.pop = null; mutate(() => ts.forEach((t, i) => t.order = base + i * 0.001)); };

/* calendar & timeline */
A.calNav = el => {
  const d = +el.dataset.d; const cur = parse(S.ui.calDate);
  S.ui.calDate = d === 0 ? iso(TODAY) : S.ui.calMode === 'month' ? iso(new Date(cur.getFullYear(), cur.getMonth() + d, 1)) : iso(addD(cur, d * 7));
  render();
};
A.tlToday = () => { const r = $('#tl-right'); if (r) r.scrollTo({ left: Math.max(0, +$('.tl').dataset.tlToday - 160), behavior: 'smooth' }); };
IN.tlGroup = el => { S.ui.tlGroup = el.value; render(); };

/* projects */
IN.projQ = el => { S.ui.projQ = el.value; render(); };
IN.projStatus = el => { S.ui.projStatus = el.value; render(); };
IN.projSort = el => { S.ui.projSort = el.value; render(); };
A.clearProjFilters = () => { S.ui.projQ = ''; S.ui.projStatus = 'all'; render(); };
A.newProject = () => { S.ui.pform = { name: '', desc: '', icon: 'folder', color: 'indigo', team: me().team, lead: D().me, due: dOff(30), tmpl: 'blank' }; S.ui.errors = {}; S.ui.pop = null; openModal({ type: 'project' }); };
A.editProject = el => { const p = proj(el.dataset.id); S.ui.pop = null; S.ui.pform = { name: p.name, desc: p.desc, icon: p.icon, color: p.color, team: p.team, lead: p.lead, due: p.due, tmpl: 'blank' }; S.ui.errors = {}; openModal({ type: 'project', edit: p.id }); };
IN.pform = el => { S.ui.pform[el.dataset.f] = el.value; if (el.dataset.f === 'name' && S.ui.errors.pname && el.value.trim()) { S.ui.errors.pname = null; render(); } };
A.pformSet = el => { S.ui.pform[el.dataset.f] = el.dataset.v; if (el.dataset.f === 'tmpl') { const t = TEMPLATES.find(x => x.id === el.dataset.v); if (t && S.ui.pform.icon === 'folder') S.ui.pform.icon = t.icon === 'file' ? 'folder' : t.icon; } render(); };
function makeKey(name) { let k = name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); if (k.length < 2) k = name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PRJ'; while (D().projects.some(p => p.key === k)) k += 'X'; return k; }
function createProject(f, tmplId) {
  const p = { id: uid('p'), key: makeKey(f.name), name: f.name, icon: f.icon, color: f.color, status: 'planning', team: f.team, lead: f.lead, due: f.due || dOff(30), start: dOff(0), fav: false, members: [...new Set([D().me, f.lead])], desc: f.desc || 'No description yet.', milestones: [], last: 0 };
  D().projects.push(p); D().projOrder.unshift(p.id);
  D().activity.unshift({ id: uid('a'), by: D().me, verb: 'created project', task: null, project: p.id, at: Date.now(), extra: '' });
  const tm = TEMPLATES.find(t => t.id === tmplId);
  (tm?.tasks || []).forEach((title, i) => createTask({ project: p.id, title, status: i === 0 ? 'todo' : 'backlog', assignee: i === 0 ? D().me : null, priority: i === 0 ? 'high' : 'medium', due: dOff(5 + i * 5), start: dOff(i * 5) }));
  return p;
}
A.submitProject = () => {
  const m = S.ui.modals[S.ui.modals.length - 1]; const f = S.ui.pform;
  f.name = ($('#p-name')?.value || '').trim(); f.desc = $('#p-desc')?.value || '';
  if (!f.name) { S.ui.errors.pname = 'Give the project a name'; render(); $('#p-name')?.focus(); return; }
  if (m.edit) { const p = proj(m.edit); if (mutate(() => Object.assign(p, { name: f.name, desc: f.desc, icon: f.icon, color: f.color, team: f.team, lead: f.lead, due: f.due, members: [...new Set([...p.members, f.lead])] }))) { S.ui.modals.pop(); render(); toast('Project updated'); } return; }
  let p; if (!mutate(() => { p = createProject(f, f.tmpl); })) return;
  S.ui.modals.pop(); go('project', { id: p.id, tab: f.tmpl === 'blank' ? 'overview' : (S.prefs.defaultTab || 'board') });
  toast(`Created ${p.name}${tasksOf(p.id).length ? ` with ${tasksOf(p.id).length} starter tasks` : ''}`);
};
A.dupProject = el => { const p = proj(el.dataset.id); S.ui.pop = null; let n; mutate(() => { n = createProject({ ...p, name: p.name + ' copy' }, 'blank'); tasksOf(p.id).forEach(t => createTask({ ...JSON.parse(JSON.stringify(t)), id: uid('t'), key: undefined, project: n.id, status: 'todo' })); }); toast(`Duplicated ${p.name}`, { action: 'Open', onAction: () => go('project', { id: n.id }) }); };
A.archiveProject = el => { const p = proj(el.dataset.id); S.ui.pop = null; confirmDlg({ title: `Archive ${p.name}?`, body: 'The project will be hidden from the sidebar and project lists. Tasks, files, and comments are kept, and you can restore it from Settings → Projects.', ok: 'Archive project', icon: 'archive', run: () => { const snap = snapshot(); if (mutate(() => { p.archived = true; p.archivedAt = Date.now(); })) { if (S.ui.route === 'project' && S.ui.params.id === p.id) go('projects'); toast(`Archived ${p.name}`, { action: 'Undo', onAction: () => restore(snap) }); } } }); };
A.restoreProject = el => { const p = proj(el.dataset.id); mutate(() => { p.archived = false; p.archivedAt = null; }); toast(`Restored ${p.name}`); };
A.delProject = el => { const p = proj(el.dataset.id); S.ui.pop = null; const n = tasksOf(p.id).length; confirmDlg({ title: `Delete ${p.name}?`, body: `This permanently deletes the project and its <b>${n} task${n === 1 ? '' : 's'}</b>, files, and comments for everyone. This can't be undone.`, ok: 'Delete project', danger: true, typeName: p.name, run: () => { const snap = snapshot(); if (mutate(() => { const ids = tasksOf(p.id).map(t => t.id); D().tasks.filter(t => t.project === p.id).forEach(t => ids.push(t.id)); deleteTasks(ids); D().projects = D().projects.filter(x => x !== p); D().projOrder = D().projOrder.filter(x => x !== p.id); D().files = D().files.filter(f => f.project !== p.id); })) { if (S.ui.route === 'project' && S.ui.params.id === p.id) go('projects'); toast(`Deleted ${p.name}`, { action: 'Undo', onAction: () => restore(snap) }); } } }); };
A.requestAccess = el => { const p = proj(el.dataset.id); toast(`Access requested. We'll notify you when ${mem(p?.lead)?.name || 'the owner'} responds.`); };

/* sharing & invites */
A.share = el => { const id = el.dataset.id || curProjectId(); S.ui.shareQ = ''; S.ui.pop = null; openModal({ type: 'share', id }); };
IN.shareQ = el => { S.ui.shareQ = el.value; render(); };
A.shareAdd = el => { const p = proj(el.dataset.id); const m = mem(el.dataset.mid); mutate(() => { p.members.push(m.id); }); S.ui.shareQ = ''; render(); toast(`${m.name} can now edit ${p.name}`); };
A.shareInvite = () => {
  const m = S.ui.modals[S.ui.modals.length - 1]; const p = proj(m.id); const v = ($('#share-in')?.value || '').trim(); const perm = $('#share-perm')?.value;
  if (!v) { $('#share-in')?.focus(); return; }
  const ex = D().members.find(x => x.email.toLowerCase() === v.toLowerCase() || x.name.toLowerCase() === v.toLowerCase());
  if (ex) { if (!p.members.includes(ex.id)) mutate(() => { p.members.push(ex.id); p.perms = p.perms || {}; p.perms[ex.id] = perm; }); S.ui.shareQ = ''; render(); toast(`Shared with ${ex.name}`); return; }
  if (!/^\S+@\S+\.\S+$/.test(v)) { toast('Enter a valid email address, like name@company.com', { kind: 'err' }); return; }
  const nm = v.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  mutate(() => { const id = uid('m'); D().members.push({ id, name: nm, email: v, role: 'Guest', team: p.team, title: 'Guest', c: '#6B7280', status: 'invited', last: null, tz: '—' }); p.members.push(id); p.perms = p.perms || {}; p.perms[id] = perm; });
  S.ui.shareQ = ''; render(); toast(`Invitation sent to ${v}`);
};
IN.sharePerm = el => { const p = proj(el.dataset.id); const mid = el.dataset.mid; if (el.value === '__remove') { const snap = snapshot(); mutate(() => { p.members = p.members.filter(x => x !== mid); }); toast(`Removed ${mem(mid).name}`, { action: 'Undo', onAction: () => restore(snap) }); } else { mutate(() => { p.perms = p.perms || {}; p.perms[mid] = el.value; }); toast(`${mem(mid).name}: ${el.value}`, { ms: 1800 }); } };
IN.shareAccess = el => { const p = proj(el.dataset.id); mutate(() => { p.access = el.value; }); };
A.invite = () => { S.ui.inviteDraft = ''; S.ui.errors = {}; S.ui.pop = null; openModal({ type: 'invite' }); };
A.submitInvite = () => {
  const raw = $('#inv-emails').value; S.ui.inviteDraft = raw; const role = $('#inv-role').value; const team = $('#inv-team').value;
  const list = raw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  const bad = list.filter(e => !/^\S+@\S+\.\S+$/.test(e));
  if (!list.length) { S.ui.errors.invite = 'Enter at least one email address'; render(); return; }
  if (bad.length) { S.ui.errors.invite = `${bad[0]} isn't a valid email address`; render(); return; }
  loadingBtn('inv-submit', 600, () => {
    if (!mutate(() => list.forEach(e => { if (!D().members.some(m => m.email === e)) D().members.push({ id: uid('m'), name: e.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), email: e, role, team, title: role, c: '#6B7280', status: 'invited', last: null, tz: '—' }); }))) return;
    S.ui.modals.pop(); S.ui.errors = {}; render(); toast(`${list.length} invitation${list.length > 1 ? 's' : ''} sent`);
  });
};
A.copyInviteLink = () => copy(`https://gr8rstudio.com/join/${D().ws.url}-7f3k2`, 'Invite link copied');
A.resendInvite = el => { S.ui.pop = null; render(); toast(`Invite resent to ${mem(el.dataset.id).email}`); };
A.viewProfile = el => go('member', { id: el.dataset.id });
A.assignToMember = el => { S.ui.pop = null; A.newTask({ dataset: { assignee: el.dataset.id } }); };
A.removeMember = el => { const m = mem(el.dataset.id); S.ui.pop = null; const n = allTasks().filter(t => t.assignee === m.id && t.status !== 'done').length; confirmDlg({ title: `Remove ${m.name}?`, body: `${esc(m.name)} will lose access to ${esc(D().ws.name)} immediately.${n ? ` Their <b>${n} open task${n > 1 ? 's' : ''}</b> will become unassigned.` : ''}`, ok: 'Remove member', danger: true, icon: 'user-minus', run: () => { const snap = snapshot(); if (mutate(() => { D().members = D().members.filter(x => x !== m); D().tasks.forEach(t => { if (t.assignee === m.id) t.assignee = null; }); D().projects.forEach(p => p.members = p.members.filter(x => x !== m.id)); })) { if (S.ui.route === 'member') go('members'); toast(`Removed ${m.name}`, { action: 'Undo', onAction: () => restore(snap) }); } } }); };
IN.memQ = el => { S.ui.memQ = el.value; render(); };
IN.actWho = el => { S.ui.actWho = el.value; render(); };

/* files */
IN.fileQ = el => { S.ui.fileQ = el.value; render(); };
IN.fileType = el => { S.ui.fileType = el.value; render(); };
IN.fileSort = el => { S.ui.fileSort = el.value; render(); };
A.renameFile = el => { const f = D().files.find(x => x.id === el.dataset.id); S.ui.pop = null; openModal({ type: 'prompt', title: 'Rename file', label: 'File name', value: f.name, run: v => { if (v) mutate(() => { f.name = v; f.type = fileType(v); }); } }); };
A.dupFile = el => { const f = D().files.find(x => x.id === el.dataset.id); S.ui.pop = null; mutate(() => { const i = D().files.indexOf(f); D().files.splice(i + 1, 0, { ...f, id: uid('f'), name: f.name.replace(/(\.[^.]+)$/, ' copy$1'), at: Date.now(), by: D().me }); }); toast('File duplicated'); };
A.delFile = el => { const f = D().files.find(x => x.id === el.dataset.id); S.ui.pop = null; confirmDlg({ title: 'Delete file?', body: `<b>${esc(f.name)}</b> will be removed from the project${f.task ? ' and its task' : ''}.`, ok: 'Delete file', danger: true, run: () => { const snap = snapshot(); if (mutate(() => { D().files = D().files.filter(x => x !== f); if (f.task && task(f.task)) task(f.task).attachments = task(f.task).attachments.filter(a => a.name !== f.name); })) toast(`Deleted ${f.name}`, { action: 'Undo', onAction: () => restore(snap) }); } }); };

/* inbox & notifications */
A.selNotif = el => { const n = D().notifs.find(x => x.id === el.dataset.id); n.read = true; S.ui.inboxSel = n.id; save(); render(); };
A.toggleRead = el => { const n = D().notifs.find(x => x.id === el.dataset.id); n.read = !n.read; save(); render(); };
A.markAllRead = () => { const n = D().notifs.filter(x => !x.read).length; D().notifs.forEach(x => x.read = true); save(); render(); if (n) toast("You're all caught up."); };
A.toggleUnreadOnly = () => { S.ui.inboxUnread = !S.ui.inboxUnread; render(); };
A.openNotif = el => { const n = D().notifs.find(x => x.id === el.dataset.id); n.read = true; save(); if (n.task) A.openTask({ dataset: { id: n.task } }); else if (n.project) go('project', { id: n.project, tab: 'overview' }); };

/* search & palette */
A.openPalette = () => { S.ui.palOpener = focusKey(document.activeElement); S.ui.palette = { q: '', mode: 'cmd', scope: 'all', hl: 0 }; S.ui.pop = null; render(); };
A.openSearch = () => { S.ui.palOpener = focusKey(document.activeElement); S.ui.palette = { q: '', mode: 'search', scope: 'all', hl: 0 }; S.ui.pop = null; S.ui.mnav = false; render(); };
A.closePalette = () => { S.ui.palette = null; render(); };
A.palScope = el => { S.ui.palette.scope = el.dataset.v; S.ui.palette.hl = 0; render(); $('#pal-in')?.focus(); };
IN.palQ = el => { S.ui.palette.q = el.value; S.ui.palette.hl = 0; render(); };
A.palRun = el => { const it = S.ui.palette?._flat?.[+el.dataset.i]; if (!it) return; S.ui.palette = null; render(); it.run(); };
IN.searchQ = el => { S.ui.searchQ = el.value; render(); };
A.setSearch = el => { S.ui.searchQ = el.dataset.q; render(); $('#search-page-q')?.focus(); };

/* workspace, account, prototype controls */
A.switchWs = el => { const w = D().workspaces.find(x => x.id === el.dataset.v); S.ui.pop = null; D().ws = { name: w.name, url: w.name.toLowerCase().replace(/[^a-z0-9]+/g, ''), c: w.c, brand: !!w.brand }; save(); go('home'); toast(`Switched to ${w.name}`); };
A.newWorkspace = () => { S.ui.pop = null; S.ui.auth = 'onboarding'; S.ui.onb = 1; S.ui.onbData.ws = ''; S.ui.onbData.url = ''; render(); };
A.signOut = () => { S.ui.pop = null; S.ui.palette = null; S.ui.drawer = null; S.ui.modals = []; S.ui.auth = 'login'; S.ui.errors = {}; render(); };
A.shortcuts = () => { S.ui.pop = null; S.ui.palette = null; openModal({ type: 'shortcuts' }); };
A.startOnboarding = () => { S.ui.pop = null; S.ui.auth = 'onboarding'; S.ui.onb = 0; render(); };
A.toggleOffline = () => { S.ui.offline = !S.ui.offline; S.ui.pop = null; render(); toast(S.ui.offline ? "Offline mode on — edits will fail to save" : 'Back online', { kind: S.ui.offline ? 'err' : 'ok' }); };
A.retryOnline = el => { el.classList.add('is-loading'); setTimeout(() => { S.ui.offline = false; render(); toast('Reconnected. All changes are synced.'); }, 700); };
A.resetDemo = () => { S.ui.pop = null; confirmDlg({ title: 'Reset demo data?', body: 'All projects, tasks, and settings in this browser go back to the original sample workspace.', ok: 'Reset data', danger: true, icon: 'rotate-ccw', run: () => { S.data = seed(); S.views = {}; S.prefs = { ...DEFAULT_PREFS, theme: S.prefs.theme }; S.ui.drawer = null; save(); go('home'); toast('Demo data restored'); } }); };
A.toastInfo = el => toast(el.dataset.msg, { kind: 'info' });
A.demoToast = el => { const v = el.dataset.v; if (v === 'err') toast("Your changes couldn't be saved.", { kind: 'err', action: 'Try again', onAction: () => toast('Saved') }); else if (v === 'retry') { toast('Retrying…', { kind: 'info', ms: 1200 }); setTimeout(() => toast('Loaded successfully'), 1300); } else toast('Moved “Create homepage wireframes” to Review', { action: 'Undo', onAction: () => toast('Undone', { kind: 'info' }) }); };
A.demoConfirm = () => confirmDlg({ title: 'Archive Marketing Website?', body: 'The project will be hidden from the sidebar. You can restore it any time.', ok: 'Archive project', icon: 'archive', run: () => toast('This was a preview — nothing was archived', { kind: 'info' }) });
A.demoLoad = el => { el.classList.add('is-loading'); setTimeout(() => { el.classList.remove('is-loading'); toast('Loaded'); }, 1400); };
A.reloadPage = () => { S.ui.loading = true; render(); setTimeout(() => { S.ui.loading = false; render(); }, 1400); };

/* modals */
A.closeModal = () => closeModal();
A.closeModalBg = (el, e) => { if (e.target === el) closeModal(); };
A.confirmOk = () => { const m = S.ui.modals[S.ui.modals.length - 1]; if (m.typeName && S.ui.confirmText !== m.typeName) return; S.ui.modals.pop(); S.ui.confirmText = ''; render(); m.run && m.run(); };
IN.confirmText = el => { S.ui.confirmText = el.value; const m = S.ui.modals[S.ui.modals.length - 1]; const b = $('.modal:last-of-type [data-a="confirmOk"]') || $$('[data-a="confirmOk"]').pop(); if (b) b.disabled = el.value !== m.typeName; };
A.promptSubmit = () => { const m = S.ui.modals[S.ui.modals.length - 1]; const v = $('#prompt-in').value.trim(); S.ui.modals.pop(); render(); m.run(v); };
IN.noop = () => { };

/* settings */
IN.prefToggle = el => { S.prefs[el.dataset.k] = el.checked; save(); };
IN.npToggle = el => { D().notifPrefs[el.dataset.k] = el.checked; save(); toast('Notification preferences saved', { ms: 1500 }); };
IN.prefSel = el => { const k = el.dataset.k; S.prefs[k] = k === 'weekStart' ? +el.value : el.value; save(); render(); toast('Preference saved', { ms: 1500 }); };
A.wsColor = el => { D().ws.c = el.dataset.v; save(); render(); };
A.saveWorkspace = () => { const n = $('#ws-name').value.trim(); const u = $('#ws-url').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'); if (!n) { toast('Workspace name can\'t be empty', { kind: 'err' }); return; } loadingBtn('ws-save', 600, () => { if (mutate(() => { const old = D().ws.name; D().ws.name = n; D().ws.url = u || D().ws.url; const w = D().workspaces.find(x => x.name === old); if (w) w.name = n; })) toast('Workspace settings saved'); }); };
A.delWorkspace = () => confirmDlg({ title: `Delete ${D().ws.name}?`, body: 'Every project, task, file, and comment in this workspace will be permanently deleted for all members.', ok: 'Delete workspace', danger: true, typeName: D().ws.name, run: () => { S.data = seed(); S.views = {}; save(); S.ui.auth = 'login'; render(); toast('Workspace deleted. Demo data was restored for this prototype.', { kind: 'info', ms: 5000 }); } });
A.avColor = el => { me().c = el.dataset.v; save(); render(); };
A.saveProfile = () => { const n = $('#pf-name').value.trim(); if (!n) { S.ui.errors.pname2 = 'Enter your name'; render(); return; } S.ui.errors.pname2 = null; const tt = $('#pf-title').value.trim(); loadingBtn('pf-save', 600, () => { if (mutate(() => { S.prefs.name = n; S.prefs.title = tt; me().name = n; me().title = tt; })) toast('Profile updated'); }); };
IN.pwStrength = el => { S.ui.pwNew = el.value; const m = el.parentElement.querySelector('.row .strength')?.parentElement; const tmp = document.createElement('div'); tmp.innerHTML = strengthMeter(el.value); if (m) m.replaceWith(tmp.firstElementChild || document.createTextNode('')); else if (tmp.firstElementChild) el.after(tmp.firstElementChild); };
A.savePassword = () => { const e = S.ui.errors = {}; const cur = $('#pw-cur').value, nw = $('#pw-new').value, cf = $('#pw-conf').value; S.ui.pwDone = false; if (!cur) e.pwCur = 'Enter your current password'; if (nw.length < 10 || !/[0-9\W]/.test(nw)) e.pwNew = 'Use at least 10 characters, including a number or symbol'; if (nw !== cf) e.pwConf = "Passwords don't match"; if (Object.keys(e).length) { render(); return; } loadingBtn('pw-save', 800, () => { S.ui.pwDone = true; S.ui.pwNew = ''; render(); toast('Password updated'); }); };
A.revokeSession = el => { mutate(() => { D().sessions = D().sessions.filter(s => s.id !== el.dataset.id); }); toast('Session signed out'); };
A.revokeAll = () => confirmDlg({ title: 'Sign out of all other sessions?', body: 'You\'ll stay signed in on this device. Other devices will need to sign in again.', ok: 'Sign out others', danger: true, icon: 'log-out', run: () => { mutate(() => { D().sessions = D().sessions.filter(s => s.cur); }); toast('Signed out of other sessions'); } });
A.setup2fa = () => { S.ui.tfaSetup = true; S.ui.errors = {}; render(); };
A.cancel2fa = () => { S.ui.tfaSetup = false; render(); };
A.verify2fa = () => { const v = $('#tfa-code').value.trim(); if (!/^\d{6}$/.test(v)) { S.ui.errors.tfa = 'Enter the 6-digit code from your app'; render(); return; } S.ui.errors = {}; mutate(() => { D().tfa = true; S.ui.tfaSetup = false; }); toast('Two-factor authentication enabled'); };
A.disable2fa = () => confirmDlg({ title: 'Turn off two-factor authentication?', body: 'Your account will be protected by your password only.', ok: 'Turn off', danger: true, icon: 'shield-off', run: () => { mutate(() => { D().tfa = false; }); toast('Two-factor authentication turned off'); } });
A.changePlan = el => { const v = el.dataset.v; const price = { Free: 0, Team: 12, Business: 24 }[v]; confirmDlg({ title: `${v === 'Free' ? 'Downgrade' : 'Upgrade'} to ${v}?`, body: `${D().members.length} members × $${price}/month = <b>$${D().members.length * price}/month</b>, prorated from today and billed to Visa ending 4242.`, ok: v === 'Free' ? 'Downgrade' : `Upgrade to ${v}`, icon: 'gem', run: () => { mutate(() => { D().plan = v; }); toast(`You're now on the ${v} plan`); } }); };

/* auth */
A.auth = el => { S.ui.auth = el.dataset.v; S.ui.errors = {}; S.ui.pwNew = ''; render(); setTimeout(() => $('.auth input')?.focus(), 20); };
A.toggleShowPw = () => { const v = $('#l-pw')?.value; S.ui.showPw = !S.ui.showPw; render(); const i = $('#l-pw'); if (i) { i.value = v; i.focus(); } };
const EMAIL_RE = /^\S+@\S+\.\S+$/;
function enterApp(msg) { S.ui.auth = null; S.ui.errors = {}; go(S.prefs.home || 'home'); toast(msg); }
A.doLogin = () => {
  const e = S.ui.errors = {}; const em = $('#l-email').value.trim(), pw = $('#l-pw').value; S.ui.af.email = em;
  if (!em) e.email = 'Enter your email address'; else if (!EMAIL_RE.test(em)) e.email = 'Enter a valid email, like name@company.com';
  if (!pw) e.pw = 'Enter your password';
  if (Object.keys(e).length) { render(); (e.email ? $('#l-email') : $('#l-pw'))?.focus(); if (!e.email) $('#l-pw').value = pw; return; }
  loadingBtn('login-btn', 750, () => enterApp(`Signed in as ${em}`));
};
A.socialAuth = el => { el.classList.add('is-loading'); setTimeout(() => enterApp(`Signed in with ${el.dataset.v}`), 800); };
A.doSignup = () => {
  const e = S.ui.errors = {}; const nm = $('#s-name').value.trim(), em = $('#s-email').value.trim(), pw = $('#s-pw').value;
  S.ui.af.name = nm; S.ui.af.email = em;
  if (!nm) e.name = 'Enter your name'; if (!EMAIL_RE.test(em)) e.email = 'Enter a valid work email';
  if (pw.length < 10 || !/[0-9\W]/.test(pw)) e.pw = 'Use at least 10 characters, including a number or symbol';
  if (Object.keys(e).length) { render(); $('#s-email').value = em; return; }
  loadingBtn('signup-btn', 800, () => { S.ui.auth = 'verify'; startResend(); render(); });
};
function startResend() { S.ui.resendT = 30; clearInterval(startResend._i); startResend._i = setInterval(() => { S.ui.resendT--; const el = $('#resend-t'); if (el) el.textContent = S.ui.resendT; if (S.ui.resendT <= 0) { clearInterval(startResend._i); if (S.ui.auth === 'verify') render(); } }, 1000); }
A.resend = el => { if (el.dataset.v === 'verify') { startResend(); render(); toast(`Verification email sent to ${S.ui.af.email}`); } else toast(`Reset link sent to ${S.ui.af.email}`); };
A.verified = () => { S.ui.auth = 'onboarding'; S.ui.onb = 0; S.ui.onbData.ws = ''; S.ui.onbData.url = ''; render(); };
A.doForgot = () => { const em = $('#f-email').value.trim(); S.ui.af.email = em; S.ui.errors = {}; if (!EMAIL_RE.test(em)) { S.ui.errors.email = 'Enter the email you use to sign in'; render(); return; } loadingBtn('forgot-btn', 700, () => { S.ui.auth = 'forgot-sent'; render(); }); };
A.doReset = () => { const a = $('#r-pw').value, b = $('#r-pw2').value; const e = S.ui.errors = {}; if (a.length < 10 || !/[0-9\W]/.test(a)) e.pw = 'Use at least 10 characters, including a number or symbol'; if (a !== b) e.pw2 = "Passwords don't match"; if (Object.keys(e).length) { render(); return; } loadingBtn('reset-btn', 700, () => { S.ui.auth = 'reset-done'; S.ui.pwNew = ''; render(); }); };

/* onboarding */
A.onbSet = el => { S.ui.onbData[el.dataset.k] = el.dataset.v; if (el.dataset.k === 'tmpl') { const t = TEMPLATES.find(x => x.id === el.dataset.v); if (t && (!S.ui.onbData.projTouched)) S.ui.onbData.proj = t.name === 'Website' ? 'Website Launch' : t.name; } render(); };
IN.onbWs = el => { const o = S.ui.onbData; o.ws = el.value; if (!o.urlTouched) o.url = el.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (S.ui.errors.ws && el.value.trim()) S.ui.errors.ws = null; render(); };
IN.onbUrl = el => { S.ui.onbData.url = el.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'); S.ui.onbData.urlTouched = true; render(); };
IN.onbProj = el => { S.ui.onbData.proj = el.value; S.ui.onbData.projTouched = true; };
IN.onbInv = el => { const a = (S.ui.onbData.invites || '').split(','); a[+el.dataset.i] = el.value.trim(); S.ui.onbData.invites = a.join(','); };
A.onbBack = () => { S.ui.onb = Math.max(0, S.ui.onb - 1); render(); };
A.onbNext = el => {
  const o = S.ui.onbData;
  if (S.ui.onb === 1 && !o.ws.trim()) { S.ui.errors.ws = 'Name your workspace to continue'; render(); $('#o-ws')?.focus(); return; }
  if (S.ui.onb === 3 && !o.proj.trim()) { toast('Give your project a name', { kind: 'err' }); return; }
  if (S.ui.onb === 4 && el.dataset.skip) o.invites = '';
  if (S.ui.onb === 4 && !el.dataset.skip) { const bad = (o.invites || '').split(',').filter(x => x && !EMAIL_RE.test(x)); if (bad.length) { toast(`${bad[0]} isn't a valid email address`, { kind: 'err' }); return; } }
  S.ui.onb++; render(); setTimeout(() => $('.auth input')?.focus(), 20);
};
A.onbExit = () => { S.ui.auth = null; render(); };
A.onbFinish = () => {
  const o = S.ui.onbData; let p;
  mutate(() => {
    if (o.ws.trim()) { const c = ['#2F2E2A', '#5A67D8', '#23918A', '#C54B78'][D().workspaces.length % 4]; D().ws = { name: o.ws.trim(), url: o.url || 'workspace', c }; if (!D().workspaces.some(w => w.name === D().ws.name)) D().workspaces.push({ id: uid('w'), name: D().ws.name, c, plan: 'Free' }); }
    S.prefs.defaultTab = { kanban: 'board', list: 'list', timeline: 'timeline', table: 'table' }[o.team] || 'board';
    const tm = TEMPLATES.find(t => t.id === o.tmpl) || TEMPLATES[2];
    p = createProject({ name: o.proj.trim() || tm.name, icon: tm.icon === 'file' ? 'folder' : tm.icon, color: 'indigo', team: me().team, lead: D().me, desc: `Created during setup from the ${tm.name} template.` }, tm.id);
    (o.invites || '').split(',').filter(x => EMAIL_RE.test(x)).forEach(e => D().members.push({ id: uid('m'), name: e.split('@')[0].replace(/\b\w/g, c => c.toUpperCase()), email: e, role: 'Member', team: me().team, title: 'Member', c: '#6B7280', status: 'invited', last: null, tz: '—' }));
  });
  S.ui.auth = null; go('project', { id: p.id, tab: S.prefs.defaultTab });
  toast(`Welcome to ${D().ws.name}`);
};

/* =====================================================================
   EVENT WIRING
   ===================================================================== */
document.addEventListener('click', e => {
  if (S.ui.suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
  const el = e.target.closest('[data-a]');
  const inPop = e.target.closest('[data-pop-root]');
  if (S.ui.pop && !inPop) {
    const trig = el && (el.dataset.a === 'pop' || el.dataset.a === 'ctxBtn' || el.dataset.a === 'addFilter');
    if (!trig) { S.ui.pop = null; if (!el) { render(); return; } }
  }
  if (S.ui.mention && !e.target.closest('.cbox') && !(el && el.dataset.a === 'pickMention')) { S.ui.mention = null; if (!el) render(); }
  if (!el) return;
  if (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && el.type === 'checkbox' && el.dataset.a)) e.preventDefault();
  const fn = A[el.dataset.a];
  if (fn) { e.stopPropagation(); fn(el, e); }
}, false);
document.addEventListener('dblclick', e => { const el = e.target.closest('[data-dbl]'); if (el && DBL[el.dataset.dbl]) DBL[el.dataset.dbl](el, e); });
document.addEventListener('contextmenu', e => {
  const el = e.target.closest('[data-ctx]'); if (!el || e.target.closest('input,textarea,[contenteditable]')) return;
  e.preventDefault();
  S.ui.pop = { type: 'ctx', ctx: el.dataset.ctx, id: el.dataset.id, key: el.dataset.key, vid: el.dataset.vid, x: e.clientX, y: e.clientY, top: e.clientY };
  if (el.dataset.ctx === 'column') S.ui.pop.key = el.dataset.key;
  render();
});
const isChangeEl = el => el.matches('select, input[type=checkbox], input[type=radio], input[type=file], input[type=date]');
document.addEventListener('input', e => { const el = e.target; if (!el.dataset || !el.dataset.in || isChangeEl(el)) return; IN[el.dataset.in]?.(el, e); });
document.addEventListener('change', e => { const el = e.target; if (!el.dataset || !el.dataset.in || !isChangeEl(el)) return; IN[el.dataset.in]?.(el, e); });
document.addEventListener('submit', e => { e.preventDefault(); const f = e.target; const n = f.dataset.submit; if (n && A[n]) A[n](f, e); });
document.addEventListener('focusout', e => { const el = e.target; if (el?.dataset?.blur && BLUR[el.dataset.blur]) BLUR[el.dataset.blur](el); });
document.addEventListener('mouseover', e => { const el = e.target.closest?.('[data-hover-i]'); if (!el || !S.ui.palette) return; const i = +el.dataset.hoverI; if (S.ui.palette.hl === i) return; S.ui.palette.hl = i; $$('.pi.hl').forEach(x => x.classList.remove('hl')); el.classList.add('hl'); });
addEventListener('resize', () => { if (S.ui.pop) { S.ui.pop = null; render(); } });
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.prefs.theme === 'system') render(); }); } catch (e) { }

/* ---------- keyboard ---------- */
let gPending = 0;
document.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey; const t = e.target;
  const typing = t.matches?.('input, textarea, select, [contenteditable="true"]');
  const pl = S.ui.palette;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); pl ? A.closePalette() : A.openPalette(); return; }
  if (mod && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); A.toggleDark(); return; }
  // Keep Tab inside whichever surface is modal right now.
  if (e.key === 'Tab') {
    const box = pl ? $('.palette') : S.ui.modals.length ? $$('.modal').pop() : (S.ui.drawer && S.ui.drawerFull) ? $('.drawer') : null;
    if (box && !pl) {
      const f = [...box.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]')].filter(x => x.offsetParent !== null);
      if (f.length) { const i = f.indexOf(document.activeElement); if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); return; } if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); return; } }
    }
  }
  // Arrow keys move through open menus and pickers.
  if (S.ui.pop && !pl && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')) {
    const items = $$('.pop.floating .mi:not(:disabled), .pop.floating .valbtn, .pop.floating [data-a="popPick"]').filter(x => x.offsetParent !== null);
    if (items.length) { e.preventDefault(); const i = items.indexOf(document.activeElement); const n = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length; items[n].focus(); return; }
  }
  if (pl) {
    const n = pl._flat?.length || 0;
    if (e.key === 'ArrowDown') { e.preventDefault(); pl.hl = (pl.hl + 1) % Math.max(n, 1); render(); $('.pi.hl')?.scrollIntoView({ block: 'nearest' }); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); pl.hl = (pl.hl - 1 + n) % Math.max(n, 1); render(); $('.pi.hl')?.scrollIntoView({ block: 'nearest' }); return; }
    if (e.key === 'Enter') { e.preventDefault(); A.palRun({ dataset: { i: pl.hl } }); return; }
    if (e.key === 'Escape') { e.preventDefault(); A.closePalette(); return; }
    if (e.key === 'Tab') { e.preventDefault(); pl.mode = pl.mode === 'cmd' ? 'search' : 'cmd'; pl.hl = 0; render(); return; }
    if (e.key === 'Backspace' && !pl.q && pl.mode !== 'cmd') { e.preventDefault(); pl.mode = 'cmd'; render(); return; }
    return;
  }
  if (e.key === 'Escape') {
    if (S.ui.pop) { closePop(); return; }
    if (S.ui.mention) { S.ui.mention = null; render(); return; }
    if (S.ui.editCell) { S.ui.editCell = null; render(); return; }
    if (S.ui.composer) { A.cancelComposer(); return; }
    if (S.ui.modals.length) { closeModal(); return; }
    if (S.ui.subOpen) { if (typing) t.blur(); S.ui.lastSub = S.ui.subOpen.sid; A.closeSub(); return; }
    if (S.ui.drawer) { if (typing) t.blur(); A.closeDrawer(); return; }
    if (S.ui.mnav) { A.closeMnav(); return; }
    if (S.ui.sel.size) { A.clearSel(); return; }
    if (typing) t.blur();
    return;
  }
  if (mod && e.key === 'Enter') {
    const top = S.ui.modals[S.ui.modals.length - 1];
    if (top?.type === 'task') { e.preventDefault(); A.submitTask(); return; }
    if (top?.type === 'project') { e.preventDefault(); A.submitProject(); return; }
    if (t.dataset?.keyModEnter) { e.preventDefault(); KEY[t.dataset.keyModEnter]?.(t); return; }
  }
  if (e.key === 'Enter' && !e.shiftKey && t.dataset?.keyEnter) { e.preventDefault(); KEY[t.dataset.keyEnter]?.(t); return; }
  if ((e.key === 'Enter' || e.key === ' ') && t.matches?.('[role="button"], [role="link"]') && t.tagName !== 'BUTTON') { e.preventDefault(); t.click(); return; }
  if (typing || mod || e.altKey) return;
  if (S.ui.auth) return;
  // number keys inside status popover
  if (S.ui.pop?.type === 'status' && /^[1-5]$/.test(e.key)) { A.popPick({ dataset: { v: STATUSES[+e.key - 1].id } }); return; }
  const k = e.key;
  if (gPending && Date.now() - gPending < 1200) {
    gPending = 0; const map = { h: 'home', t: 'mytasks', p: 'projects', i: 'inbox', c: 'calendar', s: 'settings', n: 'notifications', a: 'activity', m: 'members' };
    if (map[k.toLowerCase()]) { e.preventDefault(); go(map[k.toLowerCase()]); } return;
  }
  if (S.ui.modals.length) return;
  if (k === 'g' || k === 'G') { gPending = Date.now(); return; }
  if (k === '/') { e.preventDefault(); A.openSearch(); return; }
  if (k === 'n' || k === 'N') { e.preventDefault(); A.newTask(); return; }
  if (k === 'p' || k === 'P') { e.preventDefault(); A.newProject(); return; }
  if (k === '?') { e.preventDefault(); A.shortcuts(); return; }
  if (k === '[') { e.preventDefault(); A.toggleSide(); return; }
  if ((k === 'e' || k === 'E') && S.ui.drawer) { e.preventDefault(); A.editTask({ dataset: { id: S.ui.drawer } }); return; }
});

/* ---------- drag & drop ---------- */
let DRAG = null;
function clearDropMarks() { $$('.drop-line').forEach(x => x.remove()); $$('.over').forEach(x => x.classList.remove('over')); $$('.drop-before,.drop-after').forEach(x => x.classList.remove('drop-before', 'drop-after')); $$('.dragging').forEach(x => x.classList.remove('dragging')); }
document.addEventListener('dragstart', e => {
  const card = e.target.closest?.('[data-drag-card]'), row = e.target.closest?.('[data-drag-row]'), cal = e.target.closest?.('[data-drag-cal]'), sp = e.target.closest?.('[data-drag-proj]');
  const el = card || row || cal || sp; if (!el) return;
  DRAG = card ? { type: 'card', id: card.dataset.dragCard } : row ? { type: 'row', id: row.dataset.dragRow } : cal ? { type: 'cal', id: cal.dataset.dragCal } : { type: 'proj', id: sp.dataset.dragProj };
  e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', DRAG.id); } catch (x) { }
  const vis = row ? row.closest('.trow') : el;
  if (row) try { e.dataTransfer.setDragImage(vis, 20, 18); } catch (x) { }
  S.ui.pop = null;
  setTimeout(() => vis.classList.add('dragging'), 0);
});
document.addEventListener('dragend', () => { DRAG = null; clearDropMarks(); });
document.addEventListener('dragover', e => {
  const hasFiles = e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  if (hasFiles) { const dz = e.target.closest?.('[data-dropzone],[data-dropzone-task],.drawer'); if (dz) { e.preventDefault(); $$('.dropzone.over').forEach(x => x !== dz && x.classList.remove('over')); dz.classList?.add('over'); } return; }
  if (!DRAG) return;
  if (DRAG.type === 'card') {
    const col = e.target.closest('[data-drop-col]'); if (!col) return; e.preventDefault();
    $$('.bcol.over').forEach(x => x !== col && x.classList.remove('over')); col.classList.add('over');
    const body = col.querySelector('[data-col-body]'); if (!body) return;
    const cards = [...body.querySelectorAll('.kcard:not(.dragging)')];
    const after = cards.find(c => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
    let line = $('.drop-line'); if (!line) { line = document.createElement('div'); line.className = 'drop-line'; }
    const ref = after || body.querySelector('.addcard, .composer');
    if (line.nextSibling !== ref || line.parentNode !== body) body.insertBefore(line, ref);
    DRAG.col = col.dataset.dropCol; DRAG.before = after ? after.dataset.dragCard : null;
  } else if (DRAG.type === 'row') {
    const row = e.target.closest('.trow[data-task-row]'); if (!row || row.dataset.taskRow === DRAG.id) return; e.preventDefault();
    const r = row.getBoundingClientRect(); const before = e.clientY < r.top + r.height / 2;
    $$('.drop-before,.drop-after').forEach(x => x.classList.remove('drop-before', 'drop-after'));
    row.classList.add(before ? 'drop-before' : 'drop-after');
    DRAG.target = row.dataset.taskRow; DRAG.pos = before ? 'before' : 'after'; DRAG.group = row.dataset.group; DRAG.lkey = row.dataset.lkey;
  } else if (DRAG.type === 'cal') {
    const day = e.target.closest('[data-drop-day]'); if (!day) return; e.preventDefault();
    $$('.over').forEach(x => x !== day && x.classList.remove('over')); day.classList.add('over'); DRAG.day = day.dataset.dropDay;
  } else if (DRAG.type === 'proj') {
    const it = e.target.closest('[data-proj-drop]'); if (!it) return; e.preventDefault();
    $$('.drop-before').forEach(x => x.classList.remove('drop-before')); it.querySelector('.sitem')?.classList.add('drop-before'); DRAG.before = it.dataset.projDrop;
  }
});
document.addEventListener('dragleave', e => { const dz = e.target.closest?.('.dropzone'); if (dz && !dz.contains(e.relatedTarget)) dz.classList.remove('over'); });
document.addEventListener('drop', e => {
  const files = e.dataTransfer?.files;
  if (files && files.length && !DRAG) {
    const dz = e.target.closest?.('[data-dropzone],[data-dropzone-task],.drawer'); if (!dz) return; e.preventDefault(); clearDropMarks();
    if (dz.dataset.dropzone) handleFiles(files, { project: dz.dataset.dropzone });
    else { const t = task(dz.dataset.dropzoneTask || S.ui.drawer); if (t) handleFiles(files, { project: t.project, task: t.id }); }
    return;
  }
  if (!DRAG) return; e.preventDefault();
  const d = DRAG; DRAG = null; clearDropMarks();
  if (d.type === 'card' && d.col) {
    const t = task(d.id);
    const colTs = D().tasks.filter(x => x.status === d.col && x.id !== t.id && !x.archived).sort((a, b) => a.order - b.order);
    let order;
    if (d.before) { const i = colTs.findIndex(x => x.id === d.before); const prev = colTs[i - 1]; const nx = colTs[i]; order = prev ? (prev.order + nx.order) / 2 : nx.order - 1; }
    else order = colTs.length ? colTs[colTs.length - 1].order + 1 : t.order;
    const moved = t.status !== d.col;
    fxSet({ moved: t.id });
    mutate(() => { t.order = order; if (moved) applyPatch(t, { status: d.col }); });
    if (moved) toast(`Moved “${t.title}” to ${ST[d.col].name}`, { ms: 2200 });
  } else if (d.type === 'row' && d.target) {
    const t = task(d.id), tg = task(d.target); const key = d.lkey; const v = key ? viewOf(key) : null;
    const all = D().tasks.filter(x => !x.archived && x.id !== t.id).sort((a, b) => a.order - b.order);
    const i = all.findIndex(x => x.id === tg.id);
    const nb = d.pos === 'before' ? all[i - 1] : all[i + 1];
    const order = nb ? (tg.order + nb.order) / 2 : tg.order + (d.pos === 'before' ? -1 : 1);
    const patch = {};
    if (v && d.group) { const g = v.group; if (g === 'status' && ST[d.group]) patch.status = d.group; if (g === 'priority' && PR[d.group]) patch.priority = d.group; if (g === 'assignee') patch.assignee = d.group === 'none' ? null : d.group; if (g === 'project' && proj(d.group)) patch.project = d.group; }
    let switched = false;
    mutate(() => { t.order = order; applyPatch(t, patch); if (v && v.sort.f !== 'manual') { v.sort = { f: 'manual', dir: 1 }; switched = true; } });
    if (switched) toast('Sorted manually to keep your order', { kind: 'info', ms: 2200 });
  } else if (d.type === 'cal' && d.day) {
    const t = task(d.id); if (t.due === d.day) return;
    const len = t.start && t.due ? diffD(parse(t.due), parse(t.start)) : null; fxSet({ moved: t.id });
    updateTask(t.id, { due: d.day, ...(len != null ? { start: iso(addD(parse(d.day), -len)) } : {}) });
    toast(`Rescheduled “${t.title}” to ${fmtDate(d.day)}`, { ms: 2200 });
  } else if (d.type === 'proj' && d.before && d.before !== d.id) {
    const o = D().projOrder.filter(x => x !== d.id); o.splice(o.indexOf(d.before), 0, d.id); D().projOrder = o; save(); render();
  }
});

/* timeline bar drag + table column resize (pointer events) */
document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const rz = e.target.closest?.('[data-rsz]');
  if (rz) {
    e.preventDefault(); e.stopPropagation();
    const c = rz.dataset.rsz, key = rz.dataset.key, v = viewOf(key);
    const col = $(`col[data-col="${c}"]`); const tbl = rz.closest('table'); const w0 = col.getBoundingClientRect().width || parseFloat(col.style.width); const tw0 = tbl.getBoundingClientRect().width; const x0 = e.clientX;
    rz.classList.add('on');
    const mv = ev => { const w = Math.max(64, w0 + ev.clientX - x0); col.style.width = w + 'px'; tbl.style.width = (tw0 + w - w0) + 'px'; };
    const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); v.colW[c] = Math.max(64, Math.round(w0 + ev.clientX - x0)); save(); S.ui.justResized = true; setTimeout(() => { S.ui.justResized = false; }, 60); render(); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
    return;
  }
  const b = e.target.closest?.('[data-bar]'); if (!b) return;
  const x0 = e.clientX; const l0 = parseFloat(b.style.left); const dw = +b.dataset.dw; let moved = false;
  const mv = ev => { const dx = ev.clientX - x0; if (Math.abs(dx) > 4) { moved = true; b.classList.add('dragging'); } if (moved) b.style.left = (l0 + Math.round(dx / dw) * dw) + 'px'; };
  const up = ev => {
    removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
    if (!moved) return;
    S.ui.suppressClick = true; setTimeout(() => { S.ui.suppressClick = false; }, 60);
    const days = Math.round((ev.clientX - x0) / dw); const t = task(b.dataset.bar);
    if (!days) { render(); return; }
    updateTask(t.id, { due: iso(addD(parse(t.due), days)), start: t.start ? iso(addD(parse(t.start), days)) : null });
    toast(`Moved “${t.title}” ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} ${days > 0 ? 'later' : 'earlier'}`, { ms: 2200 });
  };
  addEventListener('pointermove', mv); addEventListener('pointerup', up);
});

