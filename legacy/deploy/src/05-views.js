/* =====================================================================
   PROJECT PAGE + VIEWS: overview, board, list, table, calendar, timeline, files, activity
   ===================================================================== */
const PTABS = [['overview', 'Overview', 'layout-dashboard'], ['board', 'Board', 'square-kanban'], ['list', 'List', 'list'], ['table', 'Table', 'table-2'], ['calendar', 'Calendar', 'calendar'], ['timeline', 'Timeline', 'chart-gantt'], ['files', 'Files', 'paperclip'], ['activity', 'Activity', 'activity']];

function pageProject() {
  const p = proj(S.ui.params.id);
  if (!p) return page404();
  if (!canSee(p)) return stateDenied(p);
  const tab = S.ui.params.tab || 'board';
  const views = D().savedViews.filter(v => v.project === p.id);
  let body = '';
  const key = 'p:' + p.id;
  const ts = tasksOf(p.id);
  if (tab.startsWith('v:')) {
    const sv = views.find(v => 'v:' + v.id === tab);
    if (!sv) body = page404();
    else {
      const k = 'sv:' + sv.id;
      if (!S.views[k]) { viewOf(k); S.views[k].filters = JSON.parse(JSON.stringify(sv.filters)); }
      body = taskViewBody(sv.type, applyView(ts, viewOf(k)), k, p);
    }
  } else if (tab === 'overview') body = projOverview(p);
  else if (tab === 'files') body = filesHtml(p.id);
  else if (tab === 'activity') body = projActivity(p);
  else body = taskViewBody(tab, applyView(ts, viewOf(key)), key, p);

  return `<div class="page flush">
    <div class="proj-h">
      <div class="t">
        ${pIcon(p, 'lg', 18)}
        <h1>${esc(p.name)}</h1>
        <button class="ibtn ibtn-sm" data-a="toggleFavProj" data-id="${p.id}" data-tip="${p.fav ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${p.fav}" aria-label="Favorite" style="${p.fav ? 'color:var(--amber)' : ''}">${ic('star', 15)}</button>
        <button class="pillbtn bordered" data-a="pop" data-pop="pstatus" data-id="${p.id}" aria-label="Project status" style="height:24px"><span class="pdot" style="--c:${PSTAT[p.status].c};border-radius:50%;width:7px;height:7px"></span>${PSTAT[p.status].name}${ic('chevron-down', 12)}</button>
        <span class="sp"></span>
        <div class="row" style="gap:4px">
          <button class="row" data-a="share" data-id="${p.id}" aria-label="Members" style="gap:0">${avStack(p.members, 5, 'md')}</button>
          <button class="ibtn ibtn-sm" data-a="share" data-id="${p.id}" data-tip="Add member" aria-label="Add member">${ic('user-plus', 15)}</button>
          <button class="btn btn-secondary btn-sm hide-m" data-a="share" data-id="${p.id}">${ic('share-2', 13)}Share</button>
          <button class="ibtn ibtn-sm" data-a="editProject" data-id="${p.id}" data-tip="Project settings" aria-label="Project settings">${ic('settings', 15)}</button>
          <button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="More">${ic('ellipsis', 15)}</button>
        </div>
      </div>
      <nav class="tabs" aria-label="Project views">
        ${PTABS.map(([k, n, i]) => `<button ${tab === k ? 'aria-current="page"' : ''} class="tab ${tab === k ? 'on' : ''}" data-a="go" data-r="project" data-id="${p.id}" data-tab="${k}">${ic(i, 14)}${n}</button>`).join('')}
        ${views.map(v => `<button ${tab === 'v:' + v.id ? 'aria-current="page"' : ''} class="tab ${tab === 'v:' + v.id ? 'on' : ''}" data-a="go" data-r="project" data-id="${p.id}" data-tab="v:${v.id}" data-ctx="savedview" data-vid="${v.id}">${ic('list-filter', 14)}${esc(v.name)}</button>`).join('')}
        <button class="tab" data-a="saveView" data-id="${p.id}" data-tip="Save current filters as a view" aria-label="Save view">${ic('plus', 14)}</button>
      </nav>
    </div>
    <div class="pbody${S.ui.fx.tab ? ' fx-tab' : ''}">${body}</div>
  </div>`;
}
function taskViewBody(type, ts, key, p) {
  const v = viewOf(key);
  const addBtn = `<button class="btn btn-primary btn-sm" data-a="newTask" data-project="${p.id}">${ic('plus', 13)}New task</button>`;
  const noTasks = !tasksOf(p.id).length;
  const emptyAll = empty('list-checks', 'No tasks here', 'Add a task to get things moving.', `<button class="btn btn-primary btn-sm" data-a="newTask" data-project="${p.id}">${ic('plus', 14)}Add task</button>`);
  const emptyFilter = empty('search-x', 'No results found', 'No tasks match these filters.', `<button class="btn btn-secondary btn-sm" data-a="clearFilters" data-key="${key}">Clear filters</button>`);
  if (type === 'board') return viewToolbar(key, { group: false, right: addBtn }) + (noTasks ? emptyAll : boardHtml(ts, key, { project: p.id }));
  if (type === 'list') return viewToolbar(key, { right: addBtn }) + `<div style="padding:0 20px 90px">${noTasks ? emptyAll : !ts.length ? emptyFilter : listHtml(groupTasks(ts, v.group), key, { project: p.id })}</div>`;
  if (type === 'table') return viewToolbar(key, { cols: true, right: addBtn }) + (noTasks ? emptyAll : tableHtml(ts, key, p));
  if (type === 'calendar') return viewToolbar(key, { group: false, right: addBtn }) + calendarHtml(ts, { key, project: p.id, events: true });
  if (type === 'timeline') return viewToolbar(key, { group: false, right: addBtn, extra: tlControls(key) }) + timelineHtml(ts, key, p);
  return page404();
}

