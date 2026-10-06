/* =====================================================================
   SHELL: render loop, router, sidebar, topbar, skeletons, filter engine
   ===================================================================== */
const ROUTE_NAMES = { home: 'Home', inbox: 'Inbox', mytasks: 'My Tasks', favorites: 'Favorites', notifications: 'Notifications', search: 'Search', overview: 'Overview', projects: 'Projects', tasks: 'Tasks', calendar: 'Calendar', timeline: 'Timeline', members: 'Members', member: 'Member', teams: 'Teams', team: 'Team', activity: 'Activity', settings: 'Settings', system: 'Design system', states: 'System states', archive: 'Archive' };
const ROUTE_ICONS = { home: 'house', inbox: 'inbox', mytasks: 'circle-check', favorites: 'star', notifications: 'bell', search: 'search', overview: 'layout-dashboard', projects: 'folder-kanban', tasks: 'list-checks', calendar: 'calendar', timeline: 'chart-gantt', members: 'users', activity: 'activity', teams: 'users', settings: 'settings', system: 'component', states: 'layers', archive: 'archive' };

function go(route, params = {}, opt = {}) {
  if (route === 'project' && !params.tab) params.tab = 'board';
  if (!opt.back) S.ui.history.push({ route: S.ui.route, params: S.ui.params });
  const same = S.ui.route === route && JSON.stringify(S.ui.params) === JSON.stringify(params);
  S.ui.route = route; S.ui.params = params; S.ui.mnav = false; S.ui.sel.clear(); S.ui.pop = null; S.ui.composer = null; S.ui.editCell = null;
  if (!opt.keepDrawer && S.ui.drawer && innerWidth < 900) S.ui.drawer = null;
  // Pages render instantly; motion (not a fake wait) carries the transition.
  clearTimeout(go._t); S.ui.loading = false;
  if (!same) fxSet(opt.tab ? { tab: true, tabs: true } : { route: true, tabs: true });
  render();
  const c = $('.content'); if (c && !same) c.scrollTop = 0;
}

