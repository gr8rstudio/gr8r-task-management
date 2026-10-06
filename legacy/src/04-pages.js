/* =====================================================================
   PAGES
   ===================================================================== */

/* ---------- shared list renderer ---------- */
const LCOLS = { status: ['Status', '126px'], assignee: ['Assignee', '150px'], priority: ['Priority', '108px'], due: ['Due date', '104px'], labels: ['Labels', '168px'], project: ['Project', '160px'] };
function cellStatus(t) { return `<button class="pillbtn" data-a="pop" data-pop="status" data-id="${t.id}" aria-label="Status: ${ST[t.status].name}">${stPill(t.status)}</button>`; }
function cellAssignee(t) { const m = mem(t.assignee); return `<button class="pillbtn ${m ? '' : 'empty'}" data-a="pop" data-pop="assignee" data-id="${t.id}" aria-label="Assignee">${av(t.assignee, 'sm', false)}<span class="trunc">${m ? esc(m.name) : 'Unassigned'}</span></button>`; }
function cellPrio(t) { return `<button class="pillbtn ${t.priority === 'none' ? 'empty' : ''}" data-a="pop" data-pop="priority" data-id="${t.id}" aria-label="Priority">${prPill(t.priority)}</button>`; }
function cellDue(t) { return `<button class="pillbtn ${t.due ? (isOver(t) ? 'over' : '') : 'empty'}" data-a="pop" data-pop="date" data-field="due" data-id="${t.id}" aria-label="Due date">${t.due ? `${ic('calendar', 13)}<span class="num">${relDate(t.due)}</span>` : `${ic('calendar', 13)}<span>Set date</span>`}</button>`; }
function cellLabels(t) { return `<button class="pillbtn ${t.labels.length ? '' : 'empty'}" data-a="pop" data-pop="labels" data-id="${t.id}" aria-label="Labels" style="gap:4px;overflow:hidden">${t.labels.length ? t.labels.slice(0, 2).map(lbl).join('') + (t.labels.length > 2 ? `<span class="faint" style="font-size:11px">+${t.labels.length - 2}</span>` : '') : `${ic('tag', 13)}<span>Add</span>`}</button>`; }
function cellProject(t) { const p = proj(t.project); return `<button class="pillbtn" data-a="pop" data-pop="project" data-id="${t.id}" aria-label="Project"><span class="pdot" style="--c:${pColor(p)}"></span><span class="trunc">${esc(p?.name)}</span></button>`; }
const CELL = { status: cellStatus, assignee: cellAssignee, priority: cellPrio, due: cellDue, labels: cellLabels, project: cellProject };

function taskRow(t, cols, tpl, opt = {}) {
  const sel = S.ui.sel.has(t.id); const open = S.ui.openTasks[t.id];
  const editing = S.ui.editCell && S.ui.editCell.id === t.id && S.ui.editCell.f === 'title';
  const cc = commentsOf(t.id).length; const sd = t.subtasks.filter(s => s.done).length;
  return `<div class="trow ${t.status === 'done' ? 'done' : ''} ${sel ? 'sel' : ''}${fxc('done', t.id)}${fxc('added', t.id)}" style="--cols:${tpl}" data-task-row="${t.id}" data-group="${opt.group || ''}" data-lkey="${opt.key || ''}" data-ctx="task" data-id="${t.id}">
    <div class="handle" draggable="${opt.drag !== false}" data-drag-row="${t.id}" aria-hidden="true">${opt.drag !== false ? ic('grip-vertical', 14) : ''}</div>
    <div class="c-check">${opt.complete
      ? `<input type="checkbox" class="check round" ${t.status === 'done' ? 'checked' : ''} data-a="toggleDone" data-id="${t.id}" aria-label="Mark ${esc(t.title)} complete">`
      : `<input type="checkbox" class="check" ${sel ? 'checked' : ''} data-a="selRow" data-id="${t.id}" aria-label="Select ${esc(t.title)}">`}</div>
    <div class="ttl" ${editing ? '' : `data-a="openTask" data-id="${t.id}"`} data-dbl="editTitle">
      ${t.subtasks.length ? `<span class="ibtn ibtn-xs" data-a="expandRow" data-id="${t.id}" aria-label="${open ? 'Hide' : 'Show'} subtasks" aria-expanded="${!!open}" style="margin-left:-4px">${ic(open ? 'chevron-down' : 'chevron-right', 13)}</span>` : '<span style="width:18px;flex-shrink:0"></span>'}
      <span class="key">${t.key}</span>
      ${editing ? `<input class="inline-in" id="edit-title" data-in="noop" data-blur="commitTitle" data-key-enter="commitTitle" data-id="${t.id}" value="${esc(t.title)}" aria-label="Task title">` : `<span class="tt">${esc(t.title)}</span>`}
      ${t.recur ? `<span class="meta-mini" data-tip="Repeats ${t.recur.toLowerCase()}">${ic('repeat', 11)}</span>` : ''}
      ${t.subtasks.length ? `<span class="meta-mini">${ic('list-checks', 11)}${sd}/${t.subtasks.length}</span>` : ''}
      ${cc ? `<span class="meta-mini">${ic('message-square', 11)}${cc}</span>` : ''}
    </div>
    ${cols.map(c => `<div class="c-meta c-${c === 'labels' ? 'lbl' : c}">${CELL[c](t)}</div>`).join('')}
    <div class="c-more"><button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="task" data-id="${t.id}" aria-label="More actions">${ic('ellipsis', 15)}</button></div>
  </div>
  ${open ? `<div class="subrows">${t.subtasks.map(s => `<div class="subrow ${s.done ? 'done' : ''}"><input type="checkbox" class="check" ${s.done ? 'checked' : ''} data-a="toggleSub" data-id="${t.id}" data-sid="${s.id}" aria-label="Complete subtask"><span>${esc(s.title)}</span></div>`).join('')}</div>` : ''}`;
}
function listHtml(groups, key, opt = {}) {
  const cols = opt.cols || ['status', 'assignee', 'priority', 'due', 'labels'];
  const tpl = `18px 30px minmax(220px,1fr) ${cols.map(c => LCOLS[c][1]).join(' ')} 40px`;
  const all = groups.flatMap(g => g.tasks.map(t => t.id));
  const nSel = all.filter(id => S.ui.sel.has(id)).length;
  const total = all.length;
  if (!total && !opt.keepEmpty) return opt.emptyHtml || empty('list-checks', 'No tasks here', 'Add a task to get things moving.', `<button class="btn btn-primary btn-sm" data-a="newTask" ${opt.project ? `data-project="${opt.project}"` : ''}>${ic('plus', 14)}New task</button>`);
  const v = S.views[key];
  return `<div class="tlist" role="table" aria-label="Tasks">
    <div class="thead" style="--cols:${tpl}" role="row">
      <div></div>
      <div>${opt.complete ? '' : `<input type="checkbox" class="check" data-a="selAll" data-key="${key}" ${nSel && nSel === total ? 'checked' : ''} ${nSel && nSel < total ? 'data-indet="1"' : ''} aria-label="Select all">`}</div>
      <div data-a="sortBy" data-key="${key}" data-f="title" style="cursor:pointer">Task ${v?.sort.f === 'title' ? ic(v.sort.dir > 0 ? 'arrow-up' : 'arrow-down', 11) : ''}</div>
      ${cols.map(c => `<div data-a="sortBy" data-key="${key}" data-f="${c === 'labels' ? 'manual' : c}" style="cursor:pointer">${LCOLS[c][0]} ${v?.sort.f === c ? ic(v.sort.dir > 0 ? 'arrow-up' : 'arrow-down', 11) : ''}</div>`).join('')}
      <div></div>
    </div>
    ${groups.map(g => {
      const gk = key + ':' + g.key; const coll = S.ui.collapsedGroups[gk] ?? (g.collapsed || false);
      const comp = S.ui.composer && S.ui.composer.ctx === key && S.ui.composer.group === g.key;
      return `${groups.length > 1 || g.key !== 'all' ? `<div class="grp" data-grp-drop="${g.key}" data-key="${key}">
          <button class="ibtn ibtn-xs" data-a="toggleGroup" data-gk="${gk}" aria-expanded="${!coll}" aria-label="Toggle group">${ic(coll ? 'chevron-right' : 'chevron-down', 13)}</button>
          ${g.html || ''}<span>${esc(g.name)}</span><span class="cnt">${g.tasks.length}</span>
          ${opt.noAdd ? '' : `<button class="ibtn ibtn-xs" data-a="startComposer" data-ctx="${key}" data-group="${g.key}" data-gb="${esc(JSON.stringify(g.set || {}))}" aria-label="Add task to ${esc(g.name)}">${ic('plus', 13)}</button>`}
        </div>` : ''}
        ${coll ? '' : g.tasks.map(t => taskRow(t, cols, tpl, { group: g.key, drag: opt.drag, complete: opt.complete, key })).join('')}
        ${coll || opt.noAdd ? '' : comp ? `<div class="addrow" style="background:var(--surface-2)">${ic('plus', 14)}<input class="inline-in" id="composer-in" data-key-enter="commitComposer" placeholder="Task name — press Enter to add, Esc to cancel" aria-label="New task name"></div>` : `<button class="addrow" data-a="startComposer" data-ctx="${key}" data-group="${g.key}" data-gb="${esc(JSON.stringify(g.set || {}))}">${ic('plus', 14)}Add task</button>`}`;
    }).join('')}
  </div>${bulkBar(all)}`;
}
function bulkBar(ids) {
  const n = ids.filter(id => S.ui.sel.has(id)).length;
  if (!n) return '';
  return `<div class="bulkbar${S.ui.fx.bulk ? ' enter' : ''}" role="toolbar" aria-label="Bulk actions"><b style="font-weight:600">${n} selected</b><span class="sep"></span>
    <button class="btn btn-sm" data-a="pop" data-pop="bulk-status">${ic('circle-dot', 14)}Status</button>
    <button class="btn btn-sm" data-a="pop" data-pop="bulk-assignee">${ic('user', 14)}Assignee</button>
    <button class="btn btn-sm" data-a="pop" data-pop="bulk-priority">${ic('signal-high', 14)}Priority</button>
    <button class="btn btn-sm" data-a="bulkDelete">${ic('trash-2', 14)}Delete</button><span class="sep"></span>
    <button class="btn btn-sm" data-a="clearSel" aria-label="Clear selection">${ic('x', 14)}</button></div>`;
}

