/* =====================================================================
   COMPLETION: teams (create / edit / delete), subtask detail view, archive
   ===================================================================== */

/* ---------- teams become workspace data (were a fixed constant) ---------- */
const NO_TEAM = { id: '', name: 'No team', icon: 'users', c: '#8A867E', desc: '' };
function teamsList() { const d = D(); if (!d.teams) d.teams = TEAMS_SEED.map(t => ({ ...t })); return d.teams; }
function team(id) { return teamsList().find(t => t.id === id) || null; }
const TM = new Proxy({}, { get: (_, k) => team(k) || NO_TEAM });

function teamModal(m, H) {
  const f = S.ui.tform; const err = S.ui.errors.tname;
  const people = D().members.filter(x => x.status !== 'deactivated');
  return `${H(m.edit ? 'Edit team' : 'New team', m.edit ? '' : 'Teams group the people who work on projects together.')}
  <form class="modal-b" data-submit="submitTeam">
    <div class="row" style="gap:10px;align-items:flex-start">
      <span class="picon lg" style="--c:${PCOLORS[f.color]};margin-top:22px" aria-hidden="true">${ic(f.icon, 18)}</span>
      <div class="field grow"><label class="label" for="tm-name">Team name</label><input class="input ${err ? 'is-error' : ''}" id="tm-name" data-in="tform" data-f="name" value="${esc(f.name)}" placeholder="e.g. Growth" autofocus aria-invalid="${!!err}" aria-describedby="tm-name-err">${err ? `<span class="err" id="tm-name-err" role="alert">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    </div>
    <div class="field"><label class="label" for="tm-desc">What does this team own?</label><input class="input" id="tm-desc" data-in="tform" data-f="desc" value="${esc(f.desc)}" placeholder="e.g. Acquisition experiments and lifecycle email"></div>
    <div class="row" style="gap:16px;align-items:flex-start;flex-wrap:wrap">
      <div class="field" style="flex:1;min-width:220px"><span class="label" id="tm-icon-l">Icon</span><div class="iconpick" role="radiogroup" aria-labelledby="tm-icon-l">${PICONS.map(i => `<button type="button" role="radio" aria-checked="${f.icon === i}" class="${f.icon === i ? 'on' : ''}" data-a="tformSet" data-f="icon" data-v="${i}" aria-label="${i}">${ic(i, 15)}</button>`).join('')}</div></div>
      <div class="field"><span class="label" id="tm-color-l">Color</span><div class="swatches" role="radiogroup" aria-labelledby="tm-color-l" style="max-width:140px">${Object.entries(PCOLORS).map(([k, v]) => `<button type="button" role="radio" aria-checked="${f.color === k}" class="sw ${f.color === k ? 'on' : ''}" style="--c:${v};width:22px;height:22px" data-a="tformSet" data-f="color" data-v="${k}" aria-label="${k}">${f.color === k ? ic('check', 12) : ''}</button>`).join('')}</div></div>
    </div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Members <span class="faint" style="font-weight:400">· ${f.members.length} selected</span></legend>
      <div class="panel" style="max-height:220px;overflow-y:auto;padding:4px">${people.map(x => `<label class="mi" style="cursor:pointer;min-height:36px"><input type="checkbox" class="check" data-a="tformMember" data-id="${x.id}" ${f.members.includes(x.id) ? 'checked' : ''}>${av(x.id, 'sm', false)}<span class="grow trunc">${esc(x.name)}</span><span class="r">${x.team && x.team !== m.edit ? esc(TM[x.team].name) : ''}</span></label>`).join('')}</div>
      <span class="hint">Everyone belongs to one primary team. Adding someone here moves them from their current team.</span></fieldset>
  </form>
  <div class="modal-f">${m.edit ? `<button class="btn btn-danger-ghost" data-a="delTeam" data-id="${m.edit}">${ic('trash-2', 14)}Delete team</button>` : ''}<span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="submitTeam">${m.edit ? 'Save changes' : 'Create team'}</button></div>`;
}
A.newTeam = () => { S.ui.pop = null; S.ui.errors = {}; S.ui.tform = { name: '', desc: '', icon: 'users', color: 'teal', members: [] }; openModal({ type: 'team' }); };
A.editTeam = el => { const t = team(el.dataset.id); if (!t) return; S.ui.pop = null; S.ui.errors = {}; S.ui.tform = { name: t.name, desc: t.desc, icon: t.icon, color: Object.keys(PCOLORS).find(k => PCOLORS[k] === t.c) || 'slate', members: D().members.filter(m => m.team === t.id).map(m => m.id) }; openModal({ type: 'team', edit: t.id }); };
IN.tform = el => { S.ui.tform[el.dataset.f] = el.value; if (el.dataset.f === 'name' && S.ui.errors.tname && el.value.trim()) { S.ui.errors.tname = null; render(); } };
A.tformSet = el => { S.ui.tform[el.dataset.f] = el.dataset.v; render(); };
A.tformMember = el => { const l = S.ui.tform.members; const id = el.dataset.id; S.ui.tform.members = l.includes(id) ? l.filter(x => x !== id) : [...l, id]; render(); };
A.submitTeam = () => {
  const m = S.ui.modals[S.ui.modals.length - 1]; const f = S.ui.tform;
  f.name = ($('#tm-name')?.value || '').trim(); f.desc = ($('#tm-desc')?.value || '').trim();
  if (!f.name) { S.ui.errors.tname = 'Give the team a name'; render(); $('#tm-name')?.focus(); return; }
  if (teamsList().some(t => t.name.toLowerCase() === f.name.toLowerCase() && t.id !== m.edit)) { S.ui.errors.tname = `A team called “${f.name}” already exists`; render(); $('#tm-name')?.focus(); return; }
  let t;
  const ok = mutate(() => {
    if (m.edit) { t = team(m.edit); Object.assign(t, { name: f.name, desc: f.desc, icon: f.icon, c: PCOLORS[f.color] }); D().members.forEach(x => { if (x.team === t.id && !f.members.includes(x.id)) x.team = ''; }); }
    else { t = { id: uid('tm'), name: f.name, desc: f.desc || 'No description yet.', icon: f.icon, c: PCOLORS[f.color] }; teamsList().push(t); }
    f.members.forEach(id => { const x = mem(id); if (x) x.team = t.id; });
  });
  if (!ok) return;
  S.ui.modals.pop();
  if (m.edit) { render(); toast(`Saved ${t.name}`); } else { go('team', { id: t.id }); toast(`Created ${t.name}`); }
};
A.delTeam = el => {
  const t = team(el.dataset.id); const n = D().members.filter(x => x.team === t.id).length; const np = D().projects.filter(p => p.team === t.id).length;
  S.ui.modals.pop();
  confirmDlg({ title: `Delete ${t.name}?`, body: `${n ? `<b>${n} member${n > 1 ? 's' : ''}</b> will have no team` : 'The team has no members'}${np ? ` and <b>${np} project${np > 1 ? 's' : ''}</b> will need a new team` : ''}. People and projects are not deleted.`, ok: 'Delete team', danger: true, icon: 'users', run: () => { const snap = snapshot(); if (mutate(() => { D().teams = teamsList().filter(x => x !== t); D().members.forEach(x => { if (x.team === t.id) x.team = ''; }); D().projects.forEach(p => { if (p.team === t.id) p.team = ''; }); })) { if (S.ui.route === 'team') go('teams'); toast(`Deleted ${t.name}`, { action: 'Undo', onAction: () => restore(snap) }); } } });
};

/* ---------- subtask detail view (inside the task drawer) ---------- */
function subtaskHtml(t, s) {
  const i = t.subtasks.indexOf(s);
  return `<div class="subview">
    <button class="pillbtn" data-a="closeSub" style="margin:-4px 0 14px -7px;font-size:12.5px;color:var(--text-2)">${ic('arrow-left', 14)}<span class="trunc" style="max-width:420px">${esc(t.title)}</span></button>
    <div class="row" style="gap:10px;align-items:flex-start">
      <input type="checkbox" class="check round" style="margin-top:9px" ${s.done ? 'checked' : ''} data-a="toggleSub" data-id="${t.id}" data-sid="${s.id}" aria-label="${s.done ? 'Mark subtask not done' : 'Mark subtask done'}">
      <textarea class="ttl-edit" id="s-title" rows="1" data-autosize data-blur="commitSubTitle" data-key-enter="blur" data-id="${t.id}" data-sid="${s.id}" aria-label="Subtask title" style="${s.done ? 'text-decoration:line-through;color:var(--text-3)' : ''}">${esc(s.title)}</textarea>
    </div>
    <div class="faint" style="font-size:12px;margin:4px 0 0 26px">Subtask ${i + 1} of ${t.subtasks.length} · ${s.done ? 'Done' : 'Open'}</div>
    <dl class="kv" style="margin-top:16px">
      <dt>${ic('user', 14)}Assignee</dt><dd><button class="pillbtn ${s.assignee ? '' : 'empty'}" data-a="pop" data-pop="subassignee" data-id="${t.id}" data-i="${i}">${av(s.assignee, 'sm', false)}<span>${s.assignee ? esc(mem(s.assignee)?.name) : 'Unassigned'}</span></button></dd>
      <dt>${ic('calendar', 14)}Due date</dt><dd><button class="pillbtn ${s.due ? '' : 'empty'}" data-a="pop" data-pop="date" data-field="subdue" data-id="${t.id}" data-i="${i}">${ic('calendar', 13)}<span class="num">${s.due ? relDate(s.due) : 'Set date'}</span></button></dd>
      <dt>${ic('folder', 14)}Parent</dt><dd><button class="pillbtn" data-a="closeSub"><span class="mono faint" style="font-size:11px">${t.key}</span>${esc(t.title)}</button></dd>
    </dl>
    <div class="dsec"><div class="dsec-h"><h3 id="s-note-l">Notes</h3></div>
      <textarea class="textarea" id="s-note" data-in="subNote" data-id="${t.id}" data-sid="${s.id}" rows="4" placeholder="Add details, links, or acceptance criteria…" aria-labelledby="s-note-l">${esc(s.note || '')}</textarea></div>
    <div class="dsec row" style="gap:6px;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" data-a="promoteSub" data-id="${t.id}" data-sid="${s.id}">${ic('arrow-up-right', 13)}Convert to task</button>
      <span class="sp"></span>
      <button class="btn btn-sm btn-ghost" data-a="subNav" data-id="${t.id}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Previous subtask">${ic('chevron-left', 14)}Previous</button>
      <button class="btn btn-sm btn-ghost" data-a="subNav" data-id="${t.id}" data-d="1" ${i === t.subtasks.length - 1 ? 'disabled' : ''} aria-label="Next subtask">Next${ic('chevron-right', 14)}</button>
      <button class="btn btn-sm btn-danger-ghost" data-a="rmSub" data-id="${t.id}" data-sid="${s.id}">${ic('trash-2', 13)}Delete</button>
    </div>
  </div>`;
}
const subOf = (t, sid) => t && t.subtasks.find(s => s.id === sid);
A.openSub = el => { S.ui.subOpen = { tid: el.dataset.id, sid: el.dataset.sid }; S.ui.pop = null; render(); setTimeout(() => $('#s-title')?.focus(), 0); };
A.closeSub = () => { S.ui.lastSub = S.ui.subOpen?.sid; S.ui.subOpen = null; render(); };
const _rmSub = A.rmSub; A.rmSub = el => { if (S.ui.subOpen?.sid === el.dataset.sid) { S.ui.subOpen = null; } _rmSub(el); };
A.subNav = el => { const t = task(el.dataset.id); const i = t.subtasks.findIndex(s => s.id === S.ui.subOpen?.sid) + +el.dataset.d; if (t.subtasks[i]) { S.ui.subOpen = { tid: t.id, sid: t.subtasks[i].id }; render(); } };
BLUR.commitSubTitle = el => { const t = task(el.dataset.id); const s = subOf(t, el.dataset.sid); const v = el.value.trim(); if (s && v && v !== s.title) mutate(() => { s.title = v; t.updated = Date.now(); }); };
IN.subNote = el => { const t = task(el.dataset.id); const s = subOf(t, el.dataset.sid); if (s) { s.note = el.value; save(); } };
A.promoteSub = el => {
  const t = task(el.dataset.id); const s = subOf(t, el.dataset.sid); if (!s) return; let n;
  if (!mutate(() => { n = createTask({ title: s.title, project: t.project, status: s.done ? 'done' : 'todo', assignee: s.assignee || t.assignee, priority: t.priority, due: s.due || null, labels: [...t.labels], desc: s.note ? `<p>${esc(s.note)}</p>` : '' }); t.subtasks = t.subtasks.filter(x => x !== s); logAct('converted a subtask of', t, `into ${n.key}`); })) return;
  S.ui.subOpen = null; render();
  toast(`Converted to ${n.key}`, { action: 'Open', onAction: () => A.openTask({ dataset: { id: n.id } }) });
};

/* ---------- archive ---------- */
function pageArchive() {
  const tab = S.ui.archTab || 'tasks';
  const ts = D().tasks.filter(t => t.archived && canSee(proj(t.project)) && !proj(t.project)?.archived).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  const ps = D().projects.filter(p => p.archived);
  const row = (lead, title, sub, when, restoreAct, delAct, id) => `<div class="mini" style="min-height:52px;cursor:default;gap:12px">${lead}<div class="grow" style="min-width:0"><div class="trunc" style="font-weight:500">${title}</div><div class="faint trunc" style="font-size:12px">${sub}</div></div><span class="faint hide-m" style="font-size:12px;white-space:nowrap">${when}</span><button class="btn btn-secondary btn-sm" data-a="${restoreAct}" data-id="${id}">${ic('rotate-ccw', 13)}Restore</button><button class="ibtn ibtn-sm" data-a="${delAct}" data-id="${id}" data-tip="Delete permanently" aria-label="Delete permanently" style="color:var(--red)">${ic('trash-2', 15)}</button></div>`;
  const body = tab === 'tasks'
    ? (ts.length ? `<div class="panel" style="overflow:hidden">${ts.map(t => { const p = proj(t.project); return row(stIcon(t.status, 15), esc(t.title), `<span class="mono">${t.key}</span> · ${esc(p.name)}`, t.archivedAt ? 'Archived ' + ago(t.archivedAt) : 'Archived', 'restoreTask', 'purgeTask', t.id); }).join('')}</div>`
      : `<div class="panel">${empty('archive', 'No archived tasks', 'Archive finished or abandoned tasks to keep boards focused. They wait here until you restore them.', '')}</div>`)
    : (ps.length ? `<div class="panel" style="overflow:hidden">${ps.map(p => row(pIcon(p, '', 14), esc(p.name), `${D().tasks.filter(t => t.project === p.id).length} tasks · ${PSTAT[p.status].name}`, p.archivedAt ? 'Archived ' + ago(p.archivedAt) : 'Archived', 'restoreProject', 'delProject', p.id)).join('')}</div>`
      : `<div class="panel">${empty('archive', 'No archived projects', 'Archived projects disappear from the sidebar and project lists but keep every task, file, and comment.', '')}</div>`);
  return `<div class="page" style="max-width:900px">
    <div class="ph"><div><h1>Archive</h1><p>Archived work is hidden everywhere else. Restore it any time, or delete it for good.</p></div></div>
    <div class="tabs" style="margin-bottom:14px" role="tablist" aria-label="Archive">${[['tasks', 'Tasks', ts.length], ['projects', 'Projects', ps.length]].map(([k, n, c]) => `<button role="tab" aria-selected="${tab === k}" class="tab ${tab === k ? 'on' : ''}" data-a="set" data-k="archTab" data-v="${k}">${n}<span class="cnt">${c}</span></button>`).join('')}</div>
    ${body}
  </div>`;
}
A.restoreTask = el => { const t = task(el.dataset.id); if (mutate(() => { t.archived = false; t.archivedAt = null; logAct('restored', t); })) toast(`Restored “${t.title}”`, { action: 'Open', onAction: () => A.openTask({ dataset: { id: t.id } }) }); };
A.purgeTask = el => { const t = task(el.dataset.id); confirmDlg({ title: 'Delete task permanently?', body: `<b>${esc(t.title)}</b>, its subtasks, comments, and attachments will be deleted for everyone. This can't be undone.`, ok: 'Delete permanently', danger: true, run: () => { if (mutate(() => deleteTasks([t.id]))) toast(`Deleted “${t.title}”`); } }); };