/* One-shot motion flags: read by templates during the next render, then cleared, so full re-renders never replay them. */
const reduceMotion = () => S.prefs.motion === 'reduce' || (S.prefs.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
function fxSet(o) { S.ui.fx = Object.assign(S.ui.fx || {}, o); }
const fxc = (kind, id) => S.ui.fx && S.ui.fx[kind] === id ? ' fx-' + kind : '';
/* Focus survives full re-renders: every control is addressable by its data-* identity. */
const FKEYS = ['a', 'id', 'r', 'tab', 'pop', 'ctx', 'k', 'v', 'sec', 'i', 'field', 'sid', 'key', 'e', 'f', 'dragCard', 'taskRow'];
function focusKey(el) {
  if (!el || el === document.body || !el.tagName) return null;
  if (el.id) return '#' + CSS.escape(el.id);
  const d = el.dataset || {};
  const parts = FKEYS.filter(k => d[k] != null).map(k => `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${CSS.escape(d[k])}"]`);
  return parts.length ? el.tagName.toLowerCase() + parts.join('') : null;
}
function tryFocus(key) { if (!key) return false; let el; try { el = document.querySelector(key); } catch (e) { return false; } if (el && el.offsetParent !== null) { el.focus({ preventScroll: true }); return document.activeElement === el; } return false; }
function pageTitle() {
  const u = S.ui; if (u.auth) return 'Gr8r Studio';
  let t = ROUTE_NAMES[u.route] || 'Not found';
  if (u.route === 'project' && proj(u.params.id)) t = `${(PTABS.find(x => x[0] === u.params.tab) || [0, 'Saved view'])[1]} · ${proj(u.params.id).name}`;
  if (u.route === 'member' && mem(u.params.id)) t = mem(u.params.id).name;
  if (u.route === 'team' && team(u.params.id)) t = team(u.params.id).name;
  return `${t} · ${D().ws.name}`;
}
/* Anything clickable is keyboard-reachable: non-native [data-a] controls get a role and a tab stop. */
function makeFocusable() {
  for (const el of document.querySelectorAll('[data-a]:not(button):not(a):not(input):not(label):not(select):not(textarea):not([tabindex])')) {
    if (el.matches('.scrim,.modal-wrap,.drawer-scrim,.side-scrim')) continue;
    el.tabIndex = 0;
    if (!el.hasAttribute('role')) el.setAttribute('role', el.dataset.a === 'go' ? 'link' : 'button');
  }
}
function render() {
  applyPrefs();
  const prevOv = render._ov || {}; const ov = { pop: !!S.ui.pop, modals: S.ui.modals.length, drawer: S.ui.drawer, pal: !!S.ui.palette, sub: !!S.ui.subOpen };
  // Entrances animate only on the render where the surface first appears.
  const fx = S.ui.fx || (S.ui.fx = {});
  if (ov.drawer && prevOv.drawer !== ov.drawer) fx.drawer = true;
  if (ov.modals > (prevOv.modals || 0)) fx.modal = ov.modals;
  const popSig = S.ui.pop ? [S.ui.pop.type, S.ui.pop.id, S.ui.pop.i, S.ui.pop.field, S.ui.pop.ctx, S.ui.pop.key].join('|') : '';
  if (popSig && popSig !== render._popSig) fx.pop = true; render._popSig = popSig;
  if (S.ui.sel.size && !render._selN) fx.bulk = true; render._selN = S.ui.sel.size;
  const authSig = S.ui.auth ? S.ui.auth + (S.ui.auth === 'onboarding' ? S.ui.onb : '') : '';
  if (authSig && authSig !== render._authSig) fx[S.ui.auth === 'onboarding' ? 'step' : 'auth'] = true; render._authSig = authSig;
  const a = document.activeElement; const fid = a && a.id; let s0 = null, s1 = null; const fkey = focusKey(a);
  try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch (e) { }
  const keep = $$('[data-keep]').map(el => [el.dataset.keep, el.scrollTop, el.scrollLeft]);
  $('#app').innerHTML = S.ui.auth ? renderAuth() : renderShell();
  $('#layer').innerHTML = renderLayer();
  makeFocusable();
  keep.forEach(([k, t, l]) => { const el = document.querySelector(`[data-keep="${CSS.escape(k)}"]`); if (el) { el.scrollTop = t; el.scrollLeft = l; } });
  if (fid) {
    const el = document.getElementById(fid);
    if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); try { if (s0 != null) el.setSelectionRange(s0, s1); } catch (e) { } }
  }
  // Return focus to whatever opened a surface that just closed; otherwise keep the control that had it.
  const lost = () => !document.activeElement || document.activeElement === document.body;
  if (prevOv.modals > ov.modals) { const k = S.ui.modalOpeners.splice(ov.modals).shift(); if (lost()) tryFocus(k); }
  if (prevOv.pop && !ov.pop && lost()) tryFocus(S.ui.popOpener);
  if (prevOv.drawer && !ov.drawer && lost()) tryFocus(S.ui.drawerOpener);
  if (prevOv.pal && !ov.pal && lost()) tryFocus(S.ui.palOpener);
  if (prevOv.sub && !ov.sub && lost()) tryFocus('.drawer .subt [data-sid="' + (S.ui.lastSub || '') + '"]');
  if (lost() && fkey) tryFocus(fkey);
  render._ov = ov;
  const played = S.ui.fx; S.ui.fx = {};
  if (played.route && !reduceMotion()) countUp();
  const title = pageTitle(); if (document.title !== title) { document.title = title; const live = document.getElementById('sr-live'); if (live && !S.ui.loading) live.textContent = title.split(' · ').slice(0, -1).join(', '); }
  afterRender();
}
function afterRender() {
  placePop();
  $$('textarea[data-autosize]').forEach(autosize);
  const pal = $('#pal-in'); if (pal && document.activeElement !== pal && !S.ui.pop) pal.focus();
  if (S.ui.route === 'project' && S.ui.params.tab === 'timeline' || S.ui.route === 'timeline') tlAfter();
}
/* Headline numbers count up once when a dashboard is entered. */
function countUp() {
  for (const el of document.querySelectorAll('.fx-route .stat .v')) {
    const m = el.textContent.match(/^(\d+)(%?)$/); if (!m) continue;
    const to = +m[1], suf = m[2]; if (to < 2) continue;
    const t0 = performance.now(), dur = 520;
    const step = now => { const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3); if (!el.isConnected) return; el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0' + suf; requestAnimationFrame(step);
  }
}
function autosize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