/* ---------- OVERVIEW ---------- */
function projOverview(p) {
  const ts = tasksOf(p.id); const pr = progressOf(p.id);
  const cnt = STATUSES.map(s => ({ s, n: ts.filter(t => t.status === s.id).length }));
  const over = ts.filter(isOver);
  const soon = sortTasks(ts.filter(t => t.status !== 'done' && t.due), { f: 'due', dir: 1 }).slice(0, 6);
  const acts = D().activity.filter(a => a.project === p.id).slice(0, 6);
  const daysLeft = diffD(parse(p.due), TODAY);
  return `<div class="page" style="max-width:1160px;padding-top:22px">
    <div class="grid2">
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>About</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="editProject" data-id="${p.id}">${ic('pencil', 13)}Edit</button></div></div><div class="panel-b" style="font-size:14px;line-height:1.6;color:var(--text)">${esc(p.desc)}</div></section>
        <section class="panel"><div class="panel-h"><h2>Progress</h2><div class="acts"><span class="faint" style="font-size:12px">${ts.filter(t => t.status === 'done').length} of ${ts.length} tasks done</span></div></div>
          <div class="panel-b">
            <div class="row" style="align-items:baseline;gap:10px;margin-bottom:10px"><span style="font-size:30px;font-weight:600;letter-spacing:-.03em" class="num">${pr}%</span><span class="muted">${daysLeft >= 0 ? `${daysLeft} days until ${fmtDate(p.due)}` : `Ended ${fmtDate(p.due)}`}</span>${over.length ? `<span class="badge red">${ic('clock-alert', 11)}${over.length} overdue</span>` : ''}</div>
            <div class="stackbar" style="height:8px;margin-bottom:12px">${cnt.map(c => `<i style="width:${c.n / Math.max(ts.length, 1) * 100}%;background:var(--st-${c.s.id})" title="${c.s.name}: ${c.n}"></i>`).join('')}</div>
            <div class="row" style="flex-wrap:wrap;gap:14px;font-size:12.5px">${cnt.map(c => `<button class="row" style="gap:5px" data-a="goFilteredList" data-id="${p.id}" data-st="${c.s.id}">${stIcon(c.s.id, 12)}<span class="muted">${c.s.name}</span><b class="num" style="font-weight:600">${c.n}</b></button>`).join('')}</div>
          </div></section>
        <section class="panel"><div class="panel-h"><h2>Coming up</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="project" data-id="${p.id}" data-tab="list">View list</button></div></div>${soon.map(t => miniRow(t, { noProj: true })).join('') || empty('circle-check', 'Nothing scheduled', 'Tasks with due dates will show up here.', '', 'sm')}</section>
      </div>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>Details</h2></div><div class="panel-b"><dl class="kv">
          <dt>${ic('circle-dot', 14)}Status</dt><dd><button class="pillbtn" data-a="pop" data-pop="pstatus" data-id="${p.id}">${pStatus(p.status)}</button></dd>
          <dt>${ic('user', 14)}Lead</dt><dd><span class="pillbtn">${av(p.lead, 'sm', false)}${esc(mem(p.lead)?.name)}</span></dd>
          <dt>${ic('users', 14)}Team</dt><dd><button class="pillbtn" data-a="go" data-r="team" data-id="${p.team}">${ic(TM[p.team].icon, 13)}${TM[p.team].name}</button></dd>
          <dt>${ic('calendar', 14)}Start</dt><dd><span class="pillbtn num">${fmtDate(p.start, true)}</span></dd>
          <dt>${ic('flag', 14)}Due</dt><dd><span class="pillbtn num">${fmtDate(p.due, true)}</span></dd>
          <dt>${ic('user-plus', 14)}Members</dt><dd><button class="pillbtn" data-a="share" data-id="${p.id}">${avStack(p.members, 6)}<span class="faint">${p.members.length}</span></button></dd>
        </dl></div></section>
        <section class="panel"><div class="panel-h"><h2>Milestones</h2></div><div class="panel-b">${(p.milestones || []).map(m => { const n = diffD(parse(m.date), TODAY); return `<div class="row" style="height:32px;font-size:13px"><span style="width:9px;height:9px;transform:rotate(45deg);border-radius:2px;flex-shrink:0;margin:0 3px;background:${n < 0 ? 'var(--green)' : pColor(p)}"></span><span class="grow trunc ${n < 0 ? 'faint' : ''}">${esc(m.name)}</span><span class="num muted">${fmtDate(m.date)}</span></div>`; }).join('') || '<span class="faint">No milestones yet</span>'}</div></section>
        <section class="panel"><div class="panel-h"><h2>Recent activity</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="project" data-id="${p.id}" data-tab="activity">View all</button></div></div><div class="panel-b feed">${acts.map(a => actHtml(a)).join('') || '<span class="faint">No activity yet</span>'}</div></section>
      </div>
    </div>
  </div>`;
}
function projActivity(p) {
  const as = D().activity.filter(a => a.project === p.id);
  const cs = D().comments.filter(c => task(c.task)?.project === p.id).map(c => ({ id: c.id, by: c.by, verb: 'commented on', task: c.task, project: p.id, at: c.at, extra: '' }));
  const all = [...as, ...cs].sort((a, b) => b.at - a.at);
  const b = {}; all.forEach(a => (b[dayBucket(a.at)] ||= []).push(a));
  return `<div class="page" style="max-width:780px;padding-top:18px">${all.length ? Object.entries(b).map(([k, list]) => `<div class="day-h">${k}</div><div class="feed lined">${list.map(a => actHtml(a)).join('')}</div>`).join('') : empty('activity', 'No activity yet', 'Changes to this project will appear here.')}</div>`;
}