/* ---------- activity rendering ---------- */
function actHtml(a, opt = {}) {
  const m = mem(a.by); const t = a.task ? task(a.task) : null; const p = a.project ? proj(a.project) : null;
  const obj = t ? `<span class="obj" data-a="openTask" data-id="${t.id}">${esc(t.title)}</span>` : p ? `<span class="obj" data-a="go" data-r="project" data-id="${p.id}">${esc(p.name)}</span>` : '';
  return `<div class="fitem">${av(a.by, 'sm')}<div class="grow"><b>${esc(m?.id === D().me ? 'You' : m?.name || 'Someone')}</b> <span class="muted">${esc(a.verb)}</span> ${obj} ${a.extra ? `<span class="muted">${esc(a.extra)}</span>` : ''}${opt.proj && p && t ? ` <span class="faint">in ${esc(p.name)}</span>` : ''}</div><time>${ago(a.at)}</time></div>`;
}
function miniRow(t, opt = {}) {
  const p = proj(t.project);
  return `<div class="mini ${t.status === 'done' ? 'done' : ''}${fxc('done', t.id)}${fxc('added', t.id)}" data-a="openTask" data-id="${t.id}" data-ctx="task" role="button" tabindex="0">
    <input type="checkbox" class="check round" ${t.status === 'done' ? 'checked' : ''} data-a="toggleDone" data-id="${t.id}" aria-label="Complete ${esc(t.title)}">
    <span data-tip="${ST[t.status].name}">${stIcon(t.status)}</span>
    <span class="tt">${esc(t.title)}</span>
    ${opt.noProj ? '' : `<span class="pj hide-m"><span class="pdot" style="--c:${pColor(p)}"></span><span class="trunc">${esc(p.name)}</span></span>`}
    <span data-tip="${PR[t.priority].name} priority">${prIcon(t.priority)}</span>
    <span style="width:74px;text-align:right" class="hide-m">${dueHtml(t, false)}</span>
    ${opt.av === false ? '' : av(t.assignee, 'sm')}
  </div>`;
}