/* ---------- shell ---------- */
function renderShell() {
  const u = S.ui;
  return `<button class="skip" data-a="skipToContent">Skip to content</button><div class="shell ${u.collapsed ? 'collapsed' : ''} ${u.mnav ? 'mnav' : ''} ${u.fx.tabs ? 'fx-tabs' : ''}">
    ${renderSidebar()}
    ${u.mnav ? '<div class="side-scrim" data-a="closeMnav"></div>' : ''}
    <main class="main" id="main">
      ${renderTopbar()}
      ${u.offline ? `<div class="offline-bar" role="alert">${ic('wifi-off', 15)}<span><b>You're offline.</b> Changes won't be saved until your connection is back.</span><span class="sp"></span><button class="btn btn-sm btn-secondary" data-a="retryOnline">Try again</button></div>` : ''}
      <div class="content ${u.fx.route ? 'fx-route' : ''}" id="main-content" tabindex="-1" data-keep="c:${u.route}:${u.params.id || ''}:${u.params.tab || ''}:${u.params.sec || ''}">${u.loading ? skeleton() : renderPage()}</div>
    </main>
    ${renderBottomNav()}
  </div>`;
}
function renderPage() {
  const r = S.ui.route;
  try {
    const P = { home: pageHome, inbox: pageInbox, mytasks: pageMyTasks, favorites: pageFavorites, notifications: pageNotifications, search: pageSearch, overview: pageOverview, projects: pageProjects, project: pageProject, tasks: pageTasks, calendar: pageWsCalendar, timeline: pageWsTimeline, members: pageMembers, member: pageMember, teams: pageTeams, team: pageTeam, activity: pageActivity, settings: pageSettings, system: pageSystem, states: pageStates, archive: pageArchive };
    return (P[r] || page404)();
  } catch (e) {
    console.error(e);
    return stateFailed();
  }
}