/* ---------- BOARD ---------- */
function kcard(t, opt = {}) {
  const cc = commentsOf(t.id).length; const ac = t.attachments.length; const sd = t.subtasks.filter(s => s.done).length;
  const p = proj(t.project);
  return `<div class="kcard ${t.status === 'done' ? 'done' : ''}${fxc('done', t.id)}${fxc('added', t.id)}${fxc('moved', t.id)}" draggable="true" data-drag-card="${t.id}" data-a="openTask" data-id="${t.id}" data-ctx="task" role="button" tabindex="0" aria-label="${esc(t.title)}">
    ${t.labels.length ? `<div class="labels">${t.labels.map(lbl).join('')}</div>` : ''}
    <div class="top">${t.status === 'done' ? `<span class="done-ic" style="margin:2px 7px 0 0;display:inline-flex" aria-label="Done">${stIcon('done', 14)}</span>` : ''}<div class="title">${esc(t.title)}</div></div>
    ${t.subtasks.length ? `<div class="subp">${ic('list-checks', 12)}<span class="num">${sd}/${t.subtasks.length}</span>${progBar(Math.round(sd / t.subtasks.length * 100), sd === t.subtasks.length ? 'green' : '')}</div>` : ''}
    <div class="meta">
      ${opt.showProj ? `<span class="m" data-tip="${esc(p.name)}"><span class="pdot" style="--c:${pColor(p)}"></span></span>` : ''}
      <span class="key">${t.key}</span>
      <button class="m" data-a="pop" data-pop="priority" data-id="${t.id}" data-tip="${PR[t.priority].name}" aria-label="Priority: ${PR[t.priority].name}">${prIcon(t.priority, 13)}</button>
      ${t.due ? `<button class="m" data-a="pop" data-pop="date" data-field="due" data-id="${t.id}" aria-label="Due date">${dueHtml(t)}</button>` : ''}
      ${t.recur ? `<span class="m" data-tip="Repeats ${t.recur.toLowerCase()}">${ic('repeat', 12)}</span>` : ''}
      ${cc ? `<span class="m" aria-label="${cc} comments">${ic('message-square', 12)}${cc}</span>` : ''}
      ${ac ? `<span class="m" aria-label="${ac} attachments">${ic('paperclip', 12)}${ac}</span>` : ''}
      <button class="m" data-a="pop" data-pop="assignee" data-id="${t.id}" style="margin-left:auto" aria-label="Assignee">${av(t.assignee, 'sm')}</button>
    </div>
    <div class="hacts"><button class="ibtn ibtn-xs" data-a="toggleDone" data-id="${t.id}" data-tip="${t.status === 'done' ? 'Reopen' : 'Mark complete'}" aria-label="${t.status === 'done' ? 'Reopen' : 'Mark complete'}">${ic(t.status === 'done' ? 'rotate-ccw' : 'check', 13)}</button><button class="ibtn ibtn-xs" data-a="editTask" data-id="${t.id}" data-tip="Quick edit" aria-label="Quick edit">${ic('pencil', 12)}</button><button class="ibtn ibtn-xs" data-a="ctxBtn" data-ctx="task" data-id="${t.id}" aria-label="More">${ic('ellipsis', 13)}</button></div>
  </div>`;
}
function boardHtml(ts, key, opt = {}) {
  return `<div class="board" data-keep="board:${key}">${STATUSES.map(s => {
    const col = ts.filter(t => t.status === s.id).sort((a, b) => a.order - b.order);
    const ck = key + ':' + s.id;
    if (S.ui.collapsedCols[ck]) return `<div class="bcol collapsed" data-a="toggleCol" data-ck="${ck}" data-drop-col="${s.id}" data-key="${key}" role="button" aria-label="Expand ${s.name}" title="Expand">${stIcon(s.id)}<span class="vname">${s.name}<span class="faint">${col.length}</span></span></div>`;
    const comp = S.ui.composer && S.ui.composer.ctx === key && S.ui.composer.group === s.id;
    return `<section class="bcol" data-drop-col="${s.id}" data-key="${key}" aria-label="${s.name}">
      <div class="bcol-h">${stIcon(s.id)}<span>${s.name}</span><span class="cnt">${col.length}</span>
        <span class="acts"><button class="ibtn ibtn-xs" data-a="startComposer" data-ctx="${key}" data-group="${s.id}" data-gb='${JSON.stringify({ status: s.id, ...(opt.project ? { project: opt.project } : {}) })}' data-tip="Add task" aria-label="Add task to ${s.name}">${ic('plus', 14)}</button><button class="ibtn ibtn-xs" data-a="ctxBtn" data-ctx="column" data-id="${s.id}" data-key="${key}" aria-label="Column options">${ic('ellipsis', 14)}</button></span></div>
      <div class="bcol-b" data-col-body="${s.id}">
        ${col.map(t => kcard(t, { showProj: !opt.project })).join('')}
        ${comp ? `<div class="composer"><textarea id="composer-in" data-key-enter="commitComposer" placeholder="Task name" rows="2" aria-label="New task name"></textarea><div class="row"><span class="faint" style="font-size:11px">Enter to add · Esc to cancel</span><span class="sp"></span><button class="btn btn-sm btn-ghost" data-a="cancelComposer">Cancel</button><button class="btn btn-sm btn-primary" data-a="commitComposer">Add</button></div></div>`
          : `<button class="addcard" data-a="startComposer" data-ctx="${key}" data-group="${s.id}" data-gb='${JSON.stringify({ status: s.id, ...(opt.project ? { project: opt.project } : {}) })}'>${ic('plus', 14)}Add task</button>`}
      </div>
    </section>`;
  }).join('')}</div>`;
}