/* ---------- HOME ---------- */
function pageHome() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const all = allTasks(); const mineAll = all.filter(t => t.assignee === D().me);
  const activeP = visibleProjects().filter(p => canSee(p) && p.status !== 'complete');
  const open = all.filter(t => t.status !== 'done');
  const doneWk = all.filter(t => t.status === 'done' && t.completedAt && Date.now() - t.completedAt < 7 * DAY);
  const over = all.filter(isOver);
  const tab = S.ui.homeTab;
  const lists = {
    upcoming: sortTasks(mineAll.filter(t => t.status !== 'done' && !isOver(t)), { f: 'due', dir: 1 }),
    overdue: mineAll.filter(isOver),
    completed: sortTasks(mineAll.filter(t => t.status === 'done'), { f: 'updated', dir: 1 }),
  };
  const cur = lists[tab].slice(0, 7);
  const dl = (lab, a, b) => { const ts = sortTasks(open.filter(t => t.due && diffD(parse(t.due), TODAY) >= a && diffD(parse(t.due), TODAY) <= b), { f: 'priority', dir: 1 }); return { lab, ts }; };
  const dls = [dl('Today', 0, 0), dl('Tomorrow', 1, 1), dl('This week', 2, 7)];
  return `<div class="page">
    <div class="ph"><div><h1>${greet}, ${esc(S.prefs.name.split(' ')[0])}</h1><p><span class="num">${WDL[TODAY.getDay()]}, ${MONL[TODAY.getMonth()]} ${TODAY.getDate()}</span> · Here's what's happening across your workspace.</p></div>
      <div class="acts"><button class="btn btn-secondary hide-m" data-a="invite">${ic('user-plus', 14)}Invite member</button><button class="btn btn-secondary hide-m" data-a="newProject">${ic('folder-plus', 14)}New project</button><button class="btn btn-primary" data-a="newTask">${ic('plus', 14)}New task</button></div></div>
    <div class="stats" style="margin-bottom:16px">
      <button class="stat" data-a="go" data-r="projects"><span class="k">${ic('folder-kanban', 14)}Active projects</span><span class="v">${activeP.length}</span><span class="d">${activeP.filter(p => p.status === 'risk').length} at risk</span></button>
      <button class="stat" data-a="goTasks" data-f="open"><span class="k">${ic('circle-dashed', 14)}Open tasks</span><span class="v">${open.length}</span><span class="d">${open.filter(t => t.assignee === D().me).length} assigned to you</span></button>
      <button class="stat" data-a="goTasks" data-f="done"><span class="k">${ic('circle-check', 14)}Completed</span><span class="v">${doneWk.length}</span><span class="d up">this week</span></button>
      <button class="stat" data-a="goTasks" data-f="overdue"><span class="k">${ic('clock-alert', 14)}Overdue</span><span class="v" style="${over.length ? 'color:var(--red)' : ''}">${over.length}</span><span class="d ${over.length ? 'bad' : ''}">${over.length ? 'need attention' : 'all on track'}</span></button>
    </div>
    <div class="grid2">
      <div class="stack">
        <section class="panel" aria-labelledby="h-mytasks">
          <div class="panel-h"><h2 id="h-mytasks">My tasks</h2>
            <div class="acts"><div class="seg" role="tablist">${[['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed']].map(([k, n]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-a="set" data-k="homeTab" data-v="${k}">${n} <span class="faint">${lists[k].length}</span></button>`).join('')}</div>
            <button class="ibtn ibtn-sm" data-a="go" data-r="mytasks" data-tip="Open My Tasks" aria-label="Open My Tasks">${ic('arrow-up-right', 15)}</button></div></div>
          ${cur.length ? cur.map(t => miniRow(t, { av: false })).join('') : empty(tab === 'overdue' ? 'circle-check' : 'list-checks', tab === 'overdue' ? 'Nothing overdue' : 'No tasks here', tab === 'overdue' ? 'Every task assigned to you is on schedule.' : 'Add a task to get things moving.', '', 'sm')}
          ${lists[tab].length > 7 ? `<button class="addrow" style="padding-left:14px;border-top:1px solid var(--divider);border-bottom:0" data-a="go" data-r="mytasks">View all ${lists[tab].length} tasks ${ic('arrow-right', 13)}</button>` : ''}
        </section>
        <section class="panel">
          <div class="panel-h"><h2>Project progress</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="projects">All projects</button></div></div>
          <div style="overflow-x:auto"><table class="perm-t" style="min-width:560px"><thead><tr><th style="padding-left:14px">Project</th><th style="text-align:left">Status</th><th style="text-align:left;width:26%">Progress</th><th style="text-align:left">Due</th><th style="text-align:right;padding-right:14px">Team</th></tr></thead><tbody>
          ${activeP.filter(canSee).map(p => { const pr = progressOf(p.id); return `<tr style="cursor:pointer" data-a="go" data-r="project" data-id="${p.id}" data-tab="overview"><td style="padding-left:14px"><span class="row">${pIcon(p, '', 14)}<b style="font-weight:500">${esc(p.name)}</b></span></td><td style="text-align:left">${pStatus(p.status)}</td><td><span class="row">${progBar(pr, p.status === 'risk' ? 'red' : '')}<span class="num faint" style="font-size:11.5px;width:30px">${pr}%</span></span></td><td style="text-align:left" class="num muted">${fmtDate(p.due)}</td><td style="text-align:right;padding-right:14px">${avStack(p.members, 3)}</td></tr>`; }).join('')}
          </tbody></table></div>
        </section>
      </div>
      <div class="stack">
        <section class="panel">
          <div class="panel-h"><h2>Upcoming deadlines</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="calendar">${ic('calendar', 13)}Calendar</button></div></div>
          <div class="panel-b" style="padding-bottom:6px">
          ${dls.map(g => `<div style="margin-bottom:10px"><div class="row" style="font-size:11.5px;font-weight:600;color:var(--text-2);margin-bottom:4px">${g.lab}<span class="faint" style="font-weight:500">${g.ts.length}</span></div>
            ${g.ts.length ? g.ts.slice(0, 4).map(t => `<div class="row" style="height:30px;cursor:pointer;gap:8px;font-size:13px" data-a="openTask" data-id="${t.id}"><span class="pdot" style="--c:${pColor(proj(t.project))}"></span><span class="trunc grow">${esc(t.title)}</span>${prIcon(t.priority, 13)}${av(t.assignee, 'sm')}</div>`).join('') + (g.ts.length > 4 ? `<div class="faint" style="font-size:11.5px;padding-left:16px">+${g.ts.length - 4} more</div>` : '') : `<div class="faint" style="font-size:12.5px;padding:4px 0 2px">Nothing due</div>`}</div>`).join('')}
          </div>
        </section>
        <section class="panel">
          <div class="panel-h"><h2>Recent activity</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="activity">View all</button></div></div>
          <div class="panel-b feed lined">${D().activity.slice(0, 7).map(a => actHtml(a, { proj: true })).join('')}</div>
        </section>
      </div>
    </div>
  </div>`;
}

/* ---------- WORKSPACE OVERVIEW ---------- */
function pageOverview() {
  const ps = visibleProjects().filter(canSee); const all = allTasks();
  const done = all.filter(t => t.status === 'done').length;
  const counts = STATUSES.map(s => ({ s, n: all.filter(t => t.status === s.id).length }));
  const ms = ps.flatMap(p => (p.milestones || []).map(m => ({ ...m, p }))).filter(m => diffD(parse(m.date), TODAY) >= 0).sort((a, b) => a.date > b.date ? 1 : -1).slice(0, 6);
  const load = D().members.filter(m => m.status === 'active').map(m => ({ m, ts: all.filter(t => t.assignee === m.id && t.status !== 'done') })).sort((a, b) => b.ts.length - a.ts.length);
  const maxL = Math.max(...load.map(l => l.ts.length), 1);
  return `<div class="page">
    <div class="ph"><div><h1>Workspace overview</h1><p>Health of every project in ${esc(D().ws.name)}.</p></div><div class="acts"><button class="btn btn-secondary" data-a="go" data-r="timeline">${ic('chart-gantt', 14)}Timeline</button><button class="btn btn-primary" data-a="newProject">${ic('plus', 14)}New project</button></div></div>
    <div class="stats" style="margin-bottom:16px">
      <div class="stat"><span class="k">Projects</span><span class="v">${ps.length}</span><span class="d">${ps.filter(p => p.status === 'complete').length} completed</span></div>
      <div class="stat"><span class="k">Tasks</span><span class="v">${all.length}</span><span class="d">${all.length - done} open</span></div>
      <div class="stat"><span class="k">Completion rate</span><span class="v">${Math.round(done / Math.max(all.length, 1) * 100)}%</span><span class="d">across all projects</span></div>
      <div class="stat"><span class="k">Members</span><span class="v">${D().members.length}</span><span class="d">${D().members.filter(m => m.status === 'invited').length} pending invite</span></div>
    </div>
    <div class="grid2">
      <section class="panel"><div class="panel-h"><h2>Portfolio</h2></div>
        <div style="overflow-x:auto"><table class="perm-t" style="min-width:600px"><thead><tr><th style="padding-left:14px">Project</th><th style="text-align:left">Lead</th><th style="text-align:left">Status</th><th style="text-align:left;width:22%">Progress</th><th>Open</th><th>Overdue</th><th style="text-align:left">Due</th></tr></thead><tbody>
        ${ps.map(p => { const ts = tasksOf(p.id); const pr = progressOf(p.id); const ov = ts.filter(isOver).length; return `<tr style="cursor:pointer" data-a="go" data-r="project" data-id="${p.id}" data-tab="overview"><td style="padding-left:14px"><span class="row">${pIcon(p, '', 14)}<span class="trunc" style="font-weight:500">${esc(p.name)}</span></span></td><td style="text-align:left"><span class="row">${av(p.lead, 'sm')}<span class="muted trunc">${esc(mem(p.lead)?.name.split(' ')[0])}</span></span></td><td style="text-align:left">${pStatus(p.status)}</td><td><span class="row">${progBar(pr, p.status === 'complete' ? 'green' : p.status === 'risk' ? 'red' : '')}<span class="num faint" style="font-size:11.5px;width:30px">${pr}%</span></span></td><td class="num">${ts.filter(t => t.status !== 'done').length}</td><td class="num" style="${ov ? 'color:var(--red)' : 'color:var(--text-3)'}">${ov}</td><td style="text-align:left" class="num muted">${fmtDate(p.due)}</td></tr>`; }).join('')}
        </tbody></table></div>
      </section>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>Tasks by status</h2></div><div class="panel-b">
          <div class="stackbar" style="height:10px;margin-bottom:12px">${counts.map(c => `<i style="width:${c.n / Math.max(all.length, 1) * 100}%;background:var(--st-${c.s.id})" title="${c.s.name}: ${c.n}"></i>`).join('')}</div>
          ${counts.map(c => `<div class="row" style="height:28px;font-size:13px">${stIcon(c.s.id)}<span class="grow">${c.s.name}</span><span class="num muted">${c.n}</span><span class="num faint" style="width:36px;text-align:right">${Math.round(c.n / Math.max(all.length, 1) * 100)}%</span></div>`).join('')}
        </div></section>
        <section class="panel"><div class="panel-h"><h2>Workload</h2><div class="acts"><span class="faint" style="font-size:11.5px">Open tasks per person</span></div></div><div class="panel-b">
          ${load.map(l => `<div class="row" style="height:30px;font-size:13px;cursor:pointer" data-a="go" data-r="member" data-id="${l.m.id}">${av(l.m.id, 'sm', false)}<span style="width:96px" class="trunc">${esc(l.m.name.split(' ')[0])}</span><span class="grow" style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--surface-3)"><span style="display:flex;width:${l.ts.length / maxL * 100}%">${STATUSES.filter(s => s.id !== 'done').map(s => { const n = l.ts.filter(t => t.status === s.id).length; return n ? `<i style="display:block;flex:${n};background:var(--st-${s.id})"></i>` : ''; }).join('')}</span></span><span class="num muted" style="width:22px;text-align:right">${l.ts.length}</span></div>`).join('')}
        </div></section>
        <section class="panel"><div class="panel-h"><h2>Upcoming milestones</h2></div><div class="panel-b">
          ${ms.map(m => `<div class="row" style="height:32px;font-size:13px;cursor:pointer" data-a="go" data-r="project" data-id="${m.p.id}" data-tab="timeline"><span style="width:9px;height:9px;transform:rotate(45deg);background:${pColor(m.p)};border-radius:2px;flex-shrink:0;margin:0 3px"></span><span class="grow trunc">${esc(m.name)} <span class="faint">· ${esc(m.p.name)}</span></span><span class="num muted">${relDate(m.date)}</span></div>`).join('') || '<div class="faint">No upcoming milestones</div>'}
        </div></section>
      </div>
    </div>
  </div>`;
}

/* ---------- MY TASKS ---------- */
function pageMyTasks() {
  const key = 'mytasks'; const v = viewOf(key);
  const mine = applyView(allTasks().filter(t => t.assignee === D().me), v.sort.f === 'manual' ? { ...v, sort: { f: 'due', dir: 1 } } : v);
  const groups = [
    { key: 'overdue', name: 'Overdue', html: `<span style="color:var(--red)">${ic('clock-alert', 14)}</span>`, tasks: mine.filter(isOver), set: {} },
    { key: 'today', name: 'Today', html: ic('sun', 14), tasks: mine.filter(t => t.status !== 'done' && t.due && diffD(parse(t.due), TODAY) === 0), set: { due: dOff(0) } },
    { key: 'upcoming', name: 'Upcoming', html: ic('calendar-days', 14), tasks: mine.filter(t => t.status !== 'done' && (!t.due || diffD(parse(t.due), TODAY) > 0)), set: { due: dOff(3) } },
    { key: 'completed', name: 'Completed', html: `<span style="color:var(--green)">${ic('circle-check', 14)}</span>`, tasks: mine.filter(t => t.status === 'done'), set: { status: 'done' }, collapsed: true },
  ];
  const mode = S.ui.myView;
  return `<div class="page flush">
    <div style="padding:24px 20px 12px" class="ph"><div><h1>My Tasks</h1><p>${groups[1].tasks.length} due today · ${groups[0].tasks.length} overdue · ${groups[2].tasks.length} upcoming</p></div>
      <div class="acts"><div class="seg" role="tablist" aria-label="View">${[['list', 'List', 'list'], ['calendar', 'Calendar', 'calendar']].map(([k, n, i]) => `<button class="${mode === k ? 'on' : ''}" data-a="set" data-k="myView" data-v="${k}">${ic(i, 13)}${n}</button>`).join('')}</div>
      <button class="btn btn-primary" data-a="newTask" data-assignee="${D().me}">${ic('plus', 14)}New task</button></div></div>
    ${viewToolbar(key, { group: false })}
    ${mode === 'calendar' ? calendarHtml(mine, { key: 'my' }) : `<div style="padding:0 20px 90px">${listHtml(groups, key, { cols: ['project', 'status', 'priority', 'due'], complete: true, drag: false, keepEmpty: true })}</div>`}
  </div>`;
}

/* ---------- WORKSPACE TASKS ---------- */
function pageTasks() {
  const key = 'tasks'; const v = viewOf(key); v.mode = v.mode || 'list';
  const ts = applyView(allTasks(), v);
  const right = `<div class="seg">${[['list', 'List', 'list'], ['board', 'Board', 'square-kanban'], ['table', 'Table', 'table-2']].map(([k, n, i]) => `<button class="${v.mode === k ? 'on' : ''}" data-a="setViewMode" data-key="${key}" data-v="${k}">${ic(i, 13)}<span class="hide-m">${n}</span></button>`).join('')}</div>`;
  let body;
  if (v.mode === 'board') body = boardHtml(ts, key, {});
  else if (v.mode === 'table') body = tableHtml(ts, key);
  else body = `<div style="padding:0 20px 90px">${listHtml(groupTasks(ts, v.group), key, { cols: ['status', 'assignee', 'priority', 'due', 'project'] })}</div>`;
  return `<div class="page flush">
    <div style="padding:24px 20px 12px" class="ph"><div><h1>Tasks</h1><p>Every task across ${visibleProjects().filter(canSee).length} projects.</p></div><div class="acts"><button class="btn btn-primary" data-a="newTask">${ic('plus', 14)}New task</button></div></div>
    ${viewToolbar(key, { right, cols: v.mode === 'table', group: v.mode !== 'board' })}
    ${body}
  </div>`;
}

/* ---------- INBOX ---------- */
function pageInbox() {
  const cats = [['all', 'All'], ['mention', 'Mentions'], ['assign', 'Assignments'], ['comment', 'Comments'], ['update', 'Updates']];
  const cat = S.ui.inboxCat;
  let ns = D().notifs.slice().sort((a, b) => b.at - a.at);
  const count = k => ns.filter(n => (k === 'all' || n.type === k) && !n.read).length;
  ns = ns.filter(n => cat === 'all' || n.type === cat);
  if (S.ui.inboxUnread) ns = ns.filter(n => !n.read);
  const sel = D().notifs.find(n => n.id === S.ui.inboxSel) || null;
  return `<div class="page flush">
    <div style="display:grid;grid-template-columns:minmax(0,400px) minmax(0,1fr);flex:1;min-height:0" class="inbox-grid">
      <style>@media(max-width:900px){.inbox-grid{grid-template-columns:minmax(0,1fr)!important}.inbox-prev{display:${sel ? 'flex' : 'none'}!important;position:fixed;inset:0;z-index:48;background:var(--surface)}}</style>
      <div style="border-right:1px solid var(--border);display:flex;flex-direction:column;min-height:0">
        <div style="padding:18px 16px 0" class="row"><h1 style="font-size:var(--fs-xl);margin:0;font-weight:600;letter-spacing:-.015em">Inbox</h1><span class="sp"></span>
          <label class="row" style="font-size:12px;color:var(--text-2);gap:6px;cursor:pointer"><input type="checkbox" class="toggle" data-a="toggleUnreadOnly" ${S.ui.inboxUnread ? 'checked' : ''}>Unread</label>
          <button class="ibtn ibtn-sm" data-a="markAllRead" data-tip="Mark all as read" aria-label="Mark all as read">${ic('check-check', 15)}</button></div>
        <div class="tabs" style="padding:0 8px;margin-top:8px" role="tablist">${cats.map(([k, n]) => `<button role="tab" class="tab ${cat === k ? 'on' : ''}" data-a="set" data-k="inboxCat" data-v="${k}">${n}${count(k) ? `<span class="cnt">${count(k)}</span>` : ''}</button>`).join('')}</div>
        <div style="overflow-y:auto;flex:1" data-keep="inbox-list">
          ${ns.length ? ns.map(n => inboxItem(n, sel && sel.id === n.id)).join('') : empty('inbox', "You're all caught up.", S.ui.inboxUnread ? 'No unread notifications in this category.' : 'New mentions, assignments, and comments will show up here.', '', 'sm')}
        </div>
      </div>
      <div class="inbox-prev" style="display:flex;flex-direction:column;min-height:0;overflow-y:auto">${sel ? inboxPreview(sel) : `<div class="fullstate"><div class="box"><div class="empty-state" style="padding:0"><div class="glyph">${ic('mail-open', 20)}</div><h2 class="es-h">Select a notification</h2><p>Read the conversation and reply without leaving your inbox.</p></div></div></div>`}</div>
    </div>
  </div>`;
}
function notifText(n) {
  const t = n.task ? task(n.task) : null; const p = n.project ? proj(n.project) : t ? proj(t.project) : null;
  const who = n.by ? `<b style="font-weight:600">${esc(mem(n.by)?.name)}</b>` : '';
  if (!n.by && p && !t) return `<b style="font-weight:600">${esc(n.text)}</b>`;
  if (!n.by && t) return `<b style="font-weight:600">${esc(t.title)}</b> <span class="muted">${esc(n.text)}</span>`;
  return `${who} <span class="muted">${esc(n.text)}</span> ${t ? `<b style="font-weight:500">${esc(t.title)}</b>` : ''}`;
}
function notifIcon(n) {
  if (n.by) return av(n.by, 'md', false);
  const i = n.type === 'update' && n.project ? 'triangle-alert' : 'clock';
  return `<span class="av md" style="--c:${n.project ? 'var(--red)' : 'var(--amber)'}">${ic(i, 13)}</span>`;
}
function inboxItem(n, on) {
  const t = n.task ? task(n.task) : null; const p = n.project ? proj(n.project) : t ? proj(t.project) : null;
  const typeIc = { mention: 'at-sign', assign: 'user-plus', comment: 'message-square', update: 'refresh-cw' }[n.type];
  return `<div class="row" style="align-items:flex-start;gap:10px;padding:12px 16px;border-bottom:1px solid var(--divider);cursor:pointer;position:relative;${on ? 'background:var(--surface-2);' : ''}" data-a="selNotif" data-id="${n.id}" role="button" tabindex="0">
    ${!n.read ? '<span style="position:absolute;left:6px;top:22px;width:6px;height:6px;border-radius:50%;background:var(--accent)" aria-label="Unread"></span>' : ''}
    ${notifIcon(n)}
    <div class="grow" style="font-size:13px;line-height:1.45">
      <div>${notifText(n)}</div>
      <div class="trunc muted" style="font-size:12.5px;margin-top:2px">${fmtComment(n.snippet)}</div>
      <div class="row" style="gap:6px;margin-top:5px;font-size:11.5px;color:var(--text-3)">${ic(typeIc, 11)}${p ? `<span class="pdot" style="--c:${pColor(p)};width:6px;height:6px"></span>${esc(p.name)}` : ''}<span>·</span><span>${ago(n.at)}</span></div>
    </div>
    <button class="ibtn ibtn-xs" data-a="toggleRead" data-id="${n.id}" data-tip="${n.read ? 'Mark as unread' : 'Mark as read'}" aria-label="${n.read ? 'Mark as unread' : 'Mark as read'}">${ic(n.read ? 'mail' : 'mail-open', 13)}</button>
  </div>`;
}
function inboxPreview(n) {
  const t = n.task ? task(n.task) : null; const p = n.project ? proj(n.project) : t ? proj(t.project) : null;
  if (!t) return `<div style="padding:24px 28px"><button class="btn btn-sm btn-ghost" data-a="set" data-k="inboxSel" data-v="" style="margin:-4px 0 12px -8px">${ic('arrow-left', 14)}Back</button><div class="alert danger">${ic('triangle-alert', 16)}<div><b>${esc(n.text)}</b><div class="muted" style="margin-top:2px">${esc(n.snippet)}</div></div></div><div style="margin-top:14px"><button class="btn btn-secondary" data-a="go" data-r="project" data-id="${p.id}" data-tab="overview">Open project</button></div></div>`;
  const cs = commentsOf(t.id).slice(-4);
  return `<div class="row" style="height:46px;padding:0 16px;border-bottom:1px solid var(--border);gap:8px;flex-shrink:0">
      <button class="ibtn ibtn-sm" data-a="set" data-k="inboxSel" data-v="" aria-label="Back">${ic('arrow-left', 15)}</button>
      <span class="pdot" style="--c:${pColor(p)}"></span><span class="muted" style="font-size:12.5px">${esc(p.name)}</span><span class="faint mono">${t.key}</span><span class="sp"></span>
      <button class="btn btn-sm btn-secondary" data-a="openTask" data-id="${t.id}">${ic('panel-right-open', 14)}Open task</button></div>
    <div style="padding:24px 28px;max-width:720px;width:100%">
      <h2 style="font-size:var(--fs-xl);margin:0 0 10px;font-weight:600;letter-spacing:-.015em">${esc(t.title)}</h2>
      <div class="row" style="flex-wrap:wrap;gap:4px;margin-bottom:18px">${cellStatus(t)}${cellAssignee(t)}${cellPrio(t)}${cellDue(t)}</div>
      <div class="eyebrow" style="margin-bottom:4px">Conversation</div>
      ${cs.length ? cs.map(commentHtml).join('') : `<p class="muted">${esc(n.snippet)}</p>`}
      <div class="cbox" style="margin-top:10px"><textarea id="inbox-reply" data-in="draft" data-id="${t.id}" data-key-mod-enter="postComment" placeholder="Reply… use @ to mention" aria-label="Reply">${esc(S.ui.drafts[t.id] || '')}</textarea>
      <div class="row"><span class="faint" style="font-size:11.5px">${MOD}+Enter to send</span><span class="sp"></span><button class="btn btn-primary btn-sm" data-a="postComment" data-id="${t.id}">Reply</button></div></div>
    </div>`;
}

/* ---------- NOTIFICATIONS ---------- */
function pageNotifications() {
  const f = S.ui.notifFilter;
  let ns = D().notifs.slice().sort((a, b) => b.at - a.at);
  const unread = ns.filter(n => !n.read).length;
  if (f === 'unread') ns = ns.filter(n => !n.read);
  const buckets = {}; ns.forEach(n => (buckets[dayBucket(n.at)] ||= []).push(n));
  return `<div class="page" style="max-width:820px">
    <div class="ph"><div><h1 class="row" style="gap:10px">Notifications ${unread ? `<span class="badge accent">${unread} unread</span>` : ''}</h1><p>Updates on tasks and projects you follow.</p></div>
      <div class="acts"><div class="seg">${[['all', 'All'], ['unread', 'Unread']].map(([k, n]) => `<button class="${f === k ? 'on' : ''}" data-a="set" data-k="notifFilter" data-v="${k}">${n}</button>`).join('')}</div>
      <button class="btn btn-secondary" data-a="markAllRead" ${unread ? '' : 'disabled'}>${ic('check-check', 14)}Mark all as read</button>
      <button class="ibtn" data-a="go" data-r="settings" data-sec="notif-email" data-tip="Notification preferences" aria-label="Notification preferences">${ic('settings-2', 16)}</button></div></div>
    ${ns.length ? Object.entries(buckets).map(([b, list]) => `<div class="day-h">${b}</div><div class="panel" style="overflow:hidden">${list.map(n => {
      const t = n.task ? task(n.task) : null; const p = n.project ? proj(n.project) : t ? proj(t.project) : null;
      return `<div class="row" style="gap:12px;padding:11px 14px;border-top:1px solid var(--divider);cursor:pointer;align-items:flex-start;${n.read ? '' : 'background:color-mix(in srgb,var(--accent) 3.5%,transparent)'}" data-a="openNotif" data-id="${n.id}" role="button" tabindex="0">
        ${notifIcon(n)}<div class="grow" style="font-size:13px"><div>${notifText(n)}</div><div class="muted trunc" style="font-size:12.5px;margin-top:2px">${fmtComment(n.snippet)}</div><div class="faint" style="font-size:11.5px;margin-top:4px">${p ? esc(p.name) + ' · ' : ''}${ago(n.at)}</div></div>
        ${n.read ? '' : '<span style="width:7px;height:7px;border-radius:50%;background:var(--accent);margin-top:8px" aria-label="Unread"></span>'}
        <button class="ibtn ibtn-sm" data-a="toggleRead" data-id="${n.id}" data-tip="${n.read ? 'Mark as unread' : 'Mark as read'}" aria-label="Toggle read">${ic(n.read ? 'mail' : 'check', 14)}</button></div>`;
    }).join('')}</div>`).join('') : `<div class="panel">${empty('bell-off', "You're all caught up.", 'No unread notifications. We\'ll let you know when something needs you.', `<button class="btn btn-secondary btn-sm" data-a="set" data-k="notifFilter" data-v="all">Show all</button>`)}</div>`}
  </div>`;
}

/* ---------- FAVORITES ---------- */
function pageFavorites() {
  const ps = visibleProjects().filter(p => p.fav && canSee(p));
  const ts = allTasks().filter(t => t.fav);
  return `<div class="page">
    <div class="ph"><div><h1>Favorites</h1><p>Projects and tasks you've starred for quick access.</p></div></div>
    ${!ps.length && !ts.length ? `<div class="panel">${empty('star', 'No favorites yet', 'Star a project or task to pin it here.', `<button class="btn btn-secondary btn-sm" data-a="go" data-r="projects">Browse projects</button>`)}</div>` : `
    <h2 class="sec" style="margin-bottom:10px">Projects <span class="faint" style="font-weight:500">${ps.length}</span></h2>
    ${ps.length ? `<div class="pgrid" style="margin-bottom:28px">${ps.map(projectCard).join('')}</div>` : '<p class="faint" style="margin-bottom:28px">No favorite projects.</p>'}
    <h2 class="sec" style="margin-bottom:6px">Tasks <span class="faint" style="font-weight:500">${ts.length}</span></h2>
    ${ts.length ? `<div class="panel" style="overflow:hidden">${ts.map(t => miniRow(t)).join('')}</div>` : '<p class="faint">Open a task and click the star to add it here.</p>'}`}
  </div>`;
}

/* ---------- PROJECTS ---------- */
function projectCard(p) {
  const ts = tasksOf(p.id); const pr = progressOf(p.id); const open = ts.filter(t => t.status !== 'done').length;
  const locked = !canSee(p);
  return `<div class="pcard" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project" role="link" tabindex="0" aria-label="${esc(p.name)}">
    <div class="row">${pIcon(p)}<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b class="trunc" style="font-weight:600;font-size:14px">${esc(p.name)}</b>${p.fav ? `<span style="color:var(--amber)">${ic('star', 12)}</span>` : ''}${p.private ? `<span class="faint" data-tip="Private project">${ic('lock', 12)}</span>` : ''}</div></div>${pStatus(p.status)}</div>
    <div class="desc">${esc(p.desc)}</div>
    ${locked ? `<div class="row faint" style="font-size:12px">${ic('lock', 12)}Restricted — request access to see tasks</div>` : `<div class="row" style="gap:10px">${progBar(pr, p.status === 'complete' ? 'green' : p.status === 'risk' ? 'red' : '')}<span class="num" style="font-size:12px;font-weight:500">${pr}%</span></div>`}
    <div class="foot"><span class="row" style="gap:4px">${ic('circle-check', 12)}${locked ? '—' : `${ts.length - open}/${ts.length}`}</span><span class="row" style="gap:4px">${ic('calendar', 12)}${fmtDate(p.due)}</span><span class="row hide-m" style="gap:4px">${ic('clock', 12)}${ago(minsAgo(p.last))}</span><span class="sp"></span>${avStack(p.members, 3)}</div>
    <button class="ibtn ibtn-sm more" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Project options" style="background:var(--surface);box-shadow:0 0 0 1px var(--border)">${ic('ellipsis', 14)}</button>
  </div>`;
}
function pageProjects() {
  const u = S.ui; const q = (u.projQ || '').toLowerCase(); const st = u.projStatus || 'all'; const sort = u.projSort || 'recent';
  let ps = visibleProjects().filter(p => (st === 'all' || p.status === st) && (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  const sorter = { recent: p => p.last, name: p => p.name, due: p => p.due, progress: p => -progressOf(p.id) }[sort];
  ps.sort((a, b) => sorter(a) > sorter(b) ? 1 : -1);
  const view = u.projView;
  let body;
  if (!visibleProjects().length) body = `<div class="panel">${empty('folder-kanban', 'No projects yet', 'Create your first project to start organizing your work.', `<button class="btn btn-primary btn-sm" data-a="newProject">${ic('plus', 14)}Create project</button>`)}</div>`;
  else if (!ps.length) body = `<div class="panel">${empty('search-x', 'No results found', 'No projects match your search or filters. Try a different term.', `<button class="btn btn-secondary btn-sm" data-a="clearProjFilters">Clear filters</button>`)}</div>`;
  else if (view === 'grid') body = `<div class="pgrid">${ps.map(projectCard).join('')}</div>`;
  else if (view === 'list') body = `<div class="panel" style="overflow:hidden">${ps.map(p => { const pr = progressOf(p.id); return `<div class="mini" style="min-height:52px;gap:12px" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project">${pIcon(p)}<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b style="font-weight:500">${esc(p.name)}</b>${p.private ? ic('lock', 12) : ''}</div><div class="trunc faint" style="font-size:12px">${esc(p.desc)}</div></div><span class="hide-m">${pStatus(p.status)}</span><span class="row hide-m" style="width:140px">${progBar(pr)}<span class="num faint" style="font-size:11.5px">${pr}%</span></span><span class="num muted hide-m" style="width:70px;font-size:12px">${fmtDate(p.due)}</span>${avStack(p.members, 3)}<button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Options">${ic('ellipsis', 14)}</button></div>`; }).join('')}</div>`;
  else body = `<div class="panel" style="overflow-x:auto"><table class="perm-t" style="min-width:860px"><thead><tr><th style="padding-left:14px">Project</th><th style="text-align:left">Status</th><th style="text-align:left">Lead</th><th style="text-align:left">Team</th><th style="text-align:left;width:16%">Progress</th><th>Tasks</th><th style="text-align:left">Start</th><th style="text-align:left">Due</th><th style="text-align:left">Last activity</th><th></th></tr></thead><tbody>
    ${ps.map(p => { const ts = tasksOf(p.id); const pr = progressOf(p.id); return `<tr style="cursor:pointer" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project"><td style="padding-left:14px"><span class="row">${pIcon(p, '', 14)}<span style="font-weight:500">${esc(p.name)}</span></span></td><td style="text-align:left">${pStatus(p.status)}</td><td style="text-align:left"><span class="row">${av(p.lead, 'sm')}${esc(mem(p.lead)?.name)}</span></td><td style="text-align:left" class="muted">${TM[p.team]?.name}</td><td><span class="row">${progBar(pr)}<span class="num faint" style="font-size:11.5px">${pr}%</span></span></td><td class="num">${ts.length}</td><td style="text-align:left" class="num muted">${fmtDate(p.start)}</td><td style="text-align:left" class="num muted">${fmtDate(p.due)}</td><td style="text-align:left" class="muted">${ago(minsAgo(p.last))}</td><td><button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Options">${ic('ellipsis', 14)}</button></td></tr>`; }).join('')}
    </tbody></table></div>`;
  return `<div class="page wide" style="max-width:1280px">
    <div class="ph"><div><h1>Projects</h1><p>${visibleProjects().filter(p => p.status !== 'complete').length} active · ${visibleProjects().filter(p => p.status === 'complete').length} completed</p></div><div class="acts"><button class="btn btn-primary" data-a="newProject">${ic('plus', 14)}New project</button></div></div>
    <div class="row" style="margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="inwrap">${ic('search', 13)}<input class="input search-sm" id="proj-q" data-in="projQ" placeholder="Search projects" value="${esc(u.projQ || '')}" aria-label="Search projects"></div>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projStatus" aria-label="Filter by status"><option value="all">All statuses</option>${Object.entries(PSTAT).map(([k, v]) => `<option value="${k}" ${st === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projSort" aria-label="Sort">${[['recent', 'Recently active'], ['name', 'Name'], ['due', 'Due date'], ['progress', 'Progress']].map(([k, n]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>Sort: ${n}</option>`).join('')}</select>
      <span class="sp"></span>
      <div class="seg" role="tablist" aria-label="Layout">${[['grid', 'Grid', 'layout-grid'], ['list', 'List', 'list'], ['table', 'Table', 'table-2']].map(([k, n, i]) => `<button class="${view === k ? 'on' : ''}" data-a="set" data-k="projView" data-v="${k}" aria-label="${n}">${ic(i, 13)}<span class="hide-m">${n}</span></button>`).join('')}</div>
    </div>
    ${body}
  </div>`;
}

/* ---------- MEMBERS / PROFILE / TEAMS ---------- */
function pageMembers() {
  const u = S.ui; const q = (u.memQ || '').toLowerCase(); const role = u.memRole || 'all';
  const ms = D().members.filter(m => (role === 'all' || m.role === role) && (!q || m.name.toLowerCase().includes(q) || m.email.includes(q)));
  const isAdmin = ['Owner', 'Admin'].includes(me().role);
  const tab = u.membersTab;
  return `<div class="page wide" style="max-width:1200px">
    <div class="ph"><div><h1>Members</h1><p>${D().members.length} people in ${esc(D().ws.name)} · ${D().members.filter(m => m.status === 'invited').length} pending</p></div><div class="acts"><button class="btn btn-primary" data-a="invite">${ic('user-plus', 14)}Invite member</button></div></div>
    <div class="tabs" style="margin-bottom:14px">${[['members', 'Members'], ['teams', 'Teams'], ['roles', 'Roles & permissions']].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="set" data-k="membersTab" data-v="${k}">${n}</button>`).join('')}</div>
    ${tab === 'teams' ? `<div class="row" style="margin-bottom:12px"><span class="muted" style="font-size:13px">${teamsList().length} teams</span><span class="sp"></span><button class="btn btn-secondary btn-sm" data-a="newTeam">${ic('plus', 13)}New team</button></div>${teamsGrid()}` : tab === 'roles' ? permsTable() : `
    <div class="row" style="margin-bottom:12px;gap:8px;flex-wrap:wrap"><div class="inwrap">${ic('search', 13)}<input class="input search-sm" id="mem-q" data-in="memQ" placeholder="Search by name or email" value="${esc(u.memQ || '')}" aria-label="Search members"></div>
      <div class="seg">${['all', ...ROLES].map(r => `<button class="${role === r ? 'on' : ''}" data-a="set" data-k="memRole" data-v="${r}">${r === 'all' ? 'All' : r}</button>`).join('')}</div></div>
    <div class="panel" style="overflow-x:auto">${ms.length ? `<table class="perm-t" style="min-width:880px"><thead><tr><th style="padding-left:14px">Member</th><th style="text-align:left">Role</th><th style="text-align:left">Team</th><th>Active projects</th><th>Tasks</th><th style="text-align:left">Last active</th><th style="text-align:left">Status</th><th></th></tr></thead><tbody>
    ${ms.map(m => { const ap = visibleProjects().filter(p => p.members.includes(m.id) && p.status !== 'complete').length; const ot = allTasks().filter(t => t.assignee === m.id && t.status !== 'done').length;
      return `<tr data-ctx="member" data-id="${m.id}"><td style="padding-left:14px"><button class="row" data-a="go" data-r="member" data-id="${m.id}" style="gap:10px;text-align:left">${av(m.id, 'md', false)}<span class="col"><b style="font-weight:500">${esc(m.name)}${m.id === D().me ? ' <span class="faint" style="font-weight:400">(you)</span>' : ''}</b><span class="faint" style="font-size:12px">${esc(m.email)}</span></span></button></td>
      <td style="text-align:left">${isAdmin && m.role !== 'Owner' ? `<button class="pillbtn bordered" data-a="pop" data-pop="role" data-id="${m.id}">${m.role}${ic('chevron-down', 12)}</button>` : `<span class="pillbtn">${m.role === 'Owner' ? ic('crown', 13) : ''}${m.role}</span>`}</td>
      <td style="text-align:left"><span class="row">${ic(TM[m.team].icon, 13)}${TM[m.team].name}</span></td><td class="num">${ap}</td><td class="num">${ot}</td>
      <td style="text-align:left" class="muted">${m.last == null ? '—' : m.last < 5 ? '<span style="color:var(--green)">Online</span>' : ago(minsAgo(m.last))}</td>
      <td style="text-align:left">${m.status === 'invited' ? '<span class="badge amber"><span class="dot"></span>Invited</span>' : m.status === 'deactivated' ? '<span class="badge gray">Deactivated</span>' : '<span class="badge green"><span class="dot"></span>Active</span>'}</td>
      <td><button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="member" data-id="${m.id}" aria-label="Member options">${ic('ellipsis', 14)}</button></td></tr>`; }).join('')}
    </tbody></table>` : empty('search-x', 'No results found', 'No members match that search.', '', 'sm')}</div>`}
  </div>`;
}
function permsTable() {
  const rows = [['View projects & tasks', 1, 1, 1, 1], ['Comment on tasks', 1, 1, 1, 1], ['Create and edit tasks', 1, 1, 1, 0], ['Create projects', 1, 1, 1, 0], ['Invite members', 1, 1, 0, 0], ['Manage roles', 1, 1, 0, 0], ['Workspace settings', 1, 1, 0, 0], ['Billing', 1, 0, 0, 0], ['Delete workspace', 1, 0, 0, 0]];
  return `<div class="panel" style="overflow-x:auto"><table class="perm-t" style="min-width:560px"><thead><tr><th style="padding-left:14px">Permission</th>${ROLES.map(r => `<th>${r}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td style="padding-left:14px">${r[0]}</td>${r.slice(1).map(v => `<td>${v ? `<span style="color:var(--green);display:inline-flex" aria-label="Allowed">${ic('check', 15)}</span>` : `<span class="faint" style="display:inline-flex" aria-label="Not allowed">${ic('minus', 15)}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function teamsGrid() {
  return `<div class="pgrid">${teamsList().map(t => { const ms = D().members.filter(m => m.team === t.id); const ps = visibleProjects().filter(p => p.team === t.id);
    return `<div class="pcard" data-a="go" data-r="team" data-id="${t.id}" role="link" tabindex="0"><div class="row"><span class="picon" style="--c:${t.c}">${ic(t.icon, 15)}</span><b style="font-weight:600;font-size:14px">${t.name}</b></div><div class="desc">${t.desc}</div><div class="foot"><span class="row" style="gap:4px">${ic('users', 12)}${ms.length} members</span><span class="row" style="gap:4px">${ic('folder', 12)}${ps.length} projects</span><span class="sp"></span>${avStack(ms.map(m => m.id), 4)}</div></div>`; }).join('')}</div>`;
}
function pageTeams() { return `<div class="page"><div class="ph"><div><h1>Teams</h1><p>Groups of people who work on projects together.</p></div><div class="acts"><button class="btn btn-primary" data-a="newTeam">${ic('plus', 14)}New team</button></div></div>${teamsList().length ? teamsGrid() : `<div class="panel">${empty('users', 'No teams yet', 'Create a team to group people and give projects an owner.', `<button class="btn btn-primary btn-sm" data-a="newTeam">${ic('plus', 14)}New team</button>`)}</div>`}</div>`; }
function pageTeam() {
  const t = team(S.ui.params.id); if (!t) return page404();
  const ms = D().members.filter(m => m.team === t.id); const ps = visibleProjects().filter(p => p.team === t.id);
  const ts = allTasks().filter(x => ms.some(m => m.id === x.assignee) && x.status !== 'done');
  return `<div class="page">
    <div class="ph"><div class="row" style="gap:12px"><span class="picon lg" style="--c:${t.c}">${ic(t.icon, 18)}</span><div><h1>${t.name}</h1><p style="margin:2px 0 0">${t.desc}</p></div></div><div class="acts"><button class="btn btn-secondary" data-a="editTeam" data-id="${t.id}">${ic('pencil', 14)}Edit team</button><button class="btn btn-secondary" data-a="invite">${ic('user-plus', 14)}Invite to workspace</button></div></div>
    <div class="grid2"><div class="stack">
      <section class="panel"><div class="panel-h"><h2>Projects</h2><span class="faint">${ps.length}</span></div>${ps.map(p => `<div class="mini" data-a="go" data-r="project" data-id="${p.id}">${pIcon(p, '', 14)}<span class="tt">${esc(p.name)}</span>${pStatus(p.status)}<span class="row" style="width:120px">${progBar(progressOf(p.id))}</span></div>`).join('') || '<div class="panel-b faint">No projects</div>'}</section>
      <section class="panel"><div class="panel-h"><h2>Open tasks</h2><span class="faint">${ts.length}</span></div>${sortTasks(ts, { f: 'due', dir: 1 }).slice(0, 8).map(x => miniRow(x)).join('')}</section>
    </div>
    <section class="panel" style="align-self:start"><div class="panel-h"><h2>Members</h2><span class="faint">${ms.length}</span></div>${ms.map(m => `<div class="mini" style="min-height:48px" data-a="go" data-r="member" data-id="${m.id}">${av(m.id, 'md', false)}<div class="grow"><div style="font-weight:500">${esc(m.name)}</div><div class="faint" style="font-size:12px">${esc(m.title)}</div></div><span class="badge">${m.role}</span></div>`).join('')}</section></div>
  </div>`;
}
function pageMember() {
  const m = mem(S.ui.params.id); if (!m) return page404();
  const ts = allTasks().filter(t => t.assignee === m.id);
  const open = ts.filter(t => t.status !== 'done'); const done = ts.filter(t => t.status === 'done');
  const ps = visibleProjects().filter(p => p.members.includes(m.id) && p.status !== 'complete' && canSee(p));
  const acts = D().activity.filter(a => a.by === m.id).slice(0, 8);
  const tab = S.ui.memTab || 'assigned';
  return `<div class="page">
    <div class="row" style="gap:18px;margin-bottom:22px;flex-wrap:wrap;align-items:flex-start">
      ${av(m.id, 'xl ' + (m.last != null && m.last < 5 ? 'presence' : ''), false)}
      <div class="grow" style="min-width:220px"><div class="row" style="gap:10px;flex-wrap:wrap"><h1 style="font-size:var(--fs-2xl);margin:0;font-weight:600;letter-spacing:-.02em">${esc(m.name)}</h1><span class="badge">${m.role === 'Owner' ? ic('crown', 11) : ''}${m.role}</span>${m.status === 'invited' ? '<span class="badge amber">Invite pending</span>' : ''}</div>
        <div class="muted" style="margin-top:3px">${esc(m.title)} · ${TM[m.team].name}</div>
        <div class="row faint" style="margin-top:8px;gap:14px;font-size:12.5px;flex-wrap:wrap"><span class="row" style="gap:5px">${ic('mail', 13)}<span style="user-select:all">${esc(m.email)}</span></span><span class="row" style="gap:5px">${ic('map-pin', 13)}${esc(m.tz)}</span><span class="row" style="gap:5px">${ic('clock', 13)}${m.last == null ? 'Never signed in' : m.last < 5 ? 'Online now' : 'Active ' + ago(minsAgo(m.last))}</span></div></div>
      <div class="row"><button class="btn btn-secondary" data-a="copyText" data-text="${esc(m.email)}">${ic('copy', 14)}Copy email</button><button class="btn btn-primary" data-a="newTask" data-assignee="${m.id}">${ic('plus', 14)}Assign task</button><button class="ibtn" data-a="ctxBtn" data-ctx="member" data-id="${m.id}" aria-label="More">${ic('ellipsis', 16)}</button></div>
    </div>
    <div class="stats" style="margin-bottom:18px">
      <div class="stat"><span class="k">Active projects</span><span class="v">${ps.length}</span></div>
      <div class="stat"><span class="k">Assigned tasks</span><span class="v">${open.length}</span></div>
      <div class="stat"><span class="k">Completed tasks</span><span class="v">${done.length}</span></div>
      <div class="stat"><span class="k">Overdue</span><span class="v" style="${open.filter(isOver).length ? 'color:var(--red)' : ''}">${open.filter(isOver).length}</span></div>
    </div>
    <div class="grid2"><section class="panel"><div class="tabs" style="padding:0 8px">${[['assigned', `Assigned · ${open.length}`], ['completed', `Completed · ${done.length}`]].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="set" data-k="memTab" data-v="${k}">${n}</button>`).join('')}</div>
      ${(tab === 'assigned' ? sortTasks(open, { f: 'due', dir: 1 }) : done).map(t => miniRow(t, { av: false })).join('') || empty('list-checks', 'No tasks here', 'Nothing to show in this list.', '', 'sm')}</section>
      <div class="stack"><section class="panel"><div class="panel-h"><h2>Active projects</h2></div>${ps.map(p => `<div class="mini" data-a="go" data-r="project" data-id="${p.id}">${pIcon(p, '', 14)}<span class="tt">${esc(p.name)}</span><span class="faint" style="font-size:12px">${p.lead === m.id ? 'Lead' : 'Member'}</span></div>`).join('') || '<div class="panel-b faint">No active projects</div>'}</section>
      <section class="panel"><div class="panel-h"><h2>Recent activity</h2></div><div class="panel-b feed">${acts.map(a => actHtml(a)).join('') || '<span class="faint">No recent activity</span>'}</div></section></div></div>
  </div>`;
}

/* ---------- ACTIVITY ---------- */
function pageActivity() {
  const f = S.ui.actFilter || 'all'; const who = S.ui.actWho || 'all';
  let as = D().activity.filter(a => !a.project || canSee(proj(a.project)));
  if (f !== 'all') as = as.filter(a => f === 'comments' ? a.verb.includes('comment') : f === 'status' ? /moved|completed|reopened/.test(a.verb) : f === 'projects' ? a.verb.includes('project') : true);
  if (who !== 'all') as = as.filter(a => a.by === who);
  const b = {}; as.forEach(a => (b[dayBucket(a.at)] ||= []).push(a));
  return `<div class="page" style="max-width:820px">
    <div class="ph"><div><h1>Activity</h1><p>Everything that's changed across the workspace.</p></div></div>
    <div class="row" style="gap:8px;margin-bottom:6px;flex-wrap:wrap"><div class="seg">${[['all', 'All'], ['status', 'Status changes'], ['comments', 'Comments'], ['projects', 'Projects']].map(([k, n]) => `<button class="${f === k ? 'on' : ''}" data-a="set" data-k="actFilter" data-v="${k}">${n}</button>`).join('')}</div>
    <select class="select" style="height:26px;width:auto;font-size:12px" data-in="actWho" aria-label="Filter by person"><option value="all">Everyone</option>${D().members.map(m => `<option value="${m.id}" ${who === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
    ${as.length ? Object.entries(b).map(([k, list]) => `<div class="day-h">${k}</div><div class="feed lined">${list.map(a => actHtml(a, { proj: true })).join('')}</div>`).join('') : empty('activity', 'No activity yet', 'Changes to tasks and projects will appear here.')}
  </div>`;
}

/* ---------- SEARCH RESULTS ---------- */
function searchAll(q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return { tasks: [], projects: [], people: [], files: [], comments: [] };
  const has = s => (s || '').toLowerCase().includes(q);
  return {
    tasks: allTasks().filter(t => has(t.title) || has(t.key) || has(t.desc.replace(/<[^>]+>/g, ''))).slice(0, 30),
    projects: visibleProjects().filter(p => has(p.name) || has(p.desc)),
    people: D().members.filter(m => has(m.name) || has(m.email) || has(m.title)),
    files: D().files.filter(f => has(f.name) && canSee(proj(f.project))),
    comments: D().comments.filter(c => has(c.text) && task(c.task) && canSee(proj(task(c.task).project))),
  };
}
function pageSearch() {
  const q = S.ui.searchQ; const r = searchAll(q); const cat = S.ui.searchCat;
  const cats = [['all', 'All'], ['tasks', 'Tasks'], ['projects', 'Projects'], ['people', 'People'], ['files', 'Files'], ['comments', 'Comments']];
  const total = Object.values(r).reduce((a, b) => a + b.length, 0);
  const sec = (k, title, html) => (cat === 'all' || cat === k) && r[k].length ? `<section style="margin-bottom:22px"><div class="eyebrow" style="margin-bottom:6px">${title} · ${r[k].length}</div><div class="panel" style="overflow:hidden">${html}</div></section>` : '';
  return `<div class="page" style="max-width:860px">
    <div class="inwrap" style="margin-bottom:14px">${ic('search', 16)}<input class="input input-lg" id="search-page-q" data-in="searchQ" placeholder="Search tasks, projects, people, files, and comments" value="${esc(q)}" style="padding-left:34px;font-size:15px" aria-label="Search"></div>
    <div class="tabs" style="margin-bottom:18px">${cats.map(([k, n]) => `<button class="tab ${cat === k ? 'on' : ''}" data-a="set" data-k="searchCat" data-v="${k}">${n}<span class="cnt">${k === 'all' ? total : r[k].length}</span></button>`).join('')}</div>
    ${!q ? `<div class="row" style="gap:6px;flex-wrap:wrap"><span class="faint" style="font-size:12.5px">Recent:</span>${D().recentSearches.map(s => `<button class="badge" data-a="setSearch" data-q="${esc(s)}">${ic('history', 11)}${esc(s)}</button>`).join('')}</div>` :
      total ? sec('tasks', 'Tasks', r.tasks.map(t => `<div class="mini" data-a="openTask" data-id="${t.id}">${stIcon(t.status)}<span class="mono faint" style="font-size:11px">${t.key}</span><span class="tt">${hl(t.title, q)}</span><span class="pj"><span class="pdot" style="--c:${pColor(proj(t.project))}"></span>${esc(proj(t.project).name)}</span>${av(t.assignee, 'sm')}</div>`).join(''))
      + sec('projects', 'Projects', r.projects.map(p => `<div class="mini" data-a="go" data-r="project" data-id="${p.id}">${pIcon(p, '', 13)}<span class="tt">${hl(p.name, q)} <span class="faint" style="font-size:12px">— ${esc(p.desc.slice(0, 70))}…</span></span>${pStatus(p.status)}</div>`).join(''))
      + sec('people', 'People', r.people.map(m => `<div class="mini" data-a="go" data-r="member" data-id="${m.id}">${av(m.id, 'md', false)}<span class="tt">${hl(m.name, q)} <span class="faint" style="font-size:12px">${esc(m.title)}</span></span><span class="faint" style="font-size:12px">${esc(m.email)}</span></div>`).join(''))
      + sec('files', 'Files', r.files.map(f => `<div class="mini" data-a="go" data-r="project" data-id="${f.project}" data-tab="files"><span class="ftype" style="--c:${FT[f.type].c}">${ic(FT[f.type].i, 14)}</span><span class="tt">${hl(f.name, q)}</span><span class="faint" style="font-size:12px">${f.size} · ${esc(proj(f.project).name)}</span></div>`).join(''))
      + sec('comments', 'Comments', r.comments.map(c => `<div class="mini" style="align-items:flex-start;padding-top:10px;padding-bottom:10px" data-a="openTask" data-id="${c.task}">${av(c.by, 'sm')}<div class="grow" style="min-width:0"><div style="font-size:12px" class="muted"><b style="color:var(--text);font-weight:500">${esc(mem(c.by).name)}</b> on ${esc(task(c.task).title)} · ${ago(c.at)}</div><div style="font-size:13px">${hl(c.text, q)}</div></div></div>`).join(''))
      : `<div class="panel">${empty('search-x', 'No results found', `Nothing matches “${q}”. Check the spelling or try a broader term.`, `<button class="btn btn-secondary btn-sm" data-a="setSearch" data-q="">Clear search</button>`)}</div>`}
  </div>`;
}

/* ---------- 404 / DENIED / FAILED ---------- */
function page404() {
  return `<div class="fullstate"><div class="box"><div class="empty-state" style="padding:0"><div class="glyph">${ic('file-question', 20)}</div></div><span class="code">ERROR 404</span><h1>Page not found</h1><p>The page you're looking for was moved, deleted, or never existed. Check the link or head back home.</p><div class="row"><button class="btn btn-secondary" data-a="back">${ic('arrow-left', 14)}Go back</button><button class="btn btn-primary" data-a="go" data-r="home">Go to Home</button></div></div></div>`;
}
function stateDenied(p) {
  const lead = mem(p?.lead);
  return `<div class="fullstate"><div class="box"><div class="empty-state" style="padding:0"><div class="glyph">${ic('lock', 20)}</div></div><span class="code">ERROR 403</span><h1>You don't have access</h1><p>${p ? `<b>${esc(p.name)}</b> is a private project. ` : ''}Ask ${lead ? esc(lead.name) : 'the project owner'} to add you, or request access and we'll let them know.</p><div class="row"><button class="btn btn-secondary" data-a="go" data-r="projects">Back to projects</button><button class="btn btn-primary" data-a="requestAccess" data-id="${p?.id || ''}">Request access</button></div></div></div>`;
}
function stateFailed() {
  return `<div class="fullstate"><div class="box"><div class="empty-state err" style="padding:0"><div class="glyph">${ic('cloud-alert', 20)}</div></div><h1>Something went wrong.</h1><p>This page failed to load. Your data is safe — try again in a moment.</p><div class="row"><button class="btn btn-secondary" data-a="go" data-r="home">Go to Home</button><button class="btn btn-primary" data-a="reload">${ic('refresh-cw', 14)}Try again</button></div></div></div>`;
}