function sItem(route, label, icon, opt = {}) {
  const on = S.ui.route === route && (!opt.id || S.ui.params.id === opt.id);
  return `<button class="sitem ${on ? 'on' : ''}" data-a="${opt.act || 'go'}" data-r="${route}" ${opt.id ? `data-id="${opt.id}"` : ''} ${S.ui.collapsed ? `data-tip="${esc(label)}" data-tip-pos="right"` : ''} ${on ? 'aria-current="page"' : ''}>${ic(icon, 16)}<span class="trunc">${esc(label)}</span>${opt.ct ? `<span class="ct ${opt.dot ? 'dotc' : ''}">${opt.ct}</span>` : ''}${opt.kbd ? `<span class="ct hide-m"><kbd>${opt.kbd}</kbd></span>` : ''}</button>`;
}
function renderSidebar() {
  const u = S.ui, d = D();
  const unreadInbox = d.notifs.filter(n => !n.read && n.type !== 'update').length;
  const unreadAll = d.notifs.filter(n => !n.read).length;
  const myOpen = allTasks().filter(t => t.assignee === d.me && t.status !== 'done' && t.due && diffD(parse(t.due), TODAY) <= 0).length;
  const projs = visibleProjects().filter(p => p.status !== 'complete');
  const inProj = u.route === 'project' ? u.params.id : null;
  return `<nav class="side" aria-label="Main">
    <div class="side-top">
      <div class="row" style="gap:2px">
        <button class="ws grow" data-a="pop" data-pop="ws" aria-haspopup="menu" aria-label="Switch workspace">
          ${wsLogo(d.ws, 22)}
          <span class="ws-name trunc">${esc(d.ws.name)}</span>
          <span class="chev-d faint">${ic('chevrons-up-down', 13)}</span>
        </button>
        ${u.collapsed ? '' : `<button class="ibtn ibtn-sm hide-m" data-a="toggleSide" data-tip="Collapse sidebar  [" aria-label="Collapse sidebar">${ic('panel-left', 15)}</button>`}
      </div>
    </div>
    <div class="side-scroll" data-keep="side">
      ${u.collapsed ? `<button class="sitem" data-a="toggleSide" data-tip="Expand sidebar" data-tip-pos="right" aria-label="Expand sidebar">${ic('panel-left', 16)}</button>` : ''}
      ${sItem('home', 'Home', 'house')}
      ${sItem('inbox', 'Inbox', 'inbox', { ct: unreadInbox || '', dot: true })}
      ${sItem('mytasks', 'My Tasks', 'circle-check', { ct: myOpen || '' })}
      ${sItem('favorites', 'Favorites', 'star')}
      ${sItem('search', 'Search', 'search', { act: 'openSearch', kbd: '/' })}
      ${sItem('notifications', 'Notifications', 'bell', { ct: unreadAll || '' })}
      <div class="sgroup">
        <div class="sgroup-h">Workspace</div>
        ${sItem('overview', 'Overview', 'layout-dashboard')}
        ${sItem('projects', 'Projects', 'folder-kanban')}
        ${sItem('tasks', 'Tasks', 'list-checks')}
        ${sItem('calendar', 'Calendar', 'calendar')}
        ${sItem('timeline', 'Timeline', 'chart-gantt')}
        ${sItem('members', 'Members', 'users')}
        ${sItem('activity', 'Activity', 'activity')}
      </div>
      <div class="sgroup" id="side-projects">
        <div class="sgroup-h"><span>Projects</span><span class="sp"></span><button class="ibtn ibtn-xs" data-a="newProject" data-tip="New project  P" aria-label="New project">${ic('plus', 14)}</button></div>
        ${projs.map(p => {
          const open = !!u.expanded[p.id]; const on = inProj === p.id;
          return `<div class="sproj" data-proj-drop="${p.id}">
            <div class="sitem ${on ? 'on' : ''}" draggable="true" data-drag-proj="${p.id}" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project" role="link" tabindex="0" ${u.collapsed ? `data-tip="${esc(p.name)}" data-tip-pos="right"` : ''}>
              <span class="pico" style="--c:${pColor(p)}" data-a="toggleExpand" data-id="${p.id}" aria-label="Toggle sub-pages">${ic(p.icon, 12)}</span>
              <span class="trunc">${esc(p.name)}</span>
              ${p.fav ? `<span class="fav">${ic('star', 11)}</span>` : ''}
              ${p.private ? `<span class="faint" style="margin-left:4px">${ic('lock', 11)}</span>` : ''}
              <span class="sdot" style="background:${PSTAT[p.status].c}" title="${PSTAT[p.status].name}"></span>
              <span class="hov"><span class="ibtn ibtn-xs" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Project options">${ic('ellipsis', 14)}</span><span class="ibtn ibtn-xs" data-a="toggleExpand" data-id="${p.id}" aria-label="Expand">${ic('chevron-right', 13, 'chev ' + (open ? 'open' : ''))}</span></span>
            </div>
            <div class="sub ${open && !u.collapsed ? 'open' : ''}">
              ${[['board', 'Board', 'square-kanban'], ['list', 'List', 'list'], ['timeline', 'Timeline', 'chart-gantt'], ['files', 'Files', 'paperclip']].map(([tab, n, i]) => `<button class="sitem ${on && u.params.tab === tab ? 'on' : ''}" data-a="go" data-r="project" data-id="${p.id}" data-tab="${tab}">${ic(i, 14)}<span>${n}</span></button>`).join('')}
            </div>
          </div>`;
        }).join('')}
        ${sItem('archive', 'Archive', 'archive', { ct: (D().tasks.filter(t => t.archived).length + D().projects.filter(p => p.archived).length) || '' })}
      </div>
      <div class="sgroup">
        <div class="sgroup-h"><span>Teams</span><span class="sp"></span><button class="ibtn ibtn-xs" data-a="newTeam" data-tip="New team" aria-label="New team">${ic('plus', 14)}</button></div>
        ${teamsList().map(t => sItem('team', t.name, t.icon, { id: t.id })).join('')}
      </div>
    </div>
    <div class="side-bot">
      <button class="sitem" data-a="pop" data-pop="help" ${u.collapsed ? 'data-tip="Help" data-tip-pos="right"' : ''}>${ic('circle-help', 16)}<span>Help & resources</span></button>
      ${sItem('settings', 'Settings', 'settings')}
      <button class="sitem" data-a="pop" data-pop="user" style="height:36px" ${u.collapsed ? 'data-tip="Profile" data-tip-pos="right"' : ''}>${av(d.me, 'presence', false)}<span class="trunc" style="color:var(--text);font-weight:500">${esc(S.prefs.name)}</span><span class="ct">${ic('chevrons-up-down', 13)}</span></button>
    </div>
  </nav>`;
}