/* ---------- TABLE ---------- */
const TCOLS = [['title', 'Task', 300], ['status', 'Status', 132], ['priority', 'Priority', 112], ['assignee', 'Assignee', 156], ['due', 'Due date', 112], ['start', 'Start date', 112], ['labels', 'Labels', 180], ['deps', 'Dependencies', 150], ['estimate', 'Estimate', 92], ['created', 'Created', 112], ['project', 'Project', 156]];
function tcell(t, c) {
  const ed = S.ui.editCell && S.ui.editCell.id === t.id && S.ui.editCell.f === c;
  switch (c) {
    case 'title': return ed ? `<td class="sticky editing"><input id="edit-cell" data-blur="commitCell" data-key-enter="commitCell" data-id="${t.id}" data-f="title" value="${esc(t.title)}" aria-label="Title"></td>` : `<td class="sticky cellbtn" data-a="openTask" data-id="${t.id}" data-dbl="editCell" data-f="title" title="Double-click to rename"><span class="row" style="gap:8px">${stIcon(t.status, 13)}<span class="trunc" style="font-weight:450">${esc(t.title)}</span><span class="mono faint" style="font-size:11px;margin-left:auto">${t.key}</span></span></td>`;
    case 'status': return `<td class="cellbtn" data-a="pop" data-pop="status" data-id="${t.id}"><span class="row" style="gap:6px">${stPill(t.status)}</span></td>`;
    case 'priority': return `<td class="cellbtn" data-a="pop" data-pop="priority" data-id="${t.id}"><span class="row" style="gap:6px">${prPill(t.priority)}</span></td>`;
    case 'assignee': return `<td class="cellbtn" data-a="pop" data-pop="assignee" data-id="${t.id}"><span class="row" style="gap:6px">${av(t.assignee, 'sm', false)}<span class="trunc ${t.assignee ? '' : 'faint'}">${esc(mem(t.assignee)?.name || 'Unassigned')}</span></span></td>`;
    case 'due': return `<td class="cellbtn num ${isOver(t) ? '' : ''}" data-a="pop" data-pop="date" data-field="due" data-id="${t.id}" style="${isOver(t) ? 'color:var(--red)' : ''}">${t.due ? fmtDate(t.due) : '<span class="faint">—</span>'}</td>`;
    case 'start': return `<td class="cellbtn num" data-a="pop" data-pop="date" data-field="start" data-id="${t.id}">${t.start ? fmtDate(t.start) : '<span class="faint">—</span>'}</td>`;
    case 'labels': return `<td class="cellbtn" data-a="pop" data-pop="labels" data-id="${t.id}"><span class="row" style="gap:4px">${t.labels.map(lbl).join('') || '<span class="faint">—</span>'}</span></td>`;
    case 'deps': return `<td class="cellbtn" data-a="pop" data-pop="deps" data-id="${t.id}">${t.deps.map(d => task(d) ? `<span class="depchip" title="${esc(task(d).title)}">${task(d).key}</span>` : '').join('') || '<span class="faint">—</span>'}</td>`;
    case 'estimate': return ed ? `<td class="editing"><input id="edit-cell" data-blur="commitCell" data-key-enter="commitCell" data-id="${t.id}" data-f="estimate" value="${esc(t.estimate || '')}" placeholder="e.g. 2d" aria-label="Estimate"></td>` : `<td class="cellbtn num" data-dbl="editCell" data-id="${t.id}" data-f="estimate" data-a="editCell" title="Click to edit">${t.estimate ? esc(t.estimate) : '<span class="faint">—</span>'}</td>`;
    case 'created': return `<td class="num muted">${fmtDate(iso(new Date(t.created)))}</td>`;
    case 'project': return `<td class="cellbtn" data-a="pop" data-pop="project" data-id="${t.id}"><span class="row" style="gap:6px"><span class="pdot" style="--c:${pColor(proj(t.project))}"></span><span class="trunc">${esc(proj(t.project).name)}</span></span></td>`;
  }
}
function tableHtml(ts, key, p) {
  const v = viewOf(key);
  if (p && !v._projHidden) { v._projHidden = true; if (!v.hidden.includes('project')) v.hidden.push('project'); }
  const cols = TCOLS.filter(c => c[0] === 'title' || !v.hidden.includes(c[0]));
  const w = c => v.colW[c[0]] || c[2];
  const groups = groupTasks(ts, v.group);
  const totalW = cols.reduce((a, c) => a + w(c), 0);
  if (!ts.length) return empty('search-x', 'No results found', 'No tasks match these filters.', `<button class="btn btn-secondary btn-sm" data-a="clearFilters" data-key="${key}">Clear filters</button>`);
  return `<div class="tbl-wrap hide-m" data-keep="tbl:${key}"><table class="tbl" style="width:${totalW}px" aria-label="Tasks table">
    <colgroup>${cols.map(c => `<col data-col="${c[0]}" style="width:${w(c)}px">`).join('')}</colgroup>
    <thead><tr>${cols.map(c => `<th class="${c[0] === 'title' ? 'sticky' : ''}" style="position:sticky" scope="col"><div class="thi" data-a="sortBy" data-key="${key}" data-f="${['labels', 'deps'].includes(c[0]) ? 'manual' : c[0]}">${c[1]}${v.sort.f === c[0] ? ic(v.sort.dir > 0 ? 'arrow-up' : 'arrow-down', 11) : ''}</div><span class="rsz" data-rsz="${c[0]}" data-key="${key}" aria-hidden="true"></span></th>`).join('')}</tr></thead>
    <tbody>${groups.map(g => `${v.group !== 'none' ? `<tr class="grow-row"><td class="sticky" colspan="${cols.length}"><span class="row" style="gap:6px">${g.html || ''}${esc(g.name)}<span class="faint" style="font-weight:500">${g.tasks.length}</span></span></td></tr>` : ''}
      ${g.tasks.map(t => `<tr data-ctx="task" data-id="${t.id}">${cols.map(c => tcell(t, c[0])).join('')}</tr>`).join('')}`).join('')}
      <tr><td class="sticky cellbtn" data-a="newTask" ${p ? `data-project="${p.id}"` : ''} colspan="${cols.length}" style="color:var(--text-3)"><span class="row" style="gap:6px">${ic('plus', 14)}New task</span></td></tr>
    </tbody></table></div>
    <div class="only-m" style="padding:8px 16px 90px">${ts.map(t => `<div class="panel" style="padding:12px;margin-bottom:8px" data-a="openTask" data-id="${t.id}"><div class="row" style="margin-bottom:8px">${stIcon(t.status)}<b style="font-weight:500" class="grow">${esc(t.title)}</b><span class="mono faint" style="font-size:11px">${t.key}</span></div><div class="row" style="flex-wrap:wrap;gap:10px;font-size:12px" class="muted">${prPill(t.priority)}${av(t.assignee, 'sm', false)}<span class="muted">${esc(mem(t.assignee)?.name || 'Unassigned')}</span>${dueHtml(t)}${t.estimate ? `<span class="faint">${ic('timer', 12)} ${esc(t.estimate)}</span>` : ''}</div></div>`).join('')}</div>`;
}

