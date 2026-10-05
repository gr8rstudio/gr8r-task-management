/* =====================================================================
   OVERLAYS: drawer, modals, popovers, context menus, command palette
   ===================================================================== */
function renderLayer() {
  const u = S.ui; let h = '';
  if (u.drawer && task(u.drawer)) h += (u.drawerFull ? `<div class="drawer-scrim full${u.fx.drawer ? ' enter' : ''}" data-a="closeDrawer"></div>` : '') + drawerHtml(task(u.drawer));
  u.modals.forEach((m, i) => { const en = u.fx.modal === i + 1; h += `<div class="scrim${en ? ' enter' : ''}" data-a="closeModal" style="z-index:${60 + i * 2}"></div><div class="modal-wrap" data-a="closeModalBg" style="z-index:${61 + i * 2}">${en ? modalHtml(m).replace('class="modal ', 'class="modal enter ') : modalHtml(m)}</div>`; });
  if (u.palette) h += `<div class="scrim" data-a="closePalette" style="z-index:89"></div>${paletteHtml()}`;
  if (u.pop) h += popHtml(u.pop);
  return h;
}

/* ---------------- TASK DRAWER ---------------- */
function drawerHtml(t) {
  const p = proj(t.project); const u = S.ui;
  const cs = commentsOf(t.id); const sd = t.subtasks.filter(s => s.done).length;
  const acts = D().activity.filter(a => a.task === t.id);
  const tab = u.drawerTab;
  const prop = (icon, label, val) => `<dt>${ic(icon, 14)}${label}</dt><dd>${val}</dd>`;
  const ups = (u.uploads || []).filter(x => x.task === t.id);
  const ment = u.mention && u.mention.tid === t.id ? D().members.filter(m => m.name.toLowerCase().startsWith(u.mention.q.toLowerCase()) || m.name.split(' ')[1]?.toLowerCase().startsWith(u.mention.q.toLowerCase())).slice(0, 5) : [];
  const sub = u.subOpen && u.subOpen.tid === t.id ? t.subtasks.find(s => s.id === u.subOpen.sid) : null;
  return `<aside class="drawer ${u.drawerFull ? 'full' : ''} ${u.fx.drawer ? 'enter' : ''} ${u.fx.tabs ? 'fx-tabs' : ''}" role="dialog" aria-modal="${u.drawerFull}" aria-labelledby="d-h" tabindex="-1">
    <h2 class="sr" id="d-h">${sub ? 'Subtask: ' + esc(sub.title) : 'Task: ' + esc(t.title)}</h2>
    <div class="drawer-h">
      <button class="pillbtn" data-a="go" data-r="project" data-id="${p.id}" data-tab="board" style="font-size:12.5px"><span class="pdot" style="--c:${pColor(p)}"></span>${esc(p.name)}</button><span class="faint">/</span><span class="mono faint" style="font-size:11.5px;padding:0 6px">${t.key}</span>
      <span class="sp"></span>
      <button class="btn btn-sm ${t.status === 'done' ? 'btn-secondary' : 'btn-ghost'}" data-a="toggleDone" data-id="${t.id}" style="${t.status === 'done' ? 'color:var(--green)' : ''}">${ic(t.status === 'done' ? 'circle-check' : 'circle', 14)}<span class="hide-m">${t.status === 'done' ? 'Completed' : 'Mark complete'}</span></button>
      <button class="ibtn ibtn-sm" data-a="toggleFavTask" data-id="${t.id}" data-tip="${t.fav ? 'Unfavorite' : 'Favorite'}" aria-pressed="${t.fav}" aria-label="Favorite" style="${t.fav ? 'color:var(--amber)' : ''}">${ic('star', 15)}</button>
      <button class="ibtn ibtn-sm" data-a="copyLink" data-id="${t.id}" data-tip="Copy link" aria-label="Copy link">${ic('link', 15)}</button>
      <button class="ibtn ibtn-sm hide-m" data-a="toggleDrawerFull" data-tip="${u.drawerFull ? 'Side panel' : 'Full page'}" aria-label="Toggle full page">${ic(u.drawerFull ? 'minimize-2' : 'maximize-2', 15)}</button>
      <button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="task" data-id="${t.id}" aria-label="More">${ic('ellipsis', 15)}</button>
      <button class="ibtn ibtn-sm" data-a="closeDrawer" data-tip="Close  Esc" aria-label="Close">${ic('x', 16)}</button>
    </div>
    <div class="drawer-b" data-keep="drawer:${t.id}${sub ? ':' + sub.id : ''}">${sub ? subtaskHtml(t, sub) : `
      ${t.status === 'done' ? `<div class="alert ok" style="margin-bottom:12px">${ic('circle-check', 15)}<span>Completed ${t.completedAt ? ago(t.completedAt) : ''}. <button class="link" data-a="toggleDone" data-id="${t.id}">Reopen task</button></span></div>` : isOver(t) ? `<div class="alert danger" style="margin-bottom:12px">${ic('clock-alert', 15)}<span>Overdue by ${-diffD(parse(t.due), TODAY)} day${-diffD(parse(t.due), TODAY) > 1 ? 's' : ''}. <button class="link" data-a="pop" data-pop="date" data-field="due" data-id="${t.id}">Reschedule</button></span></div>` : ''}
      <textarea class="ttl-edit" id="d-title" rows="1" data-autosize data-blur="commitDrawerTitle" data-key-enter="blur" data-id="${t.id}" aria-label="Task title">${esc(t.title)}</textarea>
      <dl class="kv" style="margin-top:12px;${u.drawerFull ? 'grid-template-columns:112px minmax(0,1fr) 112px minmax(0,1fr)' : ''}">
        ${prop('circle-dot', 'Status', cellStatus(t))}
        ${prop('signal-high', 'Priority', cellPrio(t))}
        ${prop('user', 'Assignee', cellAssignee(t))}
        ${prop('calendar', 'Due date', cellDue(t))}
        ${prop('calendar-arrow-up', 'Start date', `<button class="pillbtn ${t.start ? '' : 'empty'}" data-a="pop" data-pop="date" data-field="start" data-id="${t.id}">${ic('calendar', 13)}${t.start ? fmtDate(t.start) : 'Set date'}</button>`)}
        ${prop('folder', 'Project', cellProject(t))}
        ${prop('tag', 'Labels', `<button class="pillbtn ${t.labels.length ? '' : 'empty'}" data-a="pop" data-pop="labels" data-id="${t.id}" style="flex-wrap:wrap;height:auto;min-height:26px;padding:3px 7px">${t.labels.length ? t.labels.map(lbl).join('') : ic('tag', 13) + 'Add labels'}</button>`)}
        ${prop('repeat', 'Repeat', `<button class="pillbtn ${t.recur ? '' : 'empty'}" data-a="pop" data-pop="recur" data-id="${t.id}">${ic('repeat', 13)}${t.recur || 'Does not repeat'}</button>`)}
        ${prop('timer', 'Estimate', `<button class="pillbtn ${t.estimate ? '' : 'empty'}" data-a="pop" data-pop="estimate" data-id="${t.id}">${ic('timer', 13)}${t.estimate ? esc(t.estimate) : 'Add estimate'}</button>`)}
        ${prop('git-branch', 'Blocked by', `<button class="pillbtn ${t.deps.length ? '' : 'empty'}" data-a="pop" data-pop="deps" data-id="${t.id}" style="height:auto;min-height:26px;flex-wrap:wrap">${t.deps.length ? t.deps.map(d => task(d) ? `<span class="depchip mono" style="font-size:11px;padding:1px 5px;border-radius:4px;background:var(--surface-3)">${task(d).key}</span><span class="trunc" style="max-width:160px">${esc(task(d).title)}</span>` : '').join('') : ic('git-branch', 13) + 'None'}</button>`)}
      </dl>

      <div class="dsec"><div class="dsec-h"><h3 id="d-desc-l">Description</h3><div class="rte-tb" role="toolbar" aria-label="Formatting" aria-controls="d-desc">
          ${[['bold', 'bold', 'Bold'], ['italic', 'italic', 'Italic'], ['insertUnorderedList', 'list', 'Bulleted list'], ['insertOrderedList', 'list-ordered', 'Numbered list'], ['formatBlock:h4', 'heading', 'Heading'], ['createLink', 'link', 'Link']].map(([c, i, n]) => `<button class="ibtn ibtn-xs" data-cmd="${c}" data-tip="${n}" aria-label="${n}">${ic(i, 13)}</button>`).join('')}
        </div></div>
        <div class="rte"><div class="rte-body" id="d-desc" contenteditable="true" data-rte="${t.id}" data-ph="Add a description…" role="textbox" aria-multiline="true" aria-labelledby="d-desc-l">${t.desc}</div></div>
      </div>

      <div class="dsec"><div class="dsec-h"><h3>Subtasks</h3><span class="cnt num">${sd}/${t.subtasks.length}</span>${t.subtasks.length ? `<span style="width:90px;display:flex">${progBar(Math.round(sd / t.subtasks.length * 100), sd === t.subtasks.length ? 'green' : '')}</span>` : ''}</div>
        ${t.subtasks.map(s => `<div class="subt ${s.done ? 'done' : ''}${fxc('added', s.id)}${fxc('done', s.id)}"><input type="checkbox" class="check" ${s.done ? 'checked' : ''} data-a="toggleSub" data-id="${t.id}" data-sid="${s.id}" aria-label="${s.done ? 'Reopen' : 'Complete'} subtask ${esc(s.title)}"><button class="s" data-a="openSub" data-id="${t.id}" data-sid="${s.id}">${esc(s.title)}</button>${s.due ? `<span class="due ${!s.done && diffD(parse(s.due), TODAY) < 0 ? 'over' : ''}">${ic('calendar', 12)}${relDate(s.due)}</span>` : ''}${s.assignee ? av(s.assignee, 'sm') : ''}<button class="ibtn ibtn-xs x" data-a="openSub" data-id="${t.id}" data-sid="${s.id}" aria-label="Open subtask details" tabindex="-1">${ic('chevron-right', 14)}</button></div>`).join('')}
        <div class="subt" style="color:var(--text-3)">${ic('plus', 15)}<input class="inline-in" id="d-sub" data-key-enter="addSub" data-id="${t.id}" placeholder="Add subtask" aria-label="Add subtask" style="font-size:13.5px"></div>
      </div>

      <div class="dsec"><div class="dsec-h"><h3>Attachments</h3><span class="cnt">${t.attachments.length}</span><div class="acts"><label class="btn btn-sm btn-ghost" style="cursor:pointer">${ic('upload', 13)}Upload<input type="file" multiple hidden data-in="uploadFiles" data-task="${t.id}" data-project="${t.project}"></label></div></div>
        ${ups.map(x => `<div class="upl" style="margin-bottom:6px"><span class="ftype" style="--c:${FT[fileType(x.name)].c}">${ic(FT[fileType(x.name)].i, 14)}</span><div class="grow"><div class="row"><span class="trunc">${esc(x.name)}</span><span class="sp"></span><span class="faint num" id="upct-${x.id}" style="font-size:11px">${x.pct}%</span></div><div class="prog" style="margin-top:5px"><i id="upbar-${x.id}" style="width:${x.pct}%"></i></div></div></div>`).join('')}
        ${t.attachments.length ? `<div class="att">${t.attachments.map(f => `<div class="attc" data-a="filePreview" data-tid="${t.id}" data-aid="${f.id}" role="button" tabindex="0">${filePrev(f)}<div class="fi"><div class="trunc" style="font-weight:500">${esc(f.name)}</div><div class="faint">${FT[f.type]?.n || 'File'} · ${f.size}</div></div><button class="ibtn ibtn-xs x" data-a="rmAttach" data-id="${t.id}" data-aid="${f.id}" aria-label="Remove attachment">${ic('x', 12)}</button></div>`).join('')}</div>` : !ups.length ? `<label class="dropzone" style="padding:12px" data-dropzone-task="${t.id}">${ic('paperclip', 15)}<span>Drop files or click to attach</span><input type="file" multiple hidden data-in="uploadFiles" data-task="${t.id}" data-project="${t.project}"></label>` : ''}
      </div>

      <div class="dsec">
        <div class="tabs" style="margin-bottom:6px">${[['comments', `Comments`, cs.length], ['activity', 'Activity', acts.length]].map(([k, n, c]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="set" data-k="drawerTab" data-v="${k}">${n}<span class="cnt">${c}</span></button>`).join('')}</div>
        ${tab === 'comments' ? `
          ${cs.length ? cs.map(commentHtml).join('') : `<p class="faint" style="font-size:13px;margin:10px 0">No comments yet. Start the conversation.</p>`}
          <div class="row" style="align-items:flex-start;gap:10px;margin-top:8px">${av(D().me, 'md', false)}<div class="grow" style="position:relative">
            <div class="cbox"><textarea id="d-cmt" data-in="draft" data-id="${t.id}" data-key-mod-enter="postComment" placeholder="Leave a comment… type @ to mention" aria-label="Comment" rows="2" data-autosize>${esc(u.drafts[t.id] || '')}</textarea>
            <div class="row"><button class="ibtn ibtn-xs" data-a="insertAt" data-id="${t.id}" data-tip="Mention someone" aria-label="Mention">${ic('at-sign', 14)}</button><label class="ibtn ibtn-xs" data-tip="Attach file" style="cursor:pointer">${ic('paperclip', 14)}<input type="file" multiple hidden data-in="uploadFiles" data-task="${t.id}" data-project="${t.project}"></label><span class="sp"></span><span class="faint hide-m" style="font-size:11px">${MOD}+Enter</span><button class="btn btn-primary btn-sm" data-a="postComment" data-id="${t.id}">Comment</button></div></div>
            ${ment.length ? `<div class="pop" style="position:absolute;top:auto;bottom:calc(100% + 4px);left:0">${ment.map(m => `<button class="mi" data-a="pickMention" data-id="${t.id}" data-name="${esc(m.name)}">${av(m.id, 'sm', false)}${esc(m.name)}<span class="r">${esc(m.title)}</span></button>`).join('')}</div>` : ''}
          </div></div>` : `
          <div style="padding-top:4px">${acts.map(a => `<div class="act-line"><span class="ico">${av(a.by, 'sm', false)}</span><span class="grow"><b>${esc(mem(a.by)?.id === D().me ? 'You' : mem(a.by)?.name)}</b> ${esc(a.verb.replace(/ of$/, ''))}${a.extra ? ' ' + esc(a.extra) : ''}</span><time class="faint" style="font-size:11.5px">${ago(a.at)}</time></div>`).join('')}
          <div class="act-line"><span class="ico">${ic('plus', 13)}</span><span class="grow">Task created</span><time class="faint" style="font-size:11.5px">${ago(t.created)}</time></div></div>`}
      </div>`}
    </div>
  </aside>`;
}
function commentHtml(c) {
  const m = mem(c.by); const mine = c.by === D().me;
  return `<div class="cmt">${av(c.by, 'md', false)}<div class="body"><div class="who"><b>${esc(m?.name)}</b><time>${ago(c.at)}</time>${mine ? `<span class="sp"></span><button class="ibtn ibtn-xs" data-a="delComment" data-id="${c.id}" aria-label="Delete comment" data-tip="Delete">${ic('trash-2', 12)}</button>` : ''}</div><div class="txt">${fmtComment(c.text)}</div>
    <div class="reacts">${Object.entries(c.re || {}).filter(([, v]) => v.length).map(([e, v]) => `<button class="react ${v.includes(D().me) ? 'mine' : ''}" data-a="react" data-id="${c.id}" data-e="${e}" aria-label="${e} ${v.length}" title="${v.map(i => mem(i)?.name).join(', ')}">${e}<span class="num">${v.length}</span></button>`).join('')}<button class="react" data-a="pop" data-pop="emoji" data-id="${c.id}" aria-label="Add reaction" style="color:var(--text-3)">${ic('smile-plus', 13)}</button></div></div></div>`;
}

/* ---------------- MODALS ---------------- */
function openModal(m) { S.ui.modalOpeners = S.ui.modalOpeners || []; S.ui.modalOpeners[S.ui.modals.length] = S.ui.popOpener && S.ui.pop ? S.ui.popOpener : focusKey(document.activeElement); S.ui.modals.push(m); S.ui.pop = null; render(); setTimeout(() => { const f = $('.modal:last-of-type [autofocus]') || $$('.modal input, .modal textarea').pop(); const all = $$('.modal'); const last = all[all.length - 1]; const af = last?.querySelector('[autofocus]'); (af || last?.querySelector('input,textarea,button'))?.focus(); }, 30); }
function closeModal() { S.ui.modals.pop(); S.ui.pop = null; render(); }
function modalHtml(m) {
  const H = (title, sub = '') => `<div class="modal-h"><div><h2 id="mt-${m.type}">${title}</h2>${sub ? `<div class="muted" style="font-size:12.5px;margin-top:2px">${sub}</div>` : ''}</div><button class="ibtn ibtn-sm" data-a="closeModal" aria-label="Close">${ic('x', 16)}</button></div>`;
  const wrap = (cls, inner) => `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="mt-${m.type}">${inner}</div>`;
  switch (m.type) {
    case 'task': return wrap('', taskModal(m, H));
    case 'project': return wrap('', projectModal(m, H));
    case 'share': return wrap('', shareModal(m, H));
    case 'invite': return wrap('', inviteModal(m, H));
    case 'confirm': return wrap('sm', confirmModal(m, H));
    case 'prompt': return wrap('sm', `${H(m.title)}<form class="modal-b" data-submit="promptSubmit"><div class="field"><label class="label" for="prompt-in">${esc(m.label)}</label><input class="input" id="prompt-in" value="${esc(m.value || '')}" autofocus></div></form><div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="promptSubmit">${esc(m.ok || 'Save')}</button></div>`);
    case 'shortcuts': return wrap('lg', shortcutsModal(H));
    case 'team': return wrap('', teamModal(m, H));
    case 'filePreview': return wrap('lg', filePreviewModal(m, H));
    case 'saveView': return wrap('sm', `${H('Save view', 'Save the current filters as a tab on this project.')}<form class="modal-b" data-submit="saveViewSubmit"><div class="field"><label class="label" for="sv-name">View name</label><input class="input" id="sv-name" placeholder="e.g. Design review queue" autofocus></div><div class="field"><label class="label" for="sv-type">Layout</label><select class="select" id="sv-type"><option value="list">List</option><option value="board">Board</option><option value="table">Table</option></select></div>${m.nf ? `<div class="hint">${m.nf} filter${m.nf > 1 ? 's' : ''} will be saved with this view.</div>` : '<div class="alert info">' + ic('info', 14) + '<span>No filters are active — the view will show all tasks. You can add filters after saving.</span></div>'}</form><div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="saveViewSubmit">Save view</button></div>`);
  }
  return '';
}
function formChip(pop, html, label) { return `<button class="pillbtn bordered" data-a="pop" data-pop="${pop}" data-id="__form" ${pop === 'date' ? `data-field="${label}"` : ''} aria-label="${esc(label)}">${html}</button>`; }
function taskModal(m, H) {
  const f = S.ui.form; const p = proj(f.project);
  const err = S.ui.errors.title;
  return `${H(m.edit ? 'Edit task' : 'New task', m.edit ? `<span class="mono">${task(m.edit)?.key}</span>` : '')}
  <form class="modal-b" data-submit="submitTask" style="gap:12px">
    <div class="field"><label class="sr" for="f-title">Task name</label><input class="input input-lg ${err ? 'is-error' : ''}" id="f-title" data-in="form" data-f="title" value="${esc(f.title)}" placeholder="Task name" autofocus aria-invalid="${!!err}" aria-describedby="f-title-err" style="font-size:15px;font-weight:500">${err ? `<span class="err" id="f-title-err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    <div class="field"><label class="sr" for="f-desc">Description</label><textarea class="textarea" id="f-desc" data-in="form" data-f="desc" placeholder="Add a description… (optional)" rows="3">${esc(f.desc)}</textarea></div>
    <div class="row" style="flex-wrap:wrap;gap:6px">
      ${formChip('project', `<span class="pdot" style="--c:${pColor(p)}"></span>${esc(p?.name || 'Project')}`, 'Project')}
      ${formChip('status', stPill(f.status), 'Status')}
      ${formChip('assignee', `${av(f.assignee, 'sm', false)}${esc(mem(f.assignee)?.name || 'Assignee')}`, 'Assignee')}
      ${formChip('priority', prPill(f.priority), 'Priority')}
      ${formChip('date', `${ic('calendar', 13)}${f.due ? 'Due ' + fmtDate(f.due) : 'Due date'}`, 'due')}
      ${formChip('date', `${ic('calendar-arrow-up', 13)}${f.start ? 'Starts ' + fmtDate(f.start) : 'Start date'}`, 'start')}
      ${formChip('labels', f.labels.length ? f.labels.map(lbl).join('') : `${ic('tag', 13)}Labels`, 'Labels')}
      ${formChip('recur', `${ic('repeat', 13)}${f.recur || 'Repeat'}`, 'Repeat')}
    </div>
    <div class="field"><span class="label">Subtasks</span>
      ${f.subtasks.map((s, i) => `<div class="subt" style="padding:0 4px">${ic('circle', 13)}<span class="s">${esc(s.title)}</span><button type="button" class="ibtn ibtn-xs x" style="opacity:1" data-a="formRmSub" data-i="${i}" aria-label="Remove">${ic('x', 12)}</button></div>`).join('')}
      <div class="inwrap">${ic('plus', 14)}<input class="input" id="f-sub" data-key-enter="formAddSub" placeholder="Add a subtask and press Enter"></div></div>
    <div class="field"><span class="label">Attachments</span>
      ${f.files.length ? `<div class="col" style="gap:4px">${f.files.map((x, i) => `<div class="upl" style="padding:6px 10px"><span class="ftype" style="--c:${FT[x.type].c};width:22px;height:22px">${ic(FT[x.type].i, 12)}</span><span class="grow trunc">${esc(x.name)}</span><span class="faint" style="font-size:11.5px">${x.size}</span><button type="button" class="ibtn ibtn-xs" data-a="formRmFile" data-i="${i}" aria-label="Remove">${ic('x', 12)}</button></div>`).join('')}</div>` : ''}
      <label class="dropzone" style="padding:10px">${ic('paperclip', 14)}<span>Attach files</span><input type="file" multiple hidden data-in="formFiles"></label></div>
  </form>
  <div class="modal-f">${m.edit ? '' : `<label class="row" style="gap:8px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" class="toggle" id="f-more" data-in="formMore" ${f.more ? 'checked' : ''}>Create more</label>`}<span class="sp"></span>
    <span class="faint hide-m" style="font-size:11.5px"><kbd>${MOD}</kbd> <kbd>↵</kbd></span>
    <button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="submitTask" id="f-submit">${m.edit ? 'Save changes' : 'Create task'}</button></div>`;
}
const TEMPLATES = [
  { id: 'blank', name: 'Blank project', icon: 'file', desc: 'Start from scratch', tasks: [] },
  { id: 'product', name: 'Product Development', icon: 'target', desc: 'Discovery to launch', tasks: ['Define problem statement', 'User research plan', 'Write PRD', 'Design exploration', 'Build MVP', 'Beta launch'] },
  { id: 'web', name: 'Website', icon: 'globe', desc: 'IA, design, build, launch', tasks: ['Sitemap & information architecture', 'Wireframes', 'Visual design', 'Build page templates', 'Content migration', 'QA & launch'] },
  { id: 'mkt', name: 'Marketing Campaign', icon: 'megaphone', desc: 'Brief, assets, channels', tasks: ['Campaign brief', 'Audience research', 'Creative assets', 'Channel plan', 'Launch campaign', 'Performance report'] },
  { id: 'design', name: 'Design Project', icon: 'palette', desc: 'Discovery to handoff', tasks: ['Discovery workshop', 'Moodboard', 'Concept directions', 'Refinement', 'Developer handoff'] },
  { id: 'software', name: 'Software Development', icon: 'code', desc: 'Spec, build, ship', tasks: ['Technical spec', 'Set up repo & CI', 'Implement core API', 'Write tests', 'Code review', 'Deploy to staging'] },
  { id: 'personal', name: 'Personal Project', icon: 'heart', desc: 'Plan your own goals', tasks: ['Brain dump ideas', 'Pick top 3 priorities', 'Schedule focus time', 'Weekly review'] },
];
function projectModal(m, H) {
  const f = S.ui.pform; const err = S.ui.errors.pname;
  return `${H(m.edit ? 'Project settings' : 'New project', m.edit ? '' : 'Projects hold tasks, files, and conversations for one body of work.')}
  <form class="modal-b" data-submit="submitProject">
    <div class="row" style="gap:10px;align-items:flex-start">
      <button type="button" class="picon lg" style="--c:${PCOLORS[f.color]};cursor:default;flex-shrink:0;margin-top:22px" aria-hidden="true" tabindex="-1">${ic(f.icon, 18)}</button>
      <div class="field grow"><label class="label" for="p-name">Project name</label><input class="input ${err ? 'is-error' : ''}" id="p-name" data-in="pform" data-f="name" value="${esc(f.name)}" placeholder="e.g. Website Redesign" autofocus aria-invalid="${!!err}">${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    </div>
    <div class="field"><label class="label" for="p-desc">Description</label><textarea class="textarea" id="p-desc" data-in="pform" data-f="desc" rows="2" placeholder="What is this project about?">${esc(f.desc)}</textarea></div>
    <div class="row" style="gap:16px;align-items:flex-start;flex-wrap:wrap">
      <div class="field" style="flex:1;min-width:220px"><span class="label">Icon</span><div class="iconpick" role="radiogroup" aria-label="Icon">${PICONS.map(i => `<button type="button" role="radio" aria-checked="${f.icon === i}" class="${f.icon === i ? 'on' : ''}" data-a="pformSet" data-f="icon" data-v="${i}" aria-label="${i}">${ic(i, 15)}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Color</span><div class="swatches" role="radiogroup" aria-label="Color" style="max-width:140px">${Object.entries(PCOLORS).map(([k, v]) => `<button type="button" role="radio" aria-checked="${f.color === k}" class="sw ${f.color === k ? 'on' : ''}" style="--c:${v};width:22px;height:22px" data-a="pformSet" data-f="color" data-v="${k}" aria-label="${k}">${f.color === k ? ic('check', 12) : ''}</button>`).join('')}</div></div>
    </div>
    <div class="row" style="gap:12px;flex-wrap:wrap">
      <div class="field" style="flex:1;min-width:150px"><label class="label" for="p-team">Team</label><select class="select" id="p-team" data-in="pform" data-f="team">${teamsList().map(t => `<option value="${t.id}" ${f.team === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
      <div class="field" style="flex:1;min-width:150px"><label class="label" for="p-lead">Lead</label><select class="select" id="p-lead" data-in="pform" data-f="lead">${D().members.filter(x => x.status === 'active').map(x => `<option value="${x.id}" ${f.lead === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field" style="flex:1;min-width:150px"><label class="label" for="p-due">Target date</label><input type="date" class="input" id="p-due" data-in="pform" data-f="due" value="${f.due || ''}"></div>
    </div>
    ${m.edit ? '' : `<div class="field"><span class="label">Template</span><div class="tmpls" role="radiogroup">${TEMPLATES.map(t => `<button type="button" role="radio" aria-checked="${f.tmpl === t.id}" class="opt ${f.tmpl === t.id ? 'on' : ''}" data-a="pformSet" data-f="tmpl" data-v="${t.id}" style="padding:10px">${ic(t.icon, 16)}<b style="font-size:12.5px">${t.name}</b><span>${t.tasks.length ? t.tasks.length + ' starter tasks' : t.desc}</span></button>`).join('')}</div></div>`}
  </form>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="submitProject">${m.edit ? 'Save changes' : 'Create project'}</button></div>`;
}
const PERMS = ['Can view', 'Can comment', 'Can edit', 'Full access'];
function shareModal(m, H) {
  const p = proj(m.id); p.perms = p.perms || {}; p.access = p.access || 'workspace';
  return `${H(`Share “${esc(p.name)}”`)}
  <div class="modal-b">
    <form class="row" style="gap:6px" data-submit="shareInvite"><div class="grow"><label class="sr" for="share-in">Invite by email</label><input class="input" id="share-in" placeholder="Add people by name or email" value="${esc(S.ui.shareQ || '')}" data-in="shareQ" autofocus></div>
      <select class="select" id="share-perm" style="width:132px" aria-label="Permission">${PERMS.map(x => `<option ${x === 'Can edit' ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <button class="btn btn-primary" data-a="shareInvite" type="button">Invite</button></form>
    ${S.ui.shareQ ? `<div class="panel" style="padding:4px">${D().members.filter(x => !p.members.includes(x.id) && (x.name.toLowerCase().includes(S.ui.shareQ.toLowerCase()) || x.email.includes(S.ui.shareQ.toLowerCase()))).map(x => `<button class="mi" data-a="shareAdd" data-id="${p.id}" data-mid="${x.id}">${av(x.id, 'sm', false)}${esc(x.name)}<span class="r">${esc(x.email)}</span></button>`).join('') || `<div class="mi faint" style="cursor:default">${S.ui.shareQ.includes('@') ? `Press Invite to send an invitation to ${esc(S.ui.shareQ)}` : 'No matching members — enter an email to invite someone new'}</div>`}</div>` : ''}
    <div><div class="eyebrow" style="margin-bottom:4px">People with access</div>
      ${p.members.map(id => { const x = mem(id); if (!x) return ''; const perm = id === p.lead ? 'Full access' : p.perms[id] || (x.role === 'Guest' ? 'Can comment' : 'Can edit');
        return `<div class="row" style="height:44px">${av(id, 'md', false)}<div class="grow"><div style="font-weight:500;font-size:13px">${esc(x.name)}${id === D().me ? ' <span class="faint" style="font-weight:400">(you)</span>' : ''}</div><div class="faint" style="font-size:11.5px">${esc(x.email)}${id === p.lead ? ' · Project lead' : ''}</div></div>
          ${id === p.lead ? `<span class="muted" style="font-size:12.5px;padding-right:8px">Full access</span>` : `<select class="select" style="width:auto;height:26px;font-size:12px;border-color:transparent;background-color:transparent" data-in="sharePerm" data-id="${p.id}" data-mid="${id}" aria-label="Permission for ${esc(x.name)}">${PERMS.map(q => `<option ${q === perm ? 'selected' : ''}>${q}</option>`).join('')}<option value="__remove">Remove access</option></select>`}</div>`; }).join('')}
    </div>
    <div style="border-top:1px solid var(--divider);padding-top:12px"><div class="eyebrow" style="margin-bottom:8px">General access</div>
      <div class="row" style="gap:10px"><span class="ftype" style="--c:var(--text-2)">${ic(p.access === 'private' ? 'lock' : 'building-2', 14)}</span><div class="grow"><select class="select" style="height:28px;width:auto;border-color:transparent;padding-left:4px;font-weight:500" data-in="shareAccess" data-id="${p.id}" aria-label="General access"><option value="private" ${p.access === 'private' ? 'selected' : ''}>Only people invited</option><option value="workspace" ${p.access === 'workspace' ? 'selected' : ''}>Everyone at ${esc(D().ws.name)}</option></select><div class="faint" style="font-size:11.5px;padding-left:4px">${p.access === 'private' ? 'Only people listed above can open this project.' : 'Anyone in the workspace can view and comment.'}</div></div></div></div>
  </div>
  <div class="modal-f"><button class="btn btn-secondary" data-a="copyLink" data-pid="${p.id}">${ic('link', 14)}Copy link</button><span class="sp"></span><button class="btn btn-primary" data-a="closeModal">Done</button></div>`;
}
function inviteModal(m, H) {
  const err = S.ui.errors.invite;
  return `${H('Invite to ' + esc(D().ws.name), 'Invited people get an email with a link to join.')}
  <form class="modal-b" data-submit="submitInvite">
    <div class="field"><label class="label" for="inv-emails">Email addresses</label><textarea class="textarea ${err ? 'is-error' : ''}" id="inv-emails" placeholder="name@company.com, another@company.com" rows="3" autofocus>${esc(S.ui.inviteDraft || '')}</textarea>${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : '<span class="hint">Separate multiple addresses with commas.</span>'}</div>
    <div class="row" style="gap:12px"><div class="field grow"><label class="label" for="inv-role">Role</label><select class="select" id="inv-role">${['Member', 'Admin', 'Guest'].map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field grow"><label class="label" for="inv-team">Team</label><select class="select" id="inv-team">${teamsList().map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div></div>
    <div class="alert info">${ic('info', 14)}<span><b>Guests</b> can only see projects they're added to and can't create projects.</span></div>
  </form>
  <div class="modal-f"><button class="btn btn-ghost" data-a="copyInviteLink">${ic('link', 14)}Copy invite link</button><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="submitInvite" id="inv-submit">Send invites</button></div>`;
}
function confirmModal(m, H) {
  const needs = m.typeName; const ok = !needs || (S.ui.confirmText || '') === needs;
  return `<div class="modal-b" style="padding-top:18px;gap:10px">
    <div class="row" style="gap:12px;align-items:flex-start"><span class="ftype" style="--c:${m.danger ? 'var(--red)' : 'var(--amber)'};width:34px;height:34px;border-radius:9px">${ic(m.icon || (m.danger ? 'trash-2' : 'archive'), 17)}</span>
    <div class="grow"><h2 id="mt-confirm" style="font-size:15px;font-weight:600;margin:4px 0 6px">${esc(m.title)}</h2><p class="muted" style="margin:0;font-size:13px;line-height:1.55">${m.body}</p></div></div>
    ${needs ? `<div class="field" style="margin-top:6px"><label class="label" for="confirm-in" style="font-weight:400;color:var(--text-2)">Type <b style="color:var(--text);font-weight:600">${esc(needs)}</b> to confirm</label><input class="input" id="confirm-in" data-in="confirmText" autocomplete="off" autofocus value="${esc(S.ui.confirmText || '')}"></div>` : ''}
  </div>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal" ${needs ? '' : 'autofocus'}>Cancel</button><button class="btn ${m.danger ? 'btn-danger' : 'btn-primary'}" data-a="confirmOk" ${ok ? '' : 'disabled'}>${esc(m.ok)}</button></div>`;
}
const SHORTCUTS = [
  ['General', [['Command menu', [MOD, 'K']], ['Search', ['/']], ['Keyboard shortcuts', ['?']], ['Toggle sidebar', ['[']], ['Toggle dark mode', [MOD, 'Shift', 'L']], ['Close panel or dialog', ['Esc']]]],
  ['Create', [['New task', ['N']], ['New project', ['P']], ['Submit form', [MOD, '↵']], ['Send comment', [MOD, '↵']]]],
  ['Navigate', [['Go to Home', ['G', 'H']], ['Go to My Tasks', ['G', 'T']], ['Go to Projects', ['G', 'P']], ['Go to Inbox', ['G', 'I']], ['Go to Calendar', ['G', 'C']], ['Go to Settings', ['G', 'S']]]],
  ['Command menu', [['Move selection', ['↑', '↓']], ['Run command', ['↵']], ['Search mode', ['Tab']]]],
];
function shortcutsModal(H) {
  return `${H('Keyboard shortcuts')}<div class="modal-b" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px">${SHORTCUTS.map(([g, list]) => `<div><div class="eyebrow" style="margin-bottom:6px">${g}</div>${list.map(([n, k]) => `<div class="row" style="height:30px;font-size:13px;border-bottom:1px solid var(--divider)"><span class="grow">${n}</span>${k.map((x, i) => `${i && k[0] === 'G' ? '<span class="faint" style="font-size:11px">then</span>' : ''}<kbd>${x}</kbd>`).join('')}</div>`).join('')}</div>`).join('')}</div>`;
}
function filePreviewModal(m, H) {
  const f = m.file; const t = FT[f.type] || FT.other;
  return `${H(esc(f.name), `${t.n} · ${f.size} · Uploaded by ${esc(mem(f.by)?.name || 'you')} ${ago(f.at)}`)}
  <div class="modal-b"><div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">${filePrev(f).replace('class="fprev"', 'class="fprev" style="aspect-ratio:16/9"')}</div>
  ${m.tid ? `<div class="row faint" style="font-size:12.5px">${ic('link', 13)}Attached to <button class="link" data-a="openTask" data-id="${m.tid}">${esc(task(m.tid)?.title)}</button></div>` : ''}</div>
  <div class="modal-f"><button class="btn btn-secondary" data-a="copyLink" data-fid="${f.id}">${ic('link', 14)}Copy link</button><span class="sp"></span><button class="btn btn-primary" data-a="closeModal">Close</button></div>`;
}

/* ---------------- POPOVERS ---------------- */
function openPop(el, extra = {}) {
  const r = el.getBoundingClientRect();
  const d = el.dataset;
  S.ui.popOpener = focusKey(el);
  S.ui.pop = { type: d.pop, id: d.id, key: d.key, i: d.i != null ? +d.i : undefined, field: d.field, date: d.date, x: r.left, y: r.bottom + 4, top: r.top, w: r.width, q: '', ...extra };
  if (d.pop === 'date') { const tk = task(d.id); const cur = S.ui.pop.id === '__form' ? S.ui.form[d.field] : d.field === 'subdue' ? tk?.subtasks[+d.i]?.due : tk?.[d.field]; S.ui.pop.m = iso(cur ? parse(cur) : TODAY); }
  render();
  setTimeout(() => { const q = $('.pop input[data-pop-q]'); if (q) { q.focus(); return; } const first = $('.pop.floating .mi[aria-checked="true"]') || $('.pop.floating .mi, .pop.floating button, .pop.floating input'); first?.focus({ preventScroll: true }); }, 10);
}
function placePop() {
  const el = $('.pop.floating'); const p = S.ui.pop; if (!el || !p) return;
  const w = el.offsetWidth, h = el.offsetHeight;
  let x = p.x, y = p.y;
  if (x + w > innerWidth - 8) x = Math.max(8, (p.right ? p.x : p.x + (p.w || 0)) - w);
  if (y + h > innerHeight - 8) y = Math.max(8, (p.top != null ? p.top - 4 : p.y) - h);
  el.style.left = x + 'px'; el.style.top = y + 'px';
}
function closePop() { if (S.ui.pop) { S.ui.pop = null; render(); } }
function tgt(p) { return p.id === '__form' ? S.ui.form : task(p.id); }
function popList(items, opt = {}) {
  const q = (S.ui.pop.q || '').toLowerCase();
  const list = items.filter(it => !q || it.name.toLowerCase().includes(q));
  return `${opt.search ? `<div class="pin"><input data-pop-q data-in="popQ" id="pop-q" placeholder="${opt.search}" value="${esc(S.ui.pop.q || '')}" aria-label="${opt.search}"></div>` : ''}
    ${list.map(it => `<button class="mi" data-a="${it.act || 'popPick'}" data-v="${esc(it.id)}" role="menuitemradio" aria-checked="${!!it.on}">${it.html || ''}<span class="trunc">${esc(it.name)}</span>${it.kbd ? `<span class="r"><kbd>${it.kbd}</kbd></span>` : ''}${it.on ? `<span class="ck">${ic('check', 14)}</span>` : ''}</button>`).join('') || `<div class="mi faint" style="cursor:default">No matches</div>`}`;
}
function miniCal(p, val) {
  const m = parse(p.m); const first = new Date(m.getFullYear(), m.getMonth(), 1); const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addD(start, i));
  const wdn = Array.from({ length: 7 }, (_, i) => WD[(i + S.prefs.weekStart) % 7].slice(0, 2));
  return `<div style="padding:6px 6px 2px;width:252px">
    <div class="row" style="margin-bottom:6px"><b style="font-weight:600;font-size:13px;padding-left:4px">${MONL[m.getMonth()]} ${m.getFullYear()}</b><span class="sp"></span><button class="ibtn ibtn-xs" data-a="popMonth" data-d="-1" aria-label="Previous month">${ic('chevron-left', 14)}</button><button class="ibtn ibtn-xs" data-a="popMonth" data-d="1" aria-label="Next month">${ic('chevron-right', 14)}</button></div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:11px">${wdn.map(d => `<span class="faint" style="padding:3px 0">${d}</span>`).join('')}
    ${cells.map(d => { const ds = iso(d); const on = ds === val; const today = diffD(d, TODAY) === 0; return `<button data-a="popPick" data-v="${ds}" style="height:30px;border-radius:6px;font-size:12px;${on ? 'background:var(--accent);color:var(--on-accent);font-weight:600' : today ? 'color:var(--accent);font-weight:600;box-shadow:inset 0 0 0 1px var(--accent-line)' : d.getMonth() !== m.getMonth() ? 'color:var(--text-3)' : ''}" onmouseover="if(!this.style.background)this.style.background='var(--surface-2)'" onmouseout="if(this.style.background==='var(--surface-2)')this.style.background=''" aria-label="${fmtDate(ds, true)}" class="num">${d.getDate()}</button>`; }).join('')}</div></div>`;
}
function popHtml(p) {
  let inner = '', cls = '', style = '';
  const t = ['status', 'priority', 'assignee', 'labels', 'date', 'project', 'deps', 'recur', 'estimate'].includes(p.type) ? tgt(p) : null;
  switch (p.type) {
    case 'create': inner = `<div class="mh">Create</div><button class="mi" data-a="newTask">${ic('circle-check', 15)}Task<span class="r"><kbd>N</kbd></span></button><button class="mi" data-a="newProject">${ic('folder-plus', 15)}Project<span class="r"><kbd>P</kbd></span></button><button class="mi" data-a="newTeam">${ic('users', 15)}Team</button><div class="msep"></div><button class="mi" data-a="invite">${ic('user-plus', 15)}Invite member</button>`; style = 'width:220px'; break;
    case 'subassignee': { const tk = task(p.id); const sb = tk?.subtasks[p.i]; if (!sb) break; inner = popList([{ id: '', name: 'Unassigned', html: av(null, 'sm', false), on: !sb.assignee }, ...D().members.filter(m => m.status !== 'deactivated').map(m => ({ id: m.id, name: m.name + (m.id === D().me ? ' (you)' : ''), html: av(m.id, 'sm', false), on: sb.assignee === m.id }))], { search: 'Assign subtask to…' }); break; }
    case 'status': inner = popList(STATUSES.map((s, i) => ({ id: s.id, name: s.name, html: stIcon(s.id), on: t?.status === s.id, kbd: i + 1 }))); break;
    case 'priority': inner = popList(PRIOS.map((x, i) => ({ id: x.id, name: x.name, html: prIcon(x.id), on: t?.priority === x.id }))); break;
    case 'assignee': inner = popList([{ id: '', name: 'Unassigned', html: av(null, 'sm', false), on: !t?.assignee }, ...D().members.filter(m => m.status !== 'deactivated').map(m => ({ id: m.id, name: m.name + (m.id === D().me ? ' (you)' : ''), html: av(m.id, 'sm', false), on: t?.assignee === m.id }))], { search: 'Assign to…' }); break;
    case 'labels': inner = popList(LABELS.map(l => ({ id: l.id, name: l.name, html: `<span class="pdot" style="--c:${l.c}"></span>`, on: t?.labels.includes(l.id), act: 'popToggleLabel' })), { search: 'Filter labels…' }); break;
    case 'project': inner = popList(visibleProjects().filter(q => canSee(q) && q.status !== 'complete').map(q => ({ id: q.id, name: q.name, html: `<span class="pdot" style="--c:${pColor(q)}"></span>`, on: t?.project === q.id })), { search: 'Move to project…' }); break;
    case 'recur': inner = popList(['Does not repeat', 'Daily', 'Weekly', 'Every 2 weeks', 'Monthly'].map(x => ({ id: x, name: x, html: ic('repeat', 14), on: (t?.recur || 'Does not repeat') === x }))); break;
    case 'estimate': inner = popList(['30m', '1h', '2h', '4h', '1d', '2d', '3d', '5d', '8d'].map(x => ({ id: x, name: x, html: ic('timer', 14), on: t?.estimate === x })).concat([{ id: '', name: 'Clear estimate', html: ic('x', 14) }])); break;
    case 'deps': { const cands = D().tasks.filter(x => x.project === t.project && x.id !== t.id && !x.archived); inner = popList(cands.map(x => ({ id: x.id, name: `${x.key}  ${x.title}`, html: stIcon(x.status), on: t.deps.includes(x.id), act: 'popToggleDep' })), { search: 'Blocked by…' }); break; }
    case 'date': {
      const val = p.field === 'subdue' ? t?.subtasks[p.i]?.due : t?.[p.field];
      const q = [['Today', 0], ['Tomorrow', 1], ['Next week', 7 - ((TODAY.getDay() + 6) % 7)], ['In 2 weeks', 14]];
      inner = `<div class="row" style="gap:4px;padding:4px;flex-wrap:wrap">${q.map(([n, d]) => `<button class="badge" data-a="popPick" data-v="${dOff(d)}" style="cursor:pointer">${n}</button>`).join('')}${val ? `<button class="badge" data-a="popPick" data-v="" style="cursor:pointer;color:var(--red)">Clear</button>` : ''}</div><div class="msep"></div>${miniCal(p, val)}`;
      style = 'min-width:0'; break;
    }
    case 'pstatus': { const pr = proj(p.id); inner = popList(Object.entries(PSTAT).map(([k, v]) => ({ id: k, name: v.name, html: `<span class="pdot" style="--c:${v.c};border-radius:50%"></span>`, on: pr.status === k }))); break; }
    case 'role': { const m = mem(p.id); inner = `<div class="mh">Role for ${esc(m.name)}</div>` + ['Admin', 'Member', 'Guest'].map(r => `<button class="mi" data-a="popPick" data-v="${r}" style="height:auto;padding:7px 8px;align-items:flex-start"><div class="grow" style="white-space:normal"><div style="font-weight:500">${r}</div><div class="faint" style="font-size:11.5px">${{ Admin: 'Manage members, settings, and all projects', Member: 'Create projects and work on tasks', Guest: 'Only sees projects they are invited to' }[r]}</div></div>${m.role === r ? `<span class="ck">${ic('check', 14)}</span>` : ''}</button>`).join(''); style = 'width:300px'; break; }
    case 'ws': inner = `<div class="mh">Workspaces</div>${D().workspaces.map(w => `<button class="mi" data-a="switchWs" data-v="${w.id}">${wsLogo(w, 20)}<span class="grow">${esc(w.name)}</span><span class="faint" style="font-size:11px">${w.plan}</span>${w.name === D().ws.name ? `<span class="ck">${ic('check', 14)}</span>` : ''}</button>`).join('')}<div class="msep"></div><button class="mi" data-a="newWorkspace">${ic('plus', 15)}Create workspace</button><button class="mi" data-a="go" data-r="settings" data-sec="workspace">${ic('settings', 15)}Workspace settings</button><button class="mi" data-a="invite">${ic('user-plus', 15)}Invite members</button><div class="msep"></div><button class="mi" data-a="signOut">${ic('log-out', 15)}Sign out</button>`; style = 'width:260px'; break;
    case 'user': inner = `<div class="row" style="padding:8px 8px 10px;gap:10px">${av(D().me, 'lg', false)}<div style="min-width:0"><div style="font-weight:600">${esc(S.prefs.name)}</div><div class="faint trunc" style="font-size:12px">${esc(me().email)}</div></div></div><div class="msep"></div>
      <button class="mi" data-a="go" data-r="member" data-id="${D().me}">${ic('user', 15)}View profile</button><button class="mi" data-a="go" data-r="settings" data-sec="profile">${ic('settings', 15)}Account settings</button>
      <div class="msep"></div><div class="mh">Theme</div><div style="padding:2px 6px 6px"><div class="seg" style="width:100%">${[['light', 'sun', 'Light'], ['dark', 'moon', 'Dark'], ['system', 'monitor', 'System']].map(([k, i, n]) => `<button class="${S.prefs.theme === k ? 'on' : ''}" style="flex:1;justify-content:center" data-a="setTheme" data-v="${k}">${ic(i, 13)}${n}</button>`).join('')}</div></div>
      <div class="msep"></div><button class="mi" data-a="shortcuts">${ic('keyboard', 15)}Keyboard shortcuts<span class="r"><kbd>?</kbd></span></button><button class="mi" data-a="signOut">${ic('log-out', 15)}Sign out</button>`; style = 'width:260px'; break;
    case 'help': inner = `<div class="mh">Help & resources</div><button class="mi" data-a="shortcuts">${ic('keyboard', 15)}Keyboard shortcuts<span class="r"><kbd>?</kbd></span></button><button class="mi" data-a="openPalette">${ic('command', 15)}Command menu<span class="r"><kbd>${MOD}K</kbd></span></button><button class="mi" data-a="go" data-r="system">${ic('component', 15)}Design system</button><button class="mi" data-a="go" data-r="states">${ic('layers', 15)}System states</button>
      <div class="msep"></div><div class="mh">Prototype</div><button class="mi" data-a="startOnboarding">${ic('sparkles', 15)}Replay onboarding</button><button class="mi" data-a="toggleOffline">${ic(S.ui.offline ? 'wifi' : 'wifi-off', 15)}${S.ui.offline ? 'Go back online' : 'Simulate offline'}</button><button class="mi" data-a="go" data-r="nowhere">${ic('file-question', 15)}Open a broken link</button><button class="mi" data-a="resetDemo">${ic('rotate-ccw', 15)}Reset demo data</button>`; style = 'width:260px'; break;
    case 'sort': { const v = viewOf(p.key); inner = `<div class="mh">Sort by</div>` + [['manual', 'Manual'], ['priority', 'Priority'], ['due', 'Due date'], ['start', 'Start date'], ['title', 'Title'], ['status', 'Status'], ['assignee', 'Assignee'], ['created', 'Created'], ['updated', 'Last updated']].map(([k, n]) => `<button class="mi" data-a="setSort" data-key="${p.key}" data-v="${k}">${n}${v.sort.f === k ? `<span class="ck">${ic('check', 14)}</span>` : ''}</button>`).join('') + `<div class="msep"></div><div style="padding:4px 6px"><div class="seg" style="width:100%"><button class="${v.sort.dir > 0 ? 'on' : ''}" style="flex:1;justify-content:center" data-a="setSortDir" data-key="${p.key}" data-v="1">${ic('arrow-up', 12)}Ascending</button><button class="${v.sort.dir < 0 ? 'on' : ''}" style="flex:1;justify-content:center" data-a="setSortDir" data-key="${p.key}" data-v="-1">${ic('arrow-down', 12)}Descending</button></div></div>`; style = 'width:240px'; break; }
    case 'group': { const v = viewOf(p.key); inner = `<div class="mh">Group by</div>` + [['status', 'Status', 'circle-dot'], ['priority', 'Priority', 'signal-high'], ['assignee', 'Assignee', 'user'], ['project', 'Project', 'folder'], ['due', 'Due date', 'calendar'], ['none', 'No grouping', 'minus']].map(([k, n, i]) => `<button class="mi" data-a="setGroup" data-key="${p.key}" data-v="${k}">${ic(i, 15)}${n}${v.group === k ? `<span class="ck">${ic('check', 14)}</span>` : ''}</button>`).join(''); break; }
    case 'cols': { const v = viewOf(p.key); inner = `<div class="mh">Visible columns</div>` + TCOLS.filter(c => c[0] !== 'title').map(c => `<label class="mi" style="cursor:pointer"><input type="checkbox" class="check" data-a="toggleCol2" data-key="${p.key}" data-v="${c[0]}" ${v.hidden.includes(c[0]) ? '' : 'checked'}>${c[1]}</label>`).join('') + `<div class="msep"></div><button class="mi" data-a="resetCols" data-key="${p.key}">${ic('rotate-ccw', 14)}Reset widths</button>`; break; }
    case 'filter': inner = filterBuilder(p); cls = 'fbuild'; style = 'max-width:560px'; break;
    case 'fvals': { const v = viewOf(p.key); const f = v.filters[p.i]; if (!f) break; inner = `<div class="mh">${FIELDS[f.f].name} ${f.op === 'not' ? 'is not' : 'is'}</div>` + FIELDS[f.f].opts().map(o => `<label class="mi" style="cursor:pointer"><input type="checkbox" class="check" data-a="fToggleVal" data-key="${p.key}" data-i="${p.i}" data-v="${o.id}" ${f.v.includes(o.id) ? 'checked' : ''}>${o.html || ''}${esc(o.name)}</label>`).join(''); break; }
    case 'daylist': { const ds = p.date; const evs = D().events.filter(e => e.date === ds); const ts = allTasks().filter(x => x.due === ds); inner = `<div class="mh">${fmtDate(ds, true)}</div>` + evs.map(e => `<button class="mi" data-a="go" data-r="project" data-id="${e.project}" data-tab="calendar">${ic('clock', 14)}${esc(e.title)}<span class="r">${e.time}</span></button>`).join('') + ts.map(x => `<button class="mi" data-a="openTask" data-id="${x.id}">${stIcon(x.status)}<span class="trunc">${esc(x.title)}</span><span class="r">${av(x.assignee, 'sm', false)}</span></button>`).join(''); style = 'width:280px'; break; }
    case 'event': { const e = D().events.find(x => x.id === p.id); const pr = proj(e.project); inner = `<div style="padding:10px 10px 6px"><div class="row" style="gap:8px;margin-bottom:6px"><span class="pdot" style="--c:${pColor(pr)};border-radius:50%"></span><b style="font-size:14px;font-weight:600">${esc(e.title)}</b></div><div class="muted" style="font-size:12.5px;display:flex;flex-direction:column;gap:4px"><span class="row" style="gap:6px">${ic('calendar', 13)}${fmtDate(e.date, true)} · ${e.time}</span><span class="row" style="gap:6px">${ic('folder', 13)}${esc(pr.name)}</span><span class="row" style="gap:6px">${ic('users', 13)}${avStack(pr.members, 5)}</span></div></div><div class="msep"></div><button class="mi" data-a="go" data-r="project" data-id="${pr.id}" data-tab="overview">${ic('arrow-up-right', 14)}Open project</button>`; style = 'width:270px'; break; }
    case 'emoji': inner = `<div class="row" style="gap:2px;padding:2px">${['👍', '🎉', '❤️', '👀', '🚀', '✅'].map(e => `<button class="ibtn" data-a="react" data-id="${p.id}" data-e="${e}" style="font-size:16px" aria-label="React ${e}">${e}</button>`).join('')}</div>`; style = 'min-width:0'; break;
    case 'ctx': inner = ctxMenu(p); break;
    case 'bulk-status': inner = STATUSES.map(s => `<button class="mi" data-a="bulkSet" data-f="status" data-v="${s.id}">${stIcon(s.id)}${s.name}</button>`).join(''); break;
    case 'bulk-priority': inner = PRIOS.map(s => `<button class="mi" data-a="bulkSet" data-f="priority" data-v="${s.id}">${prIcon(s.id)}${s.name}</button>`).join(''); break;
    case 'bulk-assignee': inner = [{ id: '', name: 'Unassigned' }, ...D().members].map(m => `<button class="mi" data-a="bulkSet" data-f="assignee" data-v="${m.id}">${av(m.id || null, 'sm', false)}${esc(m.name)}</button>`).join(''); break;
  }
  if (!inner) return '';
  return `<div class="pop floating ${cls} ${S.ui.fx.pop ? 'enter' : ''}" role="menu" style="left:${p.x}px;top:${p.y}px;${style}" data-pop-root>${inner}</div>`;
}
function filterBuilder(p) {
  const v = viewOf(p.key);
  const rows = v.filters.map((f, i) => {
    const F = FIELDS[f.f]; const opts = F.opts();
    const names = f.v.map(id => opts.find(o => o.id === id)?.name || id);
    const open = p.edit === i;
    return `<div class="frow"><span class="conj">${i ? 'and' : 'Where'}</span>
      <select class="select" data-in="fField" data-key="${p.key}" data-i="${i}" aria-label="Field">${Object.entries(FIELDS).map(([k, x]) => `<option value="${k}" ${f.f === k ? 'selected' : ''}>${x.name}</option>`).join('')}</select>
      <select class="select" data-in="fOp" data-key="${p.key}" data-i="${i}" aria-label="Operator"><option value="is" ${f.op === 'is' ? 'selected' : ''}>is</option><option value="not" ${f.op === 'not' ? 'selected' : ''}>is not</option></select>
      <button class="valbtn" data-a="fEdit" data-i="${i}" aria-expanded="${open}"><span class="trunc grow">${names.length ? esc(names.join(', ')) : '<span class="faint">Select…</span>'}</span>${ic('chevron-down', 12)}</button>
      <button class="ibtn ibtn-xs" data-a="rmFilter" data-key="${p.key}" data-i="${i}" aria-label="Remove filter">${ic('trash-2', 13)}</button></div>
      ${open ? `<div style="margin-left:50px;border:1px solid var(--border);border-radius:var(--r);padding:4px;max-height:200px;overflow:auto">${opts.map(o => `<label class="mi" style="cursor:pointer;min-height:28px"><input type="checkbox" class="check" data-a="fToggleVal" data-key="${p.key}" data-i="${i}" data-v="${o.id}" ${f.v.includes(o.id) ? 'checked' : ''}>${o.html || ''}${esc(o.name)}</label>`).join('')}</div>` : ''}`;
  }).join('');
  return `<div class="row" style="padding:2px 2px 4px"><b style="font-size:13px;font-weight:600">Filters</b><span class="sp"></span>${v.filters.length ? `<button class="btn btn-sm btn-ghost" data-a="clearFilters" data-key="${p.key}">Clear all</button>` : ''}</div>
    ${rows || '<div class="faint" style="font-size:12.5px;padding:4px 2px 8px">No filters applied. Combine filters to narrow the task list — e.g. Status is In Progress and Assignee is Sarah.</div>'}
    <div class="row" style="gap:4px;flex-wrap:wrap;padding-top:4px;border-top:1px solid var(--divider)"><span class="faint" style="font-size:11.5px;margin-right:4px">Add filter:</span>${Object.entries(FIELDS).map(([k, x]) => `<button class="badge" style="cursor:pointer" data-a="addFilter" data-key="${p.key}" data-f="${k}">${ic(x.icon, 11)}${x.name}</button>`).join('')}</div>`;
}

/* ---------------- CONTEXT MENUS ---------------- */
function ctxMenu(p) {
  const I = (act, icon, label, extra = '', r = '') => `<button class="mi ${extra}" data-a="${act}" data-id="${p.id}" data-key="${p.key || ''}">${ic(icon, 15)}${label}${r ? `<span class="r">${r}</span>` : ''}</button>`;
  const sep = '<div class="msep"></div>';
  if (p.ctx === 'task') {
    const t = task(p.id); if (!t) return '';
    return I('openTask', 'panel-right-open', 'Open') + I('editTask', 'pencil', 'Edit', '', 'E') + I('toggleDone', t.status === 'done' ? 'rotate-ccw' : 'circle-check', t.status === 'done' ? 'Reopen' : 'Mark complete') + sep
      + I('ctxStatus', 'circle-dot', 'Status…') + I('ctxAssign', 'user', 'Assign to…') + I('ctxPrio', 'signal-high', 'Priority…') + I('ctxMove', 'folder-input', 'Move to project…') + sep
      + I('toggleFavTask', 'star', t.fav ? 'Remove from favorites' : 'Add to favorites') + I('copyLink', 'link', 'Copy link') + I('dupTask', 'copy', 'Duplicate') + I('archiveTask', 'archive', 'Archive') + sep
      + I('delTask', 'trash-2', 'Delete', 'danger', 'Del');
  }
  if (p.ctx === 'project') {
    const pr = proj(p.id); if (!pr) return '';
    return I('openProject', 'arrow-up-right', 'Open') + I('toggleFavProj', 'star', pr.fav ? 'Remove from favorites' : 'Add to favorites') + I('editProject', 'pencil', 'Rename & edit') + I('share', 'share-2', 'Share') + I('copyLink', 'link', 'Copy link') + I('dupProject', 'copy', 'Duplicate') + sep
      + (visibleProjects().indexOf(pr) > 0 ? I('projUp', 'arrow-up', 'Move up in sidebar') : '') + (visibleProjects().indexOf(pr) < visibleProjects().length - 1 ? I('projDown', 'arrow-down', 'Move down in sidebar') : '') + sep
      + I('archiveProject', 'archive', pr.status === 'complete' ? 'Archive' : 'Archive project') + I('delProject', 'trash-2', 'Delete project', 'danger');
  }
  if (p.ctx === 'column') {
    const ck = p.key + ':' + p.id;
    return `<div class="mh">${ST[p.id].name}</div>` + I('colAdd', 'plus', 'Add task') + I('colCollapse', 'fold-horizontal', 'Collapse column') + (p.id !== 'done' ? I('colDoneAll', 'check-check', 'Mark all as done') : I('colArchive', 'archive', 'Archive completed')) + I('colSortPrio', 'arrow-down-wide-narrow', 'Sort by priority');
  }
  if (p.ctx === 'member') {
    const m = mem(p.id); if (!m) return '';
    const canRm = m.role !== 'Owner' && m.id !== D().me;
    return I('viewProfile', 'user', 'View profile') + I('assignToMember', 'plus', 'Assign a task') + I('copyEmail', 'mail', 'Copy email') + (canRm ? I('ctxRole', 'shield', 'Change role…') + (m.status === 'invited' ? I('resendInvite', 'send', 'Resend invite') : '') + sep + I('removeMember', 'user-minus', 'Remove from workspace', 'danger') : '');
  }
  if (p.ctx === 'file') {
    return I('previewFile', 'eye', 'Preview') + I('renameFile', 'pencil', 'Rename') + I('copyLink', 'link', 'Copy link') + I('dupFile', 'copy', 'Duplicate') + sep + I('delFile', 'trash-2', 'Delete', 'danger');
  }
  if (p.ctx === 'savedview') {
    return `<button class="mi" data-a="renameView" data-id="${p.vid}">${ic('pencil', 15)}Rename view</button><button class="mi danger" data-a="delView" data-id="${p.vid}">${ic('trash-2', 15)}Delete view</button>`;
  }
  return '';
}

/* ---------------- COMMAND PALETTE ---------------- */
function commands() {
  return [
    { id: 'c-task', name: 'Create task', icon: 'plus', kbd: 'N', run: () => A.newTask(document.body) },
    { id: 'c-proj', name: 'Create project', icon: 'folder-plus', kbd: 'P', run: () => A.newProject() },
    { id: 'c-search', name: 'Search workspace', icon: 'search', kbd: '/', run: () => { S.ui.palette = { q: '', mode: 'search', scope: 'all', hl: 0 }; render(); } },
    { id: 'c-home', name: 'Go to Home', icon: 'house', kbd: 'G H', run: () => go('home') },
    { id: 'c-inbox', name: 'Go to Inbox', icon: 'inbox', kbd: 'G I', run: () => go('inbox') },
    { id: 'c-my', name: 'Go to My Tasks', icon: 'circle-check', kbd: 'G T', run: () => go('mytasks') },
    { id: 'c-projs', name: 'Go to Projects', icon: 'folder-kanban', kbd: 'G P', run: () => go('projects') },
    { id: 'c-cal', name: 'Go to Calendar', icon: 'calendar', kbd: 'G C', run: () => go('calendar') },
    { id: 'c-tl', name: 'Go to Timeline', icon: 'chart-gantt', run: () => go('timeline') },
    { id: 'c-mem', name: 'Go to Members', icon: 'users', run: () => go('members') },
    { id: 'c-set', name: 'Open settings', icon: 'settings', kbd: 'G S', run: () => go('settings') },
    { id: 'c-app', name: 'Appearance settings', icon: 'palette', run: () => go('settings', { sec: 'appearance' }) },
    { id: 'c-ws', name: 'Switch workspace…', icon: 'arrow-left-right', run: () => { S.ui.palette = { q: '', mode: 'ws', hl: 0 }; render(); } },
    { id: 'c-dark', name: effectiveDark() ? 'Switch to light mode' : 'Switch to dark mode', icon: effectiveDark() ? 'sun' : 'moon', kbd: MOD + ' ⇧ L', run: () => A.toggleDark() },
    { id: 'c-inv', name: 'Invite member', icon: 'user-plus', run: () => A.invite() },
    { id: 'c-side', name: 'Toggle sidebar', icon: 'panel-left', kbd: '[', run: () => A.toggleSide() },
    { id: 'c-keys', name: 'Keyboard shortcuts', icon: 'keyboard', kbd: '?', run: () => A.shortcuts() },
    { id: 'c-out', name: 'Sign out', icon: 'log-out', run: () => A.signOut() },
  ];
}
function paletteItems() {
  const pl = S.ui.palette; const q = pl.q.trim(); const ql = q.toLowerCase();
  const groups = [];
  if (pl.mode === 'ws') {
    groups.push({ name: 'Switch workspace', items: D().workspaces.filter(w => !q || w.name.toLowerCase().includes(ql)).map(w => ({ html: `${wsLogo(w, 20)}`, name: w.name, sub: w.plan + ' plan', run: () => A.switchWs({ dataset: { v: w.id } }) })) });
    return groups;
  }
  if (pl.mode === 'cmd') {
    const cmds = commands().filter(c => !q || c.name.toLowerCase().includes(ql));
    if (!q) {
      groups.push({ name: 'Suggestions', items: cmds.slice(0, 3).concat(cmds.filter(c => c.id === 'c-dark' || c.id === 'c-ws')) });
      const recent = sortTasks(allTasks().filter(t => t.assignee === D().me || t.fav), { f: 'updated', dir: 1 }).slice(0, 4);
      groups.push({ name: 'Recent tasks', items: recent.map(t => ({ html: stIcon(t.status), name: t.title, sub: proj(t.project).name, r: t.key, run: () => A.openTask({ dataset: { id: t.id } }) })) });
      groups.push({ name: 'Navigation', items: cmds.filter(c => c.id.startsWith('c-') && c.name.startsWith('Go to')) });
      return groups;
    }
    if (cmds.length) groups.push({ name: 'Commands', items: cmds.slice(0, 5) });
  }
  const r = searchAll(q);
  const sc = pl.mode === 'search' ? pl.scope : 'all';
  const lim = sc === 'all' ? 4 : 12;
  if (pl.mode === 'search' && !q) {
    groups.push({ name: 'Recent searches', items: D().recentSearches.map(s => ({ icon: 'history', name: s, run: () => { pl.q = s; pl.hl = 0; render(); } })) });
    groups.push({ name: 'Suggested', items: [
      { icon: 'clock-alert', name: 'Overdue tasks', run: () => A.goTasks({ dataset: { f: 'overdue' } }) },
      { icon: 'user', name: 'Tasks assigned to me', run: () => go('mytasks') },
      { icon: 'signal-high', name: 'High priority in Website Redesign', run: () => { go('project', { id: 'p1', tab: 'v:v1' }); } },
      { icon: 'paperclip', name: 'Files in Website Redesign', run: () => go('project', { id: 'p1', tab: 'files' }) }] });
    return groups;
  }
  if (!q) return groups;
  if (sc === 'all' || sc === 'tasks') groups.push({ name: 'Tasks', items: r.tasks.slice(0, lim).map(t => ({ html: stIcon(t.status), name: t.title, sub: proj(t.project).name, r: t.key, run: () => A.openTask({ dataset: { id: t.id } }) })) });
  if (sc === 'all' || sc === 'projects') groups.push({ name: 'Projects', items: r.projects.slice(0, lim).map(p => ({ html: `<span class="pdot" style="--c:${pColor(p)}"></span>`, name: p.name, sub: PSTAT[p.status].name, run: () => go('project', { id: p.id }) })) });
  if (sc === 'all' || sc === 'people') groups.push({ name: 'People', items: r.people.slice(0, lim).map(m => ({ html: av(m.id, 'sm', false), name: m.name, sub: m.title, run: () => go('member', { id: m.id }) })) });
  if (sc === 'all' || sc === 'files') groups.push({ name: 'Files', items: r.files.slice(0, lim).map(f => ({ icon: FT[f.type].i, name: f.name, sub: proj(f.project).name, r: f.size, run: () => openModal({ type: 'filePreview', file: f, tid: f.task }) })) });
  if (sc === 'all' || sc === 'comments') groups.push({ name: 'Comments', items: r.comments.slice(0, lim).map(c => ({ html: av(c.by, 'sm', false), name: c.text, sub: 'on ' + task(c.task).title, run: () => A.openTask({ dataset: { id: c.task } }) })) });
  const out = groups.filter(g => g.items.length);
  out.push({ name: '', items: [{ icon: 'search', name: `View all results for “${q}”`, run: () => { S.ui.searchQ = q; S.ui.searchCat = sc; if (!D().recentSearches.includes(q)) D().recentSearches.unshift(q); D().recentSearches = D().recentSearches.slice(0, 5); save(); go('search'); } }] });
  return out;
}
function paletteHtml() {
  const pl = S.ui.palette; const groups = paletteItems();
  const flat = groups.flatMap(g => g.items); pl._flat = flat; pl.hl = clamp(pl.hl, 0, Math.max(flat.length - 1, 0));
  let idx = 0;
  const ph = pl.mode === 'search' ? 'Search tasks, projects, people, files, comments…' : pl.mode === 'ws' ? 'Find a workspace…' : 'Type a command or search…';
  return `<div class="palette" role="dialog" aria-modal="true" aria-label="Command menu">
    <div class="pal-in">${ic(pl.mode === 'search' ? 'search' : 'command', 17)}${pl.mode !== 'cmd' ? `<span class="badge" style="flex-shrink:0">${pl.mode === 'search' ? 'Search' : 'Workspace'}</span>` : ''}<input id="pal-in" data-in="palQ" value="${esc(pl.q)}" placeholder="${ph}" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant="pi-${pl.hl}"><kbd>Esc</kbd></div>
    ${pl.mode === 'search' ? `<div class="pal-scope" role="tablist">${[['all', 'All', 'layers'], ['tasks', 'Tasks', 'circle-check'], ['projects', 'Projects', 'folder'], ['people', 'People', 'users'], ['files', 'Files', 'paperclip'], ['comments', 'Comments', 'message-square']].map(([k, n, i]) => `<button role="tab" class="${pl.scope === k ? 'on' : ''}" data-a="palScope" data-v="${k}">${ic(i, 12)}${n}</button>`).join('')}</div>` : ''}
    <div class="pal-list" id="pal-list" role="listbox">${flat.length ? groups.map(g => `<div class="pal-group">${g.name ? `<div class="pal-sec">${g.name}</div>` : ''}${g.items.map(it => { const i = idx++; return `<div class="pi ${i === pl.hl ? 'hl' : ''}" id="pi-${i}" role="option" aria-selected="${i === pl.hl}" data-a="palRun" data-i="${i}" data-hover-i="${i}">${it.html || ic(it.icon || 'circle', 15)}<span class="trunc">${hl(it.name, pl.q.trim())}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}<span class="r">${it.r ? `<span class="mono">${esc(it.r)}</span>` : ''}${it.kbd ? it.kbd.split(' ').map(k => `<kbd>${k}</kbd>`).join('') : ''}</span></div>`; }).join('')}</div>`).join('')
      : `<div class="empty-state sm"><div class="glyph">${ic('search-x', 18)}</div><h2 class="es-h">No results found</h2><p>Try a different keyword, or press Tab to search everything.</p></div>`}</div>
    <div class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd>navigate</span><span><kbd>↵</kbd>select</span>${pl.mode === 'cmd' ? '<span><kbd>Tab</kbd>search mode</span>' : '<span><kbd>⌫</kbd>back to commands</span>'}<span class="sp" style="flex:1"></span><span>${LOGO(12)}</span></div>
  </div>`;
}