function crumbs() {
  const u = S.ui, r = u.route, out = [];
  const c = (label, act = '', cur = false, icon = '') => `<button class="${cur ? 'cur' : ''}" ${act}>${icon}${esc(label)}</button>`;
  out.push(c(D().ws.name, 'data-a="go" data-r="home"', false, wsLogo(D().ws, 16)));
  if (r === 'project') {
    const p = proj(u.params.id);
    out.push(c('Projects', 'data-a="go" data-r="projects"'));
    if (p) out.push(c(p.name, `data-a="go" data-r="project" data-id="${p.id}" data-tab="overview"`, true, `<span class="pico" style="--c:${pColor(p)};width:16px;height:16px;border-radius:4px;display:grid;place-items:center;color:${pColor(p)}">${ic(p.icon, 11)}</span>`));
  } else if (r === 'member') {
    out.push(c('Members', 'data-a="go" data-r="members"'));
    out.push(c(mem(u.params.id)?.name || 'Member', '', true));
  } else if (r === 'team') {
    out.push(c('Teams', 'data-a="go" data-r="teams"'));
    out.push(c(team(u.params.id)?.name || 'Team', '', true));
  } else if (r === 'settings') {
    out.push(c('Settings', '', true));
  } else out.push(c(ROUTE_NAMES[r] || 'Not found', '', true));
  return out.join('<span class="sep">/</span>');
}
function renderTopbar() {
  const r = S.ui.route;
  return `<header class="topbar">
    <button class="ibtn" data-a="openMnav" aria-label="Open navigation" style="display:none" id="mnav-btn">${ic('menu', 17)}</button>
    <style>@media(max-width:900px){#mnav-btn{display:inline-flex!important}}</style>
    <nav class="crumbs trunc" aria-label="Breadcrumb">${crumbs()}</nav>
    <span class="sp"></span>
    <button class="topsearch" data-a="openPalette" aria-label="Search and commands">${ic('search', 14)}<span class="lbltxt">Search or jump to…</span><span class="kbd">${MOD}K</span></button>
    <button class="ibtn" data-a="go" data-r="notifications" data-tip="Notifications" aria-label="Notifications">${ic('bell', 16)}${D().notifs.some(n => !n.read) ? '<span style="position:absolute;top:6px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px var(--surface)"></span>' : ''}</button>
    <button class="btn btn-secondary btn-sm" data-a="pop" data-pop="create" aria-haspopup="menu" aria-label="Create new">${ic('plus', 14)}<span class="hide-m">New</span>${ic('chevron-down', 12, 'hide-m')}</button>
    <button class="ibtn hide-m" data-a="pop" data-pop="user" aria-label="Account menu" style="width:auto;padding:0 2px">${av(D().me, 'md', false)}</button>
  </header>`;
}
function renderBottomNav() {
  const r = S.ui.route; const unread = D().notifs.some(n => !n.read && n.type !== 'update');
  const b = (route, label, icon, extra = '') => `<button class="${r === route ? 'on' : ''}" data-a="go" data-r="${route}">${ic(icon, 19)}<span>${label}</span>${extra}</button>`;
  return `<nav class="bottomnav" aria-label="Primary">
    ${b('home', 'Home', 'house')}${b('mytasks', 'My Tasks', 'circle-check')}${b('projects', 'Projects', 'folder-kanban')}${b('inbox', 'Inbox', 'inbox', unread ? '<span class="bdot"></span>' : '')}
    <button data-a="openMnav">${ic('ellipsis', 19)}<span>More</span></button>
  </nav>`;
}