/* ---------- CALENDAR ---------- */
function startOfWeek(d) { const x = sod(d); const ws = S.prefs.weekStart; const diff = (x.getDay() - ws + 7) % 7; return addD(x, -diff); }
function calendarHtml(ts, opt = {}) {
  const cur = parse(S.ui.calDate); const mode = S.ui.calMode;
  const evs = opt.events ? D().events.filter(e => !opt.project || e.project === opt.project) : [];
  const itemsOn = ds => [...evs.filter(e => e.date === ds).map(e => ({ ev: e })), ...ts.filter(t => t.due === ds).map(t => ({ t }))];
  const wdn = Array.from({ length: 7 }, (_, i) => WD[(i + S.prefs.weekStart) % 7]);
  const chip = it => {
    if (it.ev) { const p = proj(it.ev.project); return `<button class="cev event" style="--c:${pColor(p)}" data-a="pop" data-pop="event" data-id="${it.ev.id}" title="${esc(it.ev.title)} · ${it.ev.time}"><span class="num faint" style="font-size:11px">${it.ev.time}</span><span class="trunc">${esc(it.ev.title)}</span></button>`; }
    const t = it.t; const p = proj(t.project);
    return `<button class="cev ${t.status === 'done' ? 'done' : ''}${fxc('moved', t.id)}" style="--c:${pColor(p)}" draggable="true" data-drag-cal="${t.id}" data-a="openTask" data-id="${t.id}" data-ctx="task" title="${esc(t.title)}">${t.status === 'done' ? stIcon('done', 11) : prIcon(t.priority, 11)}<span class="trunc">${esc(t.title)}</span>${av(t.assignee, '', false)}</button>`;
  };
  let label, body;
  if (mode === 'month') {
    label = `${MONL[cur.getMonth()]} ${cur.getFullYear()}`;
    const first = new Date(cur.getFullYear(), cur.getMonth(), 1); const start = startOfWeek(first);
    const cells = Array.from({ length: 42 }, (_, i) => addD(start, i));
    const trimmed = cells[35].getMonth() !== cur.getMonth() ? cells.slice(0, 35) : cells;
    body = `<div class="cal-h">${wdn.map(d => `<div>${d}</div>`).join('')}</div>
      <div class="cal-g" style="grid-template-rows:repeat(${trimmed.length / 7},minmax(112px,1fr))">${trimmed.map(d => {
        const ds = iso(d); const items = itemsOn(ds); const today = diffD(d, TODAY) === 0;
        return `<div class="cday ${d.getMonth() !== cur.getMonth() ? 'out' : ''} ${today ? 'today' : ''}" data-drop-day="${ds}">
          <span class="dn" ${today ? 'aria-current="date"' : ''}>${d.getDate()}</span>
          <button class="ibtn ibtn-xs add" data-a="newTask" data-due="${ds}" ${opt.project ? `data-project="${opt.project}"` : ''} aria-label="Add task on ${fmtDate(ds)}">${ic('plus', 13)}</button>
          ${items.slice(0, 3).map(chip).join('')}
          ${items.length > 3 ? `<button class="cmore" data-a="pop" data-pop="daylist" data-date="${ds}" data-key="${opt.key || ''}">+${items.length - 3} more</button>` : ''}
        </div>`;
      }).join('')}</div>`;
  } else {
    const ws = startOfWeek(cur); const days = Array.from({ length: 7 }, (_, i) => addD(ws, i));
    label = `${fmtDate(iso(days[0]))} – ${fmtDate(iso(days[6]))}, ${days[6].getFullYear()}`;
    body = `<div class="week">${days.map(d => {
      const ds = iso(d); const items = itemsOn(ds).sort((a, b) => (a.ev ? 0 : 1) - (b.ev ? 0 : 1)); const today = diffD(d, TODAY) === 0;
      return `<div class="wcol"><div class="wcol-h ${today ? 'today' : ''}"><span class="n">${d.getDate()}</span><span class="muted" style="font-size:12px">${WD[d.getDay()]}</span><span class="sp"></span><button class="ibtn ibtn-xs" data-a="newTask" data-due="${ds}" ${opt.project ? `data-project="${opt.project}"` : ''} aria-label="Add task">${ic('plus', 13)}</button></div>
        <div class="wcol-b" data-drop-day="${ds}">${items.map(it => {
          if (it.ev) { const p = proj(it.ev.project); return `<button class="wcard event" style="--c:${pColor(p)}" data-a="pop" data-pop="event" data-id="${it.ev.id}"><span class="t"><span class="pdot" style="--c:${pColor(p)};border-radius:50%"></span>${esc(it.ev.title)}</span><span class="m">${ic('clock', 11)}${it.ev.time} · ${esc(p.name)}</span></button>`; }
          const t = it.t; const p = proj(t.project);
          return `<button class="wcard${fxc('moved', t.id)}" style="--c:${pColor(p)}" draggable="true" data-drag-cal="${t.id}" data-a="openTask" data-id="${t.id}" data-ctx="task"><span class="t" style="${t.status === 'done' ? 'text-decoration:line-through;color:var(--text-3)' : ''}"><span class="pdot" style="--c:${pColor(p)}"></span>${esc(t.title)}</span><span class="m">${stIcon(t.status, 11)}${prIcon(t.priority, 11)}<span class="trunc grow">${esc(p.name)}</span>${av(t.assignee, 'sm', false)}</span></button>`;
        }).join('') || '<span class="faint" style="font-size:12px;padding:4px">No tasks</span>'}</div></div>`;
    }).join('')}</div>`;
  }
  const projs = [...new Set(ts.map(t => t.project))].map(proj).filter(Boolean);
  return `<div class="cal" style="min-height:640px">
    <div class="toolbar" style="gap:8px">
      <button class="btn btn-secondary btn-sm" data-a="calNav" data-d="0">Today</button>
      <div class="row" style="gap:0"><button class="ibtn ibtn-sm" data-a="calNav" data-d="-1" aria-label="Previous">${ic('chevron-left', 16)}</button><button class="ibtn ibtn-sm" data-a="calNav" data-d="1" aria-label="Next">${ic('chevron-right', 16)}</button></div>
      <h2 style="font-size:15px;font-weight:600;margin:0 4px;letter-spacing:-.01em" aria-live="polite">${label}</h2>
      <span class="sp"></span>
      ${!opt.project && projs.length > 1 ? `<span class="row hide-m" style="gap:10px;font-size:11.5px;color:var(--text-2);margin-right:8px">${projs.slice(0, 5).map(p => `<span class="row" style="gap:4px"><span class="pdot" style="--c:${pColor(p)}"></span>${esc(p.name)}</span>`).join('')}</span>` : ''}
      <div class="seg">${[['month', 'Month'], ['week', 'Week']].map(([k, n]) => `<button class="${mode === k ? 'on' : ''}" data-a="set" data-k="calMode" data-v="${k}">${n}</button>`).join('')}</div>
    </div>
    ${body}
  </div>`;
}
function pageWsCalendar() {
  const key = 'cal'; const v = viewOf(key);
  return `<div class="page flush"><div style="padding:24px 20px 12px" class="ph"><div><h1>Calendar</h1><p>Deadlines and events across every project.</p></div><div class="acts"><button class="btn btn-primary" data-a="newTask">${ic('plus', 14)}New task</button></div></div>
  ${viewToolbar(key, { group: false })}${calendarHtml(applyView(allTasks(), v), { key, events: true })}</div>`;
}

/* ---------- TIMELINE ---------- */
function tlControls(key) {
  return `<div class="seg" style="margin-left:4px">${[['week', 'Weeks'], ['month', 'Months']].map(([k, n]) => `<button class="${S.ui.tlZoom === k ? 'on' : ''}" data-a="set" data-k="tlZoom" data-v="${k}">${n}</button>`).join('')}</div>
  <select class="select" style="height:26px;width:auto;font-size:12px;margin-left:4px" data-in="tlGroup" aria-label="Group by">${[['status', 'Group: Status'], ['assignee', 'Group: Assignee'], ['project', 'Group: Project'], ['none', 'No grouping']].map(([k, n]) => `<option value="${k}" ${S.ui.tlGroup === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
  <button class="btn btn-ghost" data-a="tlToday">${ic('crosshair', 14)}Today</button>`;
}
function timelineHtml(ts, key, p) {
  const dw = S.ui.tlZoom === 'week' ? 32 : 11;
  const rs = startOfWeek(addD(TODAY, S.ui.tlZoom === 'week' ? -21 : -56));
  const nDays = S.ui.tlZoom === 'week' ? 7 * 13 : 7 * 34;
  const X = ds => diffD(parse(ds), rs) * dw;
  const g = S.ui.tlGroup;
  const groups = groupTasks(ts.filter(t => t.due), g === 'project' && p ? 'status' : g).filter(G => G.tasks.length);
  const rows = [];
  const ms = p ? (p.milestones || []) : visibleProjects().filter(canSee).flatMap(q => (q.milestones || []).map(m => ({ ...m, p: q })));
  if (ms.length) rows.push({ type: 'ms' });
  groups.forEach(G => { if (g !== 'none') rows.push({ type: 'g', G }); G.tasks.sort((a, b) => (a.start || a.due) > (b.start || b.due) ? 1 : -1).forEach(t => rows.push({ type: 't', t })); });
  const RH = 36; const H = rows.length * RH; const W = nDays * dw;
  const rowY = {}; rows.forEach((r, i) => { if (r.type === 't') rowY[r.t.id] = i * RH + RH / 2; });
  // header
  let months = [], cm = null;
  for (let i = 0; i < nDays; i++) { const d = addD(rs, i); const k = d.getMonth() + '-' + d.getFullYear(); if (k !== cm) { months.push({ d, i, n: 0 }); cm = k; } months[months.length - 1].n++; }
  const days = S.ui.tlZoom === 'week'
    ? Array.from({ length: nDays }, (_, i) => { const d = addD(rs, i); return `<div style="width:${dw}px" class="${diffD(d, TODAY) === 0 ? 'today' : ''}">${d.getDate()}</div>`; }).join('')
    : Array.from({ length: nDays / 7 }, (_, i) => { const d = addD(rs, i * 7); return `<div style="width:${dw * 7}px">${MON[d.getMonth()]} ${d.getDate()}</div>`; }).join('');
  const weekend = S.ui.tlZoom === 'week' ? Array.from({ length: nDays }, (_, i) => { const d = addD(rs, i); return d.getDay() === 0 || d.getDay() === 6 ? `<div class="tl-we" style="left:${i * dw}px;width:${dw}px"></div>` : ''; }).join('') : '';
  const glines = Array.from({ length: nDays / 7 }, (_, i) => `<div class="tl-gl" style="left:${i * 7 * dw}px"></div>`).join('');
  const bars = rows.map((r, i) => {
    const y = i * RH;
    if (r.type === 'g') return `<div class="tl-rowbg g" style="top:${y}px"></div>`;
    if (r.type === 'ms') return `<div class="tl-rowbg" style="top:${y}px"></div>` + ms.map(m => `<div class="ms" style="left:${X(m.date) + dw / 2 - 6}px;top:${y + 12}px;${m.p ? `background:${pColor(m.p)}` : ''}" title="${esc(m.name)} · ${fmtDate(m.date)}"></div><div class="ms-l" style="left:${X(m.date) + dw / 2 + 10}px;top:${y + 10}px">${esc(m.name)}</div>`).join('');
    const t = r.t; const pp = proj(t.project);
    const s = t.start && t.start <= t.due ? t.start : t.due;
    const x = X(s); const w = Math.max(dw, (diffD(parse(t.due), parse(s)) + 1) * dw);
    const c = g === 'status' || g === 'none' ? pColor(pp) : `var(--st-${t.status})`;
    const inside = w > 110;
    return `<div class="tl-rowbg" style="top:${y}px"></div><div class="bar ${t.status === 'done' ? 'done' : ''}" style="--c:${c};left:${x}px;top:${y + 7}px;width:${w}px" data-bar="${t.id}" data-dw="${dw}" data-a="openTask" data-id="${t.id}" data-ctx="task" title="${esc(t.title)} · ${fmtDate(s)} → ${fmtDate(t.due)}"><span class="pf" style="width:${taskProg(t)}%"></span>${inside ? `${av(t.assignee, 'sm', false)}<span class="trunc">${esc(t.title)}</span>` : ''}</div>${inside ? '' : `<div class="bar-lbl" style="left:${x + w + 8}px;top:${y + 10}px">${esc(t.title)}</div>`}`;
  }).join('');
  // dependency paths
  const deps = ts.flatMap(t => t.deps.filter(d => rowY[d] != null && rowY[t.id] != null).map(d => {
    const a = task(d); const x1 = X(a.due) + dw; const y1 = rowY[d]; const s = t.start && t.start <= t.due ? t.start : t.due; const x2 = X(s); const y2 = rowY[t.id];
    const mx = Math.max(x1 + 10, x2 - 10);
    return `<path d="M${x1} ${y1} C ${mx} ${y1}, ${Math.min(x1 + 10, x2 - 10)} ${y2}, ${x2 - 1} ${y2}" fill="none" stroke="var(--text-3)" stroke-width="1.3" stroke-dasharray="${x2 < x1 ? '3 3' : ''}"/><path d="M${x2 - 6} ${y2 - 3.5} L${x2 - 1} ${y2} L${x2 - 6} ${y2 + 3.5}" fill="none" stroke="var(--text-3)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
  })).join('');
  const left = rows.map(r => {
    if (r.type === 'ms') return `<div class="tl-row g">${ic('diamond', 12)}Milestones<span class="faint" style="font-weight:500">${ms.length}</span></div>`;
    if (r.type === 'g') return `<div class="tl-row g">${r.G.html || ''}${esc(r.G.name)}<span class="faint" style="font-weight:500">${r.G.tasks.length}</span></div>`;
    const t = r.t;
    return `<div class="tl-row" data-a="openTask" data-id="${t.id}">${stIcon(t.status, 13)}<span class="trunc grow" style="${t.status === 'done' ? 'color:var(--text-3)' : ''}">${esc(t.title)}</span>${t.subtasks.length ? `<span class="faint num" style="font-size:11px">${t.subtasks.filter(s => s.done).length}/${t.subtasks.length}</span>` : ''}${av(t.assignee, 'sm')}</div>`;
  }).join('');
  if (!rows.length) return empty('chart-gantt', 'Nothing on the timeline', 'Give tasks a start and due date to see them here.', `<button class="btn btn-primary btn-sm" data-a="newTask" ${p ? `data-project="${p.id}"` : ''}>${ic('plus', 14)}New task</button>`);
  const todayX = diffD(TODAY, rs) * dw;
  return `<div class="tl" data-tl-today="${todayX}" data-tl-key="${key}">
    <div class="tl-left"><div class="tl-head">Task</div><div class="tl-rows" id="tl-rows">${left}<div style="height:40px"></div></div></div>
    <div class="tl-right" id="tl-right" data-keep="tl:${key}:${S.ui.tlZoom}">
      <div class="tl-head" style="width:${W}px"><div class="tl-months">${months.map(m => `<div style="width:${m.n * dw}px">${MONL[m.d.getMonth()]} ${m.d.getFullYear()}</div>`).join('')}</div><div class="tl-days">${days}</div></div>
      <div class="tl-grid" style="width:${W}px;height:${H + 40}px">
        ${weekend}${glines}
        <div class="tl-today" style="left:${todayX + dw / 2}px" title="Today"></div>
        ${bars}
        <svg class="tl-deps" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${deps}</svg>
      </div>
    </div>
  </div>`;
}
function tlAfter() {
  const r = $('#tl-right'), l = $('#tl-rows'); if (!r || !l) return;
  r.onscroll = () => { l.scrollTop = r.scrollTop; };
  l.scrollTop = r.scrollTop;
  const k = $('.tl').dataset.tlKey + S.ui.tlZoom;
  S.ui.tlInit = S.ui.tlInit || {};
  if (!S.ui.tlInit[k]) { S.ui.tlInit[k] = 1; r.scrollLeft = Math.max(0, +$('.tl').dataset.tlToday - 160); }
}
function pageWsTimeline() {
  const key = 'tl'; const v = viewOf(key);
  if (!S.ui._tlWsInit) { S.ui._tlWsInit = 1; S.ui.tlGroup = 'project'; }
  return `<div class="page flush"><div style="padding:24px 20px 12px" class="ph"><div><h1>Timeline</h1><p>Schedules, dependencies, and milestones across projects.</p></div></div>
  ${viewToolbar(key, { group: false, extra: tlControls(key) })}${timelineHtml(applyView(allTasks(), v), key, null)}</div>`;
}