/* ---------- skeletons (loading states) ---------- */
const sk = (w, h = 10, extra = '') => `<span class="sk" style="width:${w};height:${h}px;${extra}"></span>`;
function skRows(n = 8) {
  return Array.from({ length: n }, (_, i) => `<div class="row" style="height:40px;border-bottom:1px solid var(--divider);gap:12px;padding:0 8px">${sk('15px', 15, 'border-radius:4px')}${sk((38 + (i * 13) % 30) + '%', 10)}<span class="sp"></span>${sk('70px', 18, 'border-radius:5px')}${sk('22px', 22, 'border-radius:50%')}${sk('54px', 10)}</div>`).join('');
}
function skCards(n = 6) {
  return `<div class="pgrid">${Array.from({ length: n }, () => `<div class="pcard" style="cursor:default">${sk('28px', 28, 'border-radius:7px')}${sk('60%', 12)}${sk('90%', 9)}${sk('70%', 9)}${sk('100%', 4)}</div>`).join('')}</div>`;
}
function skBoard() {
  return `<div class="board">${[3, 4, 3, 2, 3].map(n => `<div class="bcol"><div class="bcol-h">${sk('80px', 11)}</div><div class="bcol-b">${Array.from({ length: n }, (_, i) => `<div class="kcard" style="cursor:default">${sk('40%', 14, 'border-radius:5px')}${sk((60 + i * 9) % 95 + '%', 10)}<div class="row">${sk('40px', 9)}${sk('30px', 9)}<span class="sp"></span>${sk('18px', 18, 'border-radius:50%')}</div></div>`).join('')}</div></div>`).join('')}</div>`;
}
function skeleton() {
  const r = S.ui.route, tab = S.ui.params.tab;
  const head = `<div class="ph"><div class="col" style="gap:8px">${sk('220px', 20)}${sk('320px', 11)}</div></div>`;
  let body;
  if (r === 'project') {
    const ph = `<div class="proj-h"><div class="t">${sk('36px', 36, 'border-radius:9px')}${sk('200px', 18)}</div><div class="row" style="gap:16px;padding-bottom:10px">${sk('60px', 10)}${sk('50px', 10)}${sk('50px', 10)}${sk('60px', 10)}</div></div><div class="toolbar">${sk('200px', 22)}</div>`;
    return `<div class="page flush" aria-busy="true">${ph}${tab === 'board' ? skBoard() : `<div style="padding:12px 20px">${skRows(10)}</div>`}</div>`;
  }
  if (r === 'projects') body = skCards(6);
  else if (r === 'home' || r === 'overview') body = `<div class="stats" style="margin-bottom:16px">${Array.from({ length: 4 }, () => `<div class="stat">${sk('80px', 10)}${sk('44px', 20)}</div>`).join('')}</div><div class="grid2"><div class="panel" style="padding:14px">${skRows(6)}</div><div class="panel" style="padding:14px">${skRows(6)}</div></div>`;
  else body = skRows(10);
  return `<div class="page" aria-busy="true" aria-label="Loading">${head}${body}</div>`;
}

/* ---------- filter engine ---------- */
const FIELDS = {
  status: { name: 'Status', icon: 'circle-dot', opts: () => STATUSES.map(s => ({ id: s.id, name: s.name, html: stIcon(s.id) })) },
  assignee: { name: 'Assignee', icon: 'user', opts: () => [{ id: 'none', name: 'Unassigned', html: av(null, 'sm', false) }, ...D().members.map(m => ({ id: m.id, name: m.name + (m.id === D().me ? ' (you)' : ''), html: av(m.id, 'sm', false) }))] },
  priority: { name: 'Priority', icon: 'signal-high', opts: () => PRIOS.map(p => ({ id: p.id, name: p.name, html: prIcon(p.id) })) },
  due: { name: 'Due date', icon: 'calendar', opts: () => [{ id: 'overdue', name: 'Overdue' }, { id: 'today', name: 'Today' }, { id: 'week', name: 'Next 7 days' }, { id: 'later', name: 'Later' }, { id: 'nodate', name: 'No due date' }] },
  project: { name: 'Project', icon: 'folder', opts: () => visibleProjects().filter(canSee).map(p => ({ id: p.id, name: p.name, html: `<span class="pdot" style="--c:${pColor(p)}"></span>` })) },
  labels: { name: 'Labels', icon: 'tag', opts: () => LABELS.map(l => ({ id: l.id, name: l.name, html: `<span class="pdot" style="--c:${l.c}"></span>` })) },
  created: { name: 'Created date', icon: 'calendar-plus', opts: () => [{ id: '1', name: 'Last 24 hours' }, { id: '7', name: 'Last 7 days' }, { id: '30', name: 'Last 30 days' }] },
  updated: { name: 'Updated date', icon: 'history', opts: () => [{ id: '1', name: 'Last 24 hours' }, { id: '7', name: 'Last 7 days' }, { id: '30', name: 'Last 30 days' }] },
};
function viewOf(key) {
  if (!S.views[key]) S.views[key] = { filters: [], sort: { f: 'manual', dir: 1 }, group: key === 'tasks' || key === 'mytasks' ? 'status' : 'status', q: '', hidden: ['start', 'created', 'deps'], colW: {}, showDone: true };
  return S.views[key];
}
function matchF(t, f) {
  if (!f.v || !f.v.length) return true;
  let hit;
  if (f.f === 'labels') hit = f.v.some(v => t.labels.includes(v));
  else if (f.f === 'assignee') hit = f.v.includes(t.assignee || 'none');
  else if (f.f === 'due') {
    hit = f.v.some(v => {
      if (v === 'nodate') return !t.due; if (!t.due) return false;
      const n = diffD(parse(t.due), TODAY);
      return v === 'overdue' ? isOver(t) : v === 'today' ? n === 0 : v === 'week' ? n >= 0 && n <= 7 : n > 7;
    });
  } else if (f.f === 'created' || f.f === 'updated') {
    const ts = f.f === 'created' ? t.created : t.updated; hit = f.v.some(v => Date.now() - ts <= +v * DAY);
  } else hit = f.v.includes(t[f.f]);
  return f.op === 'not' ? !hit : hit;
}
function applyView(ts, v) {
  let out = ts.filter(t => v.filters.every(f => matchF(t, f)));
  if (v.q) { const q = v.q.toLowerCase(); out = out.filter(t => t.title.toLowerCase().includes(q) || t.key.toLowerCase().includes(q)); }
  return sortTasks(out, v.sort);
}
function sortTasks(ts, s) {
  const d = s.dir || 1; const a = [...ts];
  const key = {
    manual: t => t.order, title: t => t.title.toLowerCase(), due: t => t.due || '9999', start: t => t.start || '9999', priority: t => -PR[t.priority || 'none'].w,
    status: t => STATUSES.findIndex(x => x.id === t.status), assignee: t => mem(t.assignee)?.name || 'zzz', created: t => -t.created, updated: t => -t.updated, estimate: t => t.estimate || 'zzz', project: t => proj(t.project)?.name
  }[s.f] || (t => t.order);
  return a.sort((x, y) => { const p = key(x), q = key(y); return (p > q ? 1 : p < q ? -1 : 0) * d; });
}
function groupTasks(ts, g) {
  if (g === 'none') return [{ key: 'all', name: 'All tasks', html: '', tasks: ts }];
  let groups;
  if (g === 'status') groups = STATUSES.map(s => ({ key: s.id, name: s.name, html: stIcon(s.id), set: { status: s.id } }));
  else if (g === 'priority') groups = PRIOS.map(p => ({ key: p.id, name: p.name, html: prIcon(p.id), set: { priority: p.id } }));
  else if (g === 'assignee') groups = [...D().members.map(m => ({ key: m.id, name: m.name, html: av(m.id, 'sm', false), set: { assignee: m.id } })), { key: 'none', name: 'Unassigned', html: av(null, 'sm', false), set: { assignee: null } }];
  else if (g === 'project') groups = visibleProjects().filter(canSee).map(p => ({ key: p.id, name: p.name, html: `<span class="pdot" style="--c:${pColor(p)}"></span>`, set: { project: p.id } }));
  else if (g === 'due') groups = [{ key: 'overdue', name: 'Overdue' }, { key: 'today', name: 'Today' }, { key: 'week', name: 'Next 7 days' }, { key: 'later', name: 'Later' }, { key: 'nodate', name: 'No due date' }].map(x => ({ ...x, html: ic('calendar', 14) }));
  groups.forEach(G => {
    G.tasks = ts.filter(t => {
      if (g === 'assignee') return (t.assignee || 'none') === G.key;
      if (g === 'due') return matchF(t, { f: 'due', op: 'is', v: [G.key] });
      return t[g] === G.key;
    });
  });
  return g === 'status' || g === 'priority' ? groups : groups.filter(G => G.tasks.length);
}
function filterChips(key) {
  const v = viewOf(key);
  if (!v.filters.length) return '';
  const chips = v.filters.map((f, i) => {
    const F = FIELDS[f.f]; const opts = F.opts();
    const names = f.v.map(id => opts.find(o => o.id === id)?.name || id);
    const val = names.length ? (names.length > 2 ? `${names.length} selected` : names.join(', ')) : 'any';
    return `${i ? '<span>and</span>' : ''}<span class="chip"><button data-a="pop" data-pop="fvals" data-key="${key}" data-i="${i}" style="display:inline-flex;gap:5px;align-items:center">${ic(F.icon, 12)}<b>${F.name}</b> ${f.op === 'not' ? 'is not' : 'is'} <span>${esc(val)}</span></button><button class="ibtn" data-a="rmFilter" data-key="${key}" data-i="${i}" aria-label="Remove filter">${ic('x', 12)}</button></span>`;
  }).join('');
  return `<div class="chipsbar">${ic('list-filter', 13)}${chips}<button class="btn btn-sm btn-ghost" data-a="pop" data-pop="filter" data-key="${key}">${ic('plus', 12)}Add</button><span class="sp"></span><button class="btn btn-sm btn-ghost" data-a="clearFilters" data-key="${key}">Clear all</button></div>`;
}
function viewToolbar(key, opt = {}) {
  const v = viewOf(key);
  const sortName = { manual: 'Manual', title: 'Title', due: 'Due date', priority: 'Priority', status: 'Status', created: 'Created', updated: 'Updated', assignee: 'Assignee', start: 'Start date', estimate: 'Estimate', project: 'Project' }[v.sort.f];
  return `<div class="toolbar" role="toolbar">
    <div class="inwrap">${ic('search', 13)}<input class="input search-sm" id="vq-${key}" data-in="viewQ" data-key="${key}" placeholder="Search tasks" value="${esc(v.q)}" aria-label="Search tasks"></div>
    <button class="btn btn-ghost ${v.filters.length ? 'on' : ''}" data-a="pop" data-pop="filter" data-key="${key}">${ic('list-filter', 14)}Filter${v.filters.length ? ` <span class="badge accent" style="height:16px;padding:0 5px">${v.filters.length}</span>` : ''}</button>
    <button class="btn btn-ghost" data-a="pop" data-pop="sort" data-key="${key}">${ic('arrow-up-down', 14)}<span class="hide-m">Sort:</span> ${sortName}</button>
    ${opt.group !== false ? `<button class="btn btn-ghost" data-a="pop" data-pop="group" data-key="${key}">${ic('rows-3', 14)}<span class="hide-m">Group:</span> ${{ status: 'Status', priority: 'Priority', assignee: 'Assignee', project: 'Project', due: 'Due date', none: 'None' }[v.group]}</button>` : ''}
    ${opt.cols ? `<button class="btn btn-ghost" data-a="pop" data-pop="cols" data-key="${key}">${ic('columns-3', 14)}Columns</button>` : ''}
    ${opt.extra || ''}
    <span class="sp"></span>
    ${opt.right || ''}
  </div>${filterChips(key)}`;
}