/* ---------- FILES ---------- */
function filesHtml(pid) {
  const u = S.ui; const q = (u.fileQ || '').toLowerCase(); const ft = u.fileType || 'all'; const sort = u.fileSort || 'date';
  let fs = D().files.filter(f => f.project === pid && (!q || f.name.toLowerCase().includes(q)) && (ft === 'all' || f.type === ft));
  fs.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'type' ? a.type.localeCompare(b.type) : b.at - a.at);
  const ups = (u.uploads || []).filter(x => x.project === pid);
  const view = u.fileView;
  return `<div class="toolbar">
      <div class="inwrap">${ic('search', 13)}<input class="input search-sm" id="file-q" data-in="fileQ" placeholder="Search files" value="${esc(u.fileQ || '')}" aria-label="Search files"></div>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="fileType" aria-label="Filter by type"><option value="all">All types</option>${Object.entries(FT).filter(([k]) => k !== 'other').map(([k, v]) => `<option value="${k}" ${ft === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="fileSort" aria-label="Sort">${[['date', 'Newest'], ['name', 'Name'], ['type', 'Type']].map(([k, n]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>Sort: ${n}</option>`).join('')}</select>
      <span class="sp"></span>
      <div class="seg">${[['grid', 'layout-grid'], ['list', 'list']].map(([k, i]) => `<button class="${view === k ? 'on' : ''}" data-a="set" data-k="fileView" data-v="${k}" aria-label="${k} view">${ic(i, 13)}</button>`).join('')}</div>
      <label class="btn btn-primary btn-sm" style="cursor:pointer">${ic('upload', 13)}Upload<input type="file" multiple hidden data-in="uploadFiles" data-project="${pid}"></label>
    </div>
    <div class="page wide" style="padding-top:16px">
      <label class="dropzone" data-dropzone="${pid}" style="margin-bottom:16px">${ic('upload-cloud', 18)}<span>Drop files here or <span class="link">browse</span> — up to 250 MB each</span><input type="file" multiple hidden data-in="uploadFiles" data-project="${pid}"></label>
      ${ups.length ? `<div class="col" style="gap:6px;margin-bottom:16px">${ups.map(x => `<div class="upl"><span class="ftype" style="--c:${FT[fileType(x.name)].c}">${ic(FT[fileType(x.name)].i, 14)}</span><div class="grow"><div class="row"><span class="trunc" style="font-weight:500">${esc(x.name)}</span><span class="sp"></span><span class="faint num" style="font-size:11.5px" id="upct-${x.id}">${x.pct}%</span></div><div class="prog" style="margin-top:6px"><i id="upbar-${x.id}" style="--p:${x.pct / 100}"></i></div></div></div>`).join('')}</div>` : ''}
      ${!fs.length ? empty(q || ft !== 'all' ? 'search-x' : 'folder-open', q || ft !== 'all' ? 'No results found' : 'No files yet', q || ft !== 'all' ? 'No files match your search.' : 'Upload designs, documents, and assets to share them with the project.', '') :
      view === 'grid' ? `<div class="fgrid">${fs.map(f => `<div class="fcard" data-ctx="file" data-id="${f.id}" data-a="previewFile" role="button" tabindex="0">${filePrev(f)}<div class="fi"><span class="fn trunc">${esc(f.name)}</span><span class="fm">${f.size} · ${esc(mem(f.by)?.name.split(' ')[0])} · ${ago(f.at)}</span></div><button class="ibtn ibtn-xs more" data-a="ctxBtn" data-ctx="file" data-id="${f.id}" aria-label="File options">${ic('ellipsis', 13)}</button></div>`).join('')}</div>`
        : `<div class="panel" style="overflow-x:auto"><table class="perm-t" style="min-width:680px"><thead><tr><th style="padding-left:14px">Name</th><th style="text-align:left">Type</th><th style="text-align:left">Size</th><th style="text-align:left">Uploaded by</th><th style="text-align:left">Date</th><th></th></tr></thead><tbody>${fs.map(f => `<tr data-ctx="file" data-id="${f.id}"><td style="padding-left:14px"><span class="row"><span class="ftype" style="--c:${FT[f.type].c}">${ic(FT[f.type].i, 14)}</span><span style="font-weight:500">${esc(f.name)}</span>${f.task && task(f.task) ? `<button class="badge" data-a="openTask" data-id="${f.task}">${ic('link', 10)}${task(f.task).key}</button>` : ''}</span></td><td style="text-align:left" class="muted">${FT[f.type].n}</td><td style="text-align:left" class="num muted">${f.size}</td><td style="text-align:left"><span class="row">${av(f.by, 'sm', false)}${esc(mem(f.by)?.name)}</span></td><td style="text-align:left" class="muted">${ago(f.at)}</td><td><button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="file" data-id="${f.id}" aria-label="File options">${ic('ellipsis', 14)}</button></td></tr>`).join('')}</tbody></table></div>`}
    </div>`;
}
