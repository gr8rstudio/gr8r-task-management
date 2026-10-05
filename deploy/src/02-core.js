/* =====================================================================
   QUIRE — core: utils, icons, seed data, store, render loop, events
   ===================================================================== */
'use strict';
// Web fonts load without blocking first paint (the link starts as media=print).
document.querySelectorAll('link[data-font]').forEach(l => { l.media = 'all'; });
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'x') => p + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';

/* ---------- dates ---------- */
const DAY = 864e5;
const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const TODAY = sod(new Date());
const iso = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const parse = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dOff = n => iso(addD(TODAY, n));
const diffD = (a, b) => Math.round((sod(a) - sod(b)) / DAY);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function fmtDate(s, long) {
  const d = typeof s === 'string' ? parse(s) : s; if (!d) return '';
  const fmt = S?.prefs?.dateFmt || 'MMM d';
  if (fmt === 'd/M') return `${d.getDate()}/${d.getMonth() + 1}${long ? '/' + d.getFullYear() : ''}`;
  if (fmt === 'M/d') return `${d.getMonth() + 1}/${d.getDate()}${long ? '/' + d.getFullYear() : ''}`;
  if (fmt === 'yyyy-MM-dd') return iso(d);
  return `${MON[d.getMonth()]} ${d.getDate()}${long || d.getFullYear() !== TODAY.getFullYear() ? ', ' + d.getFullYear() : ''}`;
}
function relDate(s) {
  if (!s) return '';
  const n = diffD(parse(s), TODAY);
  if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
  if (n > 1 && n < 7) return WD[parse(s).getDay()];
  return fmtDate(s);
}
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 6e4);
  if (m < 1) return 'just now'; if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60); if (h < 24) return h + 'h ago';
  const d = Math.round(h / 24); if (d < 7) return d + 'd ago';
  return fmtDate(iso(new Date(ts)));
}
const minsAgo = m => Date.now() - m * 6e4;
function dayBucket(ts) {
  const n = diffD(new Date(ts), TODAY);
  if (n === 0) return 'Today'; if (n === -1) return 'Yesterday'; if (n > -7) return 'This week'; return 'Earlier';
}

/* ---------- icons: inlined Lucide subset (src/00-icons.js), rendered to inline svg ---------- */
const _icCache = {};
function ic(name, size = 16, cls = '') {
  const k = name + '|' + size + '|' + cls;
  if (_icCache[k]) return _icCache[k];
  const inner = ICONS[name] || '<rect x="5" y="5" width="14" height="14" rx="3"/>';
  return (_icCache[k] = `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`);
}
/* Gr8r brand: wordmark (letters follow the theme's text colour, the square stays brand orange) and a compact g-mark. */
const LOGO_PATHS = '<path d="M15.6154 20.6295C14.1289 19.969 11.6758 19.5875 8.9131 19.2059C6.90969 18.9271 6.42494 18.7891 6.42494 18.164C6.42494 17.6092 6.90969 17.4008 9.0854 17.3656C15.6505 17.2952 17.4465 15.5605 17.4465 12.2966C17.4465 10.7 16.8946 9.41437 15.2708 8.75393L17.9985 8.23441L18.0686 4.86486H9.84473C1.86615 4.86486 0.55197 8.23441 0.55197 11.149C0.55197 13.4765 1.10394 15.3169 3.45485 16.3589C1.03672 16.7757 0.172306 17.6768 0.172306 19.2412C0.172306 21.6715 2.76274 22.1235 6.25263 22.643C9.05042 23.0598 11.781 23.0245 11.781 24.4481C11.781 25.2141 11.1589 25.8364 9.36287 25.8364C6.59725 25.8364 6.38989 24.8648 6.32274 23.7201H0C0 27.9556 2.07351 30.0042 9.32781 30.0042C16.4449 30.0042 18.1708 27.1924 18.1708 24.2748C18.1708 22.364 17.3093 21.3251 15.6154 20.6295ZM6.33435 9.1619H11.3692V13.8904H6.33435V9.1619Z M25.014 7.01501L23.9451 4.86065H20.318V22.5683H26.8129V13.7512C26.8129 11.4941 27.3299 9.75651 31.1644 10.1732V4.54954C27.7095 4.23544 26.0858 5.27746 25.014 7.01501Z M48.2477 11.1095C50.4936 10.5547 52.0472 9.02848 52.0472 6.35454C52.0472 2.53303 49.5941 0 42.8917 0C36.1893 0 33.7362 2.53303 33.7362 6.35454C33.7362 9.02841 35.2928 10.5547 37.5385 11.1095C34.9452 11.8403 33.3215 13.6806 33.3215 16.3898C33.3215 20.0705 35.7746 22.9175 42.9267 22.9175C50.0087 22.9175 52.4619 20.0705 52.4619 16.3898C52.4619 13.6807 50.8382 11.8404 48.2477 11.1095ZM46.4575 18.1332H39.4485V13.4047H46.4575V18.1332ZM46.4575 8.68214H39.4485V4.71971H46.4575V8.68214Z M59.1514 7.01492L58.0796 4.86057H54.4525V22.5682H60.9475V13.7511C60.9475 11.494 61.4673 9.75642 65.3018 10.1732V4.54945C61.847 4.23536 60.2232 5.27737 59.1514 7.01492Z" fill="currentColor"/><path d="M70.205 0H65.1702V4.72848H70.205V0Z" fill="#FE370B"/>';
const LOGO = (h = 22) => `<svg class="logo" height="${h}" width="${Math.round(h * 70.2051 / 30.0042)}" viewBox="0 0 70.2051 30.0042" role="img" aria-label="Gr8r">${LOGO_PATHS}</svg>`;
const MARK = (h = 14) => `<svg height="${h}" width="${Math.round(h * 24.4 / 30.1 * 10) / 10}" viewBox="0 0 24.4 30.1" aria-hidden="true"><path d="M15.6154 20.6295C14.1289 19.969 11.6758 19.5875 8.9131 19.2059C6.90969 18.9271 6.42494 18.7891 6.42494 18.164C6.42494 17.6092 6.90969 17.4008 9.0854 17.3656C15.6505 17.2952 17.4465 15.5605 17.4465 12.2966C17.4465 10.7 16.8946 9.41437 15.2708 8.75393L17.9985 8.23441L18.0686 4.86486H9.84473C1.86615 4.86486 0.55197 8.23441 0.55197 11.149C0.55197 13.4765 1.10394 15.3169 3.45485 16.3589C1.03672 16.7757 0.172306 17.6768 0.172306 19.2412C0.172306 21.6715 2.76274 22.1235 6.25263 22.643C9.05042 23.0598 11.781 23.0245 11.781 24.4481C11.781 25.2141 11.1589 25.8364 9.36287 25.8364C6.59725 25.8364 6.38989 24.8648 6.32274 23.7201H0C0 27.9556 2.07351 30.0042 9.32781 30.0042C16.4449 30.0042 18.1708 27.1924 18.1708 24.2748C18.1708 22.364 17.3093 21.3251 15.6154 20.6295ZM6.33435 9.1619H11.3692V13.8904H6.33435V9.1619Z" fill="currentColor"/><rect x="19.4" y="0" width="5" height="4.73" fill="#FE370B"/></svg>`;
function wsLogo(w, px = 22) { return w && w.brand ? `<span class="ws-logo brand" style="width:${px}px;height:${px}px">${MARK(Math.round(px * .64))}</span>` : `<span class="ws-logo" style="--c:${w.c};width:${px}px;height:${px}px;font-size:${Math.max(9, Math.round(px * .46))}px">${esc(w.name[0])}</span>`; }

/* ---------- vocab ---------- */
const STATUSES = [
  { id: 'backlog', name: 'Backlog' }, { id: 'todo', name: 'To Do' }, { id: 'progress', name: 'In Progress' },
  { id: 'review', name: 'Review' }, { id: 'done', name: 'Done' }];
const ST = Object.fromEntries(STATUSES.map(s => [s.id, s]));
const PRIOS = [
  { id: 'urgent', name: 'Urgent', w: 4 }, { id: 'high', name: 'High', w: 3 }, { id: 'medium', name: 'Medium', w: 2 },
  { id: 'low', name: 'Low', w: 1 }, { id: 'none', name: 'No priority', w: 0 }];
const PR = Object.fromEntries(PRIOS.map(p => [p.id, p]));
const LABELS = [
  { id: 'design', name: 'Design', c: 'var(--violet)' }, { id: 'frontend', name: 'Frontend', c: 'var(--blue)' },
  { id: 'backend', name: 'Backend', c: 'var(--teal)' }, { id: 'research', name: 'Research', c: 'var(--amber)' },
  { id: 'content', name: 'Content', c: 'var(--rose)' }, { id: 'bug', name: 'Bug', c: 'var(--red)' },
  { id: 'qa', name: 'QA', c: 'var(--green)' }, { id: 'growth', name: 'Growth', c: 'var(--orange)' }];
const LB = Object.fromEntries(LABELS.map(l => [l.id, l]));
const PSTAT = {
  planning: { name: 'Planning', c: 'var(--gray)' }, active: { name: 'In Progress', c: 'var(--blue)' },
  risk: { name: 'At Risk', c: 'var(--red)' }, hold: { name: 'On Hold', c: 'var(--amber)' }, complete: { name: 'Completed', c: 'var(--green)' }};
const PCOLORS = { indigo: '#5A67D8', blue: '#3B82C4', violet: '#8662C9', teal: '#23918A', rose: '#C54B78', amber: '#C48A1E', green: '#3D8E5F', slate: '#6B7280' };
const PICONS = ['globe', 'smartphone', 'megaphone', 'rocket', 'component', 'building-2', 'layout-grid', 'palette', 'code', 'briefcase', 'target', 'layers', 'zap', 'heart', 'folder', 'sparkles'];
const ROLES = ['Owner', 'Admin', 'Member', 'Guest'];
const TEAMS_SEED = [
  { id: 'design', name: 'Design', icon: 'palette', c: '#8662C9', desc: 'Product design, brand, and research' },
  { id: 'eng', name: 'Engineering', icon: 'code', c: '#3B82C4', desc: 'Web, mobile, and platform engineering' },
  { id: 'mkt', name: 'Marketing', icon: 'megaphone', c: '#C54B78', desc: 'Campaigns, content, and growth' },
  { id: 'product', name: 'Product', icon: 'target', c: '#C48A1E', desc: 'Roadmap, planning, and QA' }];

/* ---------- seed data ---------- */
function seed() {
  const members = [
    { id: 'm1', name: 'Alex Morgan', email: 'hello@gr8rstudio.com', role: 'Owner', team: 'product', title: 'Head of Product', c: '#5A67D8', status: 'active', last: 0, tz: 'San Francisco' },
    { id: 'm2', name: 'Sarah Chen', email: 'sarah@gr8rstudio.com', role: 'Admin', team: 'design', title: 'Design Lead', c: '#C54B78', status: 'active', last: 4, tz: 'New York' },
    { id: 'm3', name: 'John Carter', email: 'john@gr8rstudio.com', role: 'Member', team: 'eng', title: 'Frontend Engineer', c: '#3B82C4', status: 'active', last: 22, tz: 'London' },
    { id: 'm4', name: 'Emma Wilson', email: 'emma@gr8rstudio.com', role: 'Member', team: 'design', title: 'Product Designer', c: '#23918A', status: 'active', last: 9, tz: 'Berlin' },
    { id: 'm5', name: 'Priya Patel', email: 'priya@gr8rstudio.com', role: 'Member', team: 'mkt', title: 'Content Strategist', c: '#C48A1E', status: 'active', last: 95, tz: 'Toronto' },
    { id: 'm6', name: 'Marcus Lee', email: 'marcus@gr8rstudio.com', role: 'Member', team: 'eng', title: 'Backend Engineer', c: '#8662C9', status: 'active', last: 240, tz: 'Singapore' },
    { id: 'm7', name: 'Lena Fischer', email: 'lena@gr8rstudio.com', role: 'Admin', team: 'product', title: 'QA Lead', c: '#3D8E5F', status: 'active', last: 1500, tz: 'Munich' },
    { id: 'm8', name: 'Diego Alvarez', email: 'diego@freelance.io', role: 'Guest', team: 'mkt', title: 'Freelance Copywriter', c: '#C0612B', status: 'invited', last: null, tz: 'Madrid' },
  ];
  const projects = [
    { id: 'p1', key: 'WEB', name: 'Website Redesign', icon: 'globe', color: 'indigo', status: 'active', team: 'design', lead: 'm2', due: dOff(24), start: dOff(-30), fav: true, members: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], desc: 'Rebuild gr8rstudio.com with a clearer information architecture, a responsive component library, and a faster CMS-driven blog.', milestones: [{ name: 'Wireframes signed off', date: dOff(2) }, { name: 'Dev handoff', date: dOff(14) }, { name: 'Public launch', date: dOff(24) }], last: 12 },
    { id: 'p2', key: 'MOB', name: 'Mobile App', icon: 'smartphone', color: 'blue', status: 'active', team: 'eng', lead: 'm3', due: dOff(52), start: dOff(-45), fav: true, members: ['m1', 'm3', 'm4', 'm6', 'm7'], desc: 'Native iOS and Android client for field teams with offline sync, push notifications, and biometric sign-in.', milestones: [{ name: 'Beta build', date: dOff(9) }, { name: 'App Store submission', date: dOff(45) }], last: 48 },
    { id: 'p3', key: 'MKT', name: 'Marketing Campaign', icon: 'megaphone', color: 'rose', status: 'planning', team: 'mkt', lead: 'm5', due: dOff(40), start: dOff(-10), fav: false, members: ['m1', 'm4', 'm5', 'm7', 'm8'], desc: 'Q4 awareness campaign across paid social, email, and a launch webinar targeting operations leads.', milestones: [{ name: 'Creative lock', date: dOff(12) }, { name: 'Campaign live', date: dOff(21) }], last: 130 },
    { id: 'p4', key: 'LCH', name: 'Product Launch', icon: 'rocket', color: 'amber', status: 'risk', team: 'product', lead: 'm1', due: dOff(12), start: dOff(-21), fav: false, members: ['m1', 'm2', 'm3', 'm5', 'm7'], desc: 'Coordinate the Workflows 2.0 launch: pricing, docs, press, and sales enablement across teams.', milestones: [{ name: 'Go / no-go', date: dOff(11) }, { name: 'Launch day', date: dOff(12) }], last: 35 },
    { id: 'p5', key: 'DS', name: 'Design System', icon: 'component', color: 'violet', status: 'active', team: 'design', lead: 'm2', due: dOff(70), start: dOff(-60), fav: false, members: ['m2', 'm3', 'm4'], desc: 'Shared tokens, components, and documentation used by web and mobile teams.', milestones: [{ name: 'v2 tokens', date: dOff(3) }], last: 300 },
    { id: 'p6', key: 'CP', name: 'Customer Portal', icon: 'building-2', color: 'teal', status: 'hold', team: 'eng', lead: 'm6', due: dOff(90), start: dOff(-5), fav: false, members: ['m6', 'm7'], private: true, desc: 'Self-serve billing and support portal for enterprise customers. Restricted during contract review.', milestones: [], last: 2880 },
    { id: 'p7', key: 'MW', name: 'Marketing Website', icon: 'layout-grid', color: 'green', status: 'complete', team: 'mkt', lead: 'm5', due: dOff(-18), start: dOff(-80), fav: false, members: ['m1', 'm3', 'm5'], desc: 'Launch site for the spring release. Shipped and handed to the web team for maintenance.', milestones: [], last: 26000 },
  ];
  let n = 0; const T = [];
  const t = (p, title, status, a, prio, due, labels = [], x = {}) => {
    const proj = projects.find(q => q.id === p);
    const count = T.filter(q => q.project === p).length + 1;
    T.push(Object.assign({ id: 't' + (++n), key: proj.key + '-' + (100 + count * 3), project: p, title, status, assignee: a, priority: prio, due: due == null ? null : dOff(due), start: due == null ? null : dOff(due - (x.len || 4)), labels, subtasks: [], attachments: [], deps: [], desc: '', estimate: x.est || null, created: minsAgo(60 * 24 * (x.age || 12)), updated: minsAgo(60 * (x.upd || 30)), order: n, fav: false, recur: null }, x));
  };
  // Website Redesign
  t('p1', 'Audit existing navigation', 'done', 'm2', 'high', -12, ['research'], { est: '2d', len: 5, age: 28 });
  t('p1', 'Summarize stakeholder interviews', 'done', 'm1', 'medium', -9, ['research'], { est: '1d', age: 26 });
  t('p1', 'Create homepage wireframes', 'review', 'm2', 'high', 1, ['design'], { est: '3d', len: 7, fav: true, desc: '<p>Low-fidelity wireframes for the new homepage covering <b>desktop, tablet, and mobile</b> breakpoints.</p><ul><li>Hero with product value proposition</li><li>Customer logos and proof points</li><li>Feature overview linking to product pages</li></ul><p>Reference the navigation audit for IA decisions.</p>', subtasks: [{ id: 's1', title: 'Desktop layout', done: true }, { id: 's2', title: 'Tablet layout', done: true }, { id: 's3', title: 'Mobile layout', done: true }, { id: 's4', title: 'Annotate interactions', done: false }], attachments: [{ id: 'a1', name: 'homepage-wireframes-v3.fig', type: 'fig', size: '4.2 MB', by: 'm2', at: minsAgo(300) }, { id: 'a2', name: 'nav-audit-findings.pdf', type: 'pdf', size: '860 KB', by: 'm2', at: minsAgo(8000) }] });
  t('p1', 'Finalize navigation', 'progress', 'm3', 'high', 0, ['design', 'frontend'], { est: '2d', len: 4, subtasks: [{ id: 's5', title: 'Primary nav structure', done: true }, { id: 's6', title: 'Mega-menu content', done: false }, { id: 's7', title: 'Mobile drawer behavior', done: false }] });
  t('p1', 'Design responsive navigation', 'progress', 'm4', 'medium', 3, ['design'], { est: '3d', len: 6, subtasks: [{ id: 's8', title: 'Breakpoint rules', done: true }, { id: 's9', title: 'Sticky header states', done: false }] });
  t('p1', 'Prepare design system tokens', 'todo', 'm1', 'medium', 6, ['design'], { est: '2d', len: 4 });
  t('p1', 'Review responsive layouts', 'todo', 'm4', 'medium', 8, ['qa', 'design'], { est: '1d', len: 3 });
  t('p1', 'Prepare developer handoff', 'todo', 'm2', 'high', 14, ['frontend'], { est: '2d', len: 4, deps: ['t3', 't5'] });
  t('p1', 'Design mobile onboarding', 'progress', 'm4', 'urgent', -1, ['design'], { est: '3d', len: 6, subtasks: [{ id: 's10', title: 'Welcome screens', done: true }, { id: 's11', title: 'Permission prompts', done: false }, { id: 's12', title: 'Empty states', done: false }] });
  t('p1', 'Write homepage copy', 'backlog', 'm5', 'low', 18, ['content'], { est: '2d' });
  t('p1', 'Set up analytics events', 'backlog', 'm6', 'medium', 20, ['backend', 'growth'], { est: '1d' });
  t('p1', 'Accessibility audit of templates', 'backlog', 'm7', 'high', 22, ['qa'], { est: '2d' });
  t('p1', 'Build hero component', 'todo', 'm3', 'medium', 10, ['frontend'], { est: '2d', len: 3, deps: ['t3'] });
  t('p1', 'Image optimization pipeline', 'review', 'm6', 'low', 2, ['backend'], { est: '1d', len: 5 });
  t('p1', 'Weekly design sync notes', 'todo', 'm1', 'low', 2, ['content'], { recur: 'Weekly', est: '30m', len: 0 });
  t('p1', 'Migrate blog to new CMS', 'backlog', 'm3', 'medium', 28, ['backend'], { est: '5d', len: 8 });
  t('p1', 'Footer and legal pages', 'done', 'm5', 'low', -5, ['frontend'], { est: '1d' });
  t('p1', 'Fix broken anchor links on pricing', 'done', 'm3', 'medium', -3, ['bug'], { est: '2h', len: 1 });
  // Mobile App
  t('p2', 'Onboarding flow prototype', 'progress', 'm4', 'high', 4, ['design'], { est: '3d', len: 6 });
  t('p2', 'Push notification service', 'progress', 'm6', 'high', 6, ['backend'], { est: '5d', len: 9 });
  t('p2', 'Offline mode sync', 'todo', 'm3', 'urgent', 5, ['frontend', 'backend'], { est: '8d', len: 10, deps: ['t20'] });
  t('p2', 'App Store screenshots', 'backlog', 'm5', 'low', 40, ['content'], { est: '1d' });
  t('p2', 'Crash reporting setup', 'done', 'm6', 'medium', -8, ['backend'], { est: '1d' });
  t('p2', 'Biometric sign-in', 'review', 'm3', 'high', 2, ['frontend'], { est: '3d', len: 6 });
  t('p2', 'Settings screen redesign', 'todo', 'm4', 'medium', 9, ['design'], { est: '2d' });
  t('p2', 'Triage beta tester feedback', 'todo', 'm1', 'medium', 0, ['research'], { est: '4h', len: 1, recur: 'Weekly' });
  t('p2', 'Crash on Android 12 when rotating', 'todo', 'm3', 'urgent', 1, ['bug'], { est: '1d', len: 1 });
  // Marketing Campaign
  t('p3', 'Campaign brief', 'done', 'm5', 'medium', -6, ['content'], { est: '1d' });
  t('p3', 'Landing page copy', 'progress', 'm5', 'medium', 4, ['content'], { est: '2d' });
  t('p3', 'Paid social creatives', 'todo', 'm4', 'high', 7, ['design', 'growth'], { est: '3d', len: 5 });
  t('p3', 'Email nurture sequence', 'todo', 'm8', 'medium', 9, ['content'], { est: '2d' });
  t('p3', 'Influencer outreach list', 'backlog', 'm7', 'low', null, ['growth']);
  t('p3', 'Launch webinar deck', 'todo', 'm1', 'medium', 15, ['content'], { est: '2d' });
  t('p3', 'Budget approval', 'review', 'm1', 'urgent', -2, [], { est: '1h', len: 1 });
  // Product Launch
  t('p4', 'Launch readiness checklist', 'progress', 'm1', 'urgent', 3, ['qa'], { est: '1d', len: 10, subtasks: [{ id: 's20', title: 'Docs published', done: true }, { id: 's21', title: 'Pricing live', done: false }, { id: 's22', title: 'Support trained', done: false }, { id: 's23', title: 'Status page updated', done: true }] });
  t('p4', 'Pricing page update', 'todo', 'm2', 'high', 6, ['design', 'frontend'], { est: '2d' });
  t('p4', 'Press release draft', 'review', 'm5', 'medium', 1, ['content'], { est: '1d' });
  t('p4', 'Sales enablement docs', 'todo', 'm7', 'medium', 8, ['content'], { est: '2d' });
  t('p4', 'Release notes', 'backlog', 'm3', 'low', 11, ['content'], { est: '4h' });
  t('p4', 'Go / no-go meeting', 'todo', 'm1', 'high', 11, [], { est: '1h', len: 0 });
  // Design System
  t('p5', 'Color tokens v2', 'done', 'm2', 'high', -4, ['design'], { est: '3d' });
  t('p5', 'Button component audit', 'progress', 'm2', 'medium', 5, ['design', 'frontend'], { est: '2d' });
  t('p5', 'Form field states', 'todo', 'm4', 'medium', 12, ['design'], { est: '3d' });
  t('p5', 'Icon library cleanup', 'backlog', 'm4', 'low', null, ['design']);
  t('p5', 'Documentation site', 'todo', 'm3', 'medium', 20, ['frontend'], { est: '5d', len: 8 });
  t('p5', 'Dark mode palette', 'review', 'm2', 'high', 2, ['design'], { est: '2d' });
  // Marketing Website (complete)
  t('p7', 'Launch site QA', 'done', 'm3', 'high', -20, ['qa']);
  t('p7', 'Spring release hero video', 'done', 'm5', 'medium', -24, ['content']);
  // Customer portal (restricted)
  t('p6', 'Billing API contract', 'todo', 'm6', 'high', 30, ['backend']);

  const tk = id => T.find(x => x.id === id);
  // completed metadata
  T.filter(x => x.status === 'done').forEach((x, i) => x.completedAt = minsAgo(60 * (6 + i * 17)));
  const comments = [
    { id: 'c1', task: 't3', by: 'm4', at: minsAgo(260), text: 'Tablet layout feels crowded around the logo strip. Could we drop to four logos under 1024px?', re: { '👍': ['m2', 'm3'] } },
    { id: 'c2', task: 't3', by: 'm2', at: minsAgo(210), text: 'Good call. Updated in v3 — @Alex Morgan can you review before Thursday?', re: {} },
    { id: 'c3', task: 't3', by: 'm3', at: minsAgo(95), text: 'Hero spacing maps cleanly to our 8pt scale. No blockers from engineering.', re: { '🎉': ['m2'] } },
    { id: 'c4', task: 't4', by: 'm3', at: minsAgo(400), text: 'Mega-menu content still pending from marketing. I\'ll stub it for now.', re: {} },
    { id: 'c5', task: 't4', by: 'm5', at: minsAgo(120), text: '@John Carter content is in the shared doc now — six columns max.', re: { '👍': ['m3'] } },
    { id: 'c6', task: 't9', by: 'm1', at: minsAgo(55), text: 'This slipped past yesterday — @Emma Wilson anything blocking the permission prompts?', re: {} },
    { id: 'c7', task: 't24', by: 'm7', at: minsAgo(700), text: 'Face ID fallback to passcode works on iOS 17; testing Android next.', re: {} },
    { id: 'c8', task: 't34', by: 'm2', at: minsAgo(1500), text: 'Finance needs the channel split before approving.', re: {} },
    { id: 'c9', task: 't35', by: 'm7', at: minsAgo(200), text: 'Support training moved to Monday. @Alex Morgan please confirm the status page copy.', re: {} },
  ];
  const A = (by, verb, task, project, m, extra = '') => ({ id: uid('a'), by, verb, task, project, at: minsAgo(m), extra });
  const activity = [
    A('m2', 'moved', 't3', 'p1', 38, 'to Review'),
    A('m3', 'completed', 't18', 'p1', 90),
    A('m4', 'commented on', 't19', 'p2', 140),
    A('m1', 'changed priority of', 't9', 'p1', 180, 'to Urgent'),
    A('m6', 'added a file to', 't14', 'p1', 260),
    A('m5', 'created', 't30', 'p3', 330),
    A('m2', 'assigned', 't8', 'p1', 420, 'to Sarah Chen'),
    A('m7', 'completed', 't23', 'p2', 1300),
    A('m3', 'moved', 't24', 'p2', 1500, 'to Review'),
    A('m1', 'created project', null, 'p4', 30000),
    A('m2', 'created project', null, 'p1', 43000),
    A('m4', 'completed', 't41', 'p5', 5600),
    A('m5', 'completed', 't17', 'p1', 7200),
  ];
  const notifs = [
    { id: 'n1', type: 'mention', by: 'm2', task: 't3', text: 'mentioned you in', snippet: 'Updated in v3 — @Alex Morgan can you review before Thursday?', at: minsAgo(210), read: false },
    { id: 'n2', type: 'assign', by: 'm3', task: 't28', text: 'assigned you', snippet: 'Due today · Medium priority', at: minsAgo(300), read: false },
    { id: 'n3', type: 'comment', by: 'm4', task: 't9', text: 'commented on', snippet: 'Permission prompts need legal review — drafting now.', at: minsAgo(40), read: false },
    { id: 'n4', type: 'mention', by: 'm7', task: 't35', text: 'mentioned you in', snippet: 'Support training moved to Monday. @Alex Morgan please confirm the status page copy.', at: minsAgo(200), read: false },
    { id: 'n5', type: 'update', by: 'm2', task: 't3', text: 'moved to Review', snippet: 'To Do → Review', at: minsAgo(38), read: true },
    { id: 'n6', type: 'update', by: null, project: 'p4', text: 'Product Launch is at risk', snippet: '3 tasks due this week are not started', at: minsAgo(600), read: false },
    { id: 'n7', type: 'comment', by: 'm2', task: 't34', text: 'commented on', snippet: 'Finance needs the channel split before approving.', at: minsAgo(1500), read: true },
    { id: 'n8', type: 'assign', by: 'm2', task: 't6', text: 'assigned you', snippet: 'Due in 6 days', at: minsAgo(2900), read: true },
    { id: 'n9', type: 'update', by: 'm3', task: 't18', text: 'completed', snippet: 'Fix broken anchor links on pricing', at: minsAgo(90), read: true },
    { id: 'n10', type: 'update', by: null, task: 't28', text: 'is due today', snippet: 'Triage beta tester feedback', at: minsAgo(20), read: false },
  ];
  const files = [
    { id: 'f1', project: 'p1', name: 'homepage-wireframes-v3.fig', type: 'fig', size: '4.2 MB', by: 'm2', at: minsAgo(300), task: 't3' },
    { id: 'f2', project: 'p1', name: 'nav-audit-findings.pdf', type: 'pdf', size: '860 KB', by: 'm2', at: minsAgo(8000), task: 't3' },
    { id: 'f3', project: 'p1', name: 'brand-photography-set.zip', type: 'zip', size: '128 MB', by: 'm4', at: minsAgo(3000) },
    { id: 'f4', project: 'p1', name: 'hero-exploration.png', type: 'img', size: '2.1 MB', by: 'm4', at: minsAgo(1400) },
    { id: 'f5', project: 'p1', name: 'content-inventory.xlsx', type: 'sheet', size: '310 KB', by: 'm5', at: minsAgo(9000) },
    { id: 'f6', project: 'p1', name: 'sitemap-v2.pdf', type: 'pdf', size: '540 KB', by: 'm1', at: minsAgo(12000) },
    { id: 'f7', project: 'p1', name: 'interview-notes.docx', type: 'doc', size: '96 KB', by: 'm1', at: minsAgo(20000) },
    { id: 'f8', project: 'p1', name: 'analytics-events.json', type: 'code', size: '12 KB', by: 'm6', at: minsAgo(700) },
    { id: 'f9', project: 'p2', name: 'onboarding-flow.fig', type: 'fig', size: '6.8 MB', by: 'm4', at: minsAgo(500) },
    { id: 'f10', project: 'p2', name: 'beta-feedback.xlsx', type: 'sheet', size: '220 KB', by: 'm1', at: minsAgo(900) },
    { id: 'f11', project: 'p3', name: 'campaign-brief.pdf', type: 'pdf', size: '1.1 MB', by: 'm5', at: minsAgo(4000) },
    { id: 'f12', project: 'p4', name: 'launch-plan.docx', type: 'doc', size: '180 KB', by: 'm1', at: minsAgo(6000) },
  ];
  const events = [
    { id: 'e1', title: 'Design review', date: dOff(1), time: '10:00', project: 'p1' },
    { id: 'e2', title: 'Sprint planning', date: dOff(5), time: '09:30', project: 'p2' },
    { id: 'e3', title: 'Launch sync', date: dOff(0), time: '15:00', project: 'p4' },
    { id: 'e4', title: 'Stakeholder demo', date: dOff(9), time: '14:00', project: 'p1' },
    { id: 'e5', title: 'Campaign kickoff', date: dOff(-3), time: '11:00', project: 'p3' },
    { id: 'e6', title: 'Retro', date: dOff(12), time: '16:00', project: 'p2' },
  ];
  const tmp = tk('t3'); tmp.updated = minsAgo(38);
  return {
    ws: { name: 'Gr8r Studio', url: 'gr8rstudio', c: '#1D1C1A', brand: true },
    workspaces: [{ id: 'w1', name: 'Gr8r Studio', c: '#1D1C1A', plan: 'Team', brand: true }, { id: 'w2', name: 'Personal', c: '#3D8E5F', plan: 'Free' }, { id: 'w3', name: 'Acme Labs', c: '#3B82C4', plan: 'Business' }],
    me: 'm1', members, projects, tasks: T, comments, activity, notifs, files, events,
    projOrder: projects.map(p => p.id),
    savedViews: [{ id: 'v1', project: 'p1', name: 'High priority', type: 'list', filters: [{ f: 'priority', op: 'is', v: ['urgent', 'high'] }] }],
    recentSearches: ['homepage', 'Sarah', 'wireframes'],
    sessions: [
      { id: 'se1', dev: 'MacBook Pro · Chrome', loc: 'San Francisco, US', at: 'Active now', cur: true },
      { id: 'se2', dev: 'iPhone 15 · Gr8r app', loc: 'San Francisco, US', at: '2 hours ago' },
      { id: 'se3', dev: 'Windows · Edge', loc: 'Oakland, US', at: 'Sep 12' }],
    invoices: [
      { id: 'INV-2026-009', date: dOff(-23), amt: '$96.00', st: 'Paid' }, { id: 'INV-2026-008', date: dOff(-53), amt: '$96.00', st: 'Paid' },
      { id: 'INV-2026-007', date: dOff(-84), amt: '$80.00', st: 'Paid' }, { id: 'INV-2026-006', date: dOff(-114), amt: '$80.00', st: 'Paid' }],
    tfa: false,
    notifPrefs: { email_mention: true, email_assign: true, email_digest: true, email_comment: false, push_mention: true, push_assign: true, push_comment: true, push_due: true, mention_all: true, assign_self: true },
  };
}

/* ---------- store ---------- */
const STORE_KEY = 'gr8r.v1';
const DEFAULT_PREFS = { theme: 'system', accent: 'indigo', side: 'comfortable', density: 'comfortable', weekStart: 1, dateFmt: 'MMM d', lang: 'English (US)', tz: '(GMT-07:00) Pacific Time', motion: 'system', home: 'home', openTasks: 'drawer', name: 'Alex Morgan', title: 'Head of Product' };
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const j = JSON.parse(raw); if (j && j.data && j.data.tasks) return j; } } catch (e) { }
  return null;
}
const saved = load();
const S = {
  data: saved?.data || seed(),
  prefs: Object.assign({}, DEFAULT_PREFS, saved?.prefs || {}),
  views: saved?.views || {},
  ui: {
    fx: {}, auth: null, authStep: 'login', onb: 0, onbData: { use: 'product', team: 'kanban', size: '2-10', ws: '', proj: 'Website Launch', tmpl: 'web', invites: '' },
    route: 'home', params: {}, history: [], collapsed: !!saved?.collapsed, mnav: false, expanded: { p1: true },
    drawer: null, drawerFull: false, drawerTab: 'comments', modals: [], pop: null, palette: null,
    loading: false, offline: false, sel: new Set(), composer: null, editCell: null, openTasks: {}, collapsedGroups: {},
    calDate: iso(TODAY), calMode: 'month', tlZoom: 'week', tlGroup: 'status', fileView: 'grid', projView: 'grid',
    homeTab: 'upcoming', inboxCat: 'all', inboxUnread: false, inboxSel: null, notifFilter: 'all', settings: 'appearance',
    searchQ: '', searchCat: 'all', myView: 'list', membersTab: 'members', collapsedCols: {}, errors: {}, drafts: {},
  }
};
let _saveT;
function save() {
  clearTimeout(_saveT);
  _saveT = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ data: S.data, prefs: S.prefs, views: S.views, collapsed: S.ui.collapsed })); } catch (e) { }
  }, 150);
}

/* ---------- lookups ---------- */
const D = () => S.data;
const me = () => D().members.find(m => m.id === D().me);
const mem = id => D().members.find(m => m.id === id);
const proj = id => D().projects.find(p => p.id === id);
const task = id => D().tasks.find(t => t.id === id);
const pColor = p => PCOLORS[p?.color] || PCOLORS.slate;
const visibleProjects = () => D().projOrder.map(proj).filter(Boolean).filter(p => !p.archived);
const canSee = p => !p.private || p.members.includes(D().me);
const tasksOf = pid => D().tasks.filter(t => t.project === pid && !t.archived);
const allTasks = () => D().tasks.filter(t => !t.archived && canSee(proj(t.project)));
const isOver = t => t.due && t.status !== 'done' && diffD(parse(t.due), TODAY) < 0;
const commentsOf = tid => D().comments.filter(c => c.task === tid);
function progressOf(pid) { const ts = tasksOf(pid); if (!ts.length) return 0; return Math.round(ts.filter(t => t.status === 'done').length / ts.length * 100); }
function taskProg(t) { if (t.status === 'done') return 100; if (t.subtasks.length) return Math.round(t.subtasks.filter(s => s.done).length / t.subtasks.length * 100); return { backlog: 0, todo: 5, progress: 45, review: 80 }[t.status] || 0; }

/* ---------- activity + notification helpers ---------- */
function logAct(verb, t, extra = '') {
  D().activity.unshift({ id: uid('a'), by: D().me, verb, task: t?.id || null, project: t?.project || null, at: Date.now(), extra });
  if (t) t.updated = Date.now();
}

/* ---------- small render helpers ---------- */
function av(id, cls = '', tip = true) {
  const m = mem(id);
  if (!m) return `<span class="av empty ${cls}" ${tip ? 'data-tip="Unassigned"' : ''}>${ic('user', 11)}</span>`;
  const ini = m.name.split(' ').map(x => x[0]).join('').slice(0, 2);
  return `<span class="av ${cls}" style="--c:${m.c}" ${tip ? `data-tip="${esc(m.name)}"` : ''} aria-label="${esc(m.name)}">${ini}</span>`;
}
function avStack(ids, max = 4, cls = 'sm') {
  const v = ids.slice(0, max);
  return `<span class="avs">${v.map(i => av(i, cls)).join('')}${ids.length > max ? `<span class="av ${cls} more" style="--c:var(--gray)">+${ids.length - max}</span>` : ''}</span>`;
}
function stIcon(st, s = 14) {
  const c = `var(--st-${st})`; const r = 5.4, cx = 7, cy = 7;
  let inner = '';
  if (st === 'backlog') inner = `<circle cx="7" cy="7" r="${r}" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="1.9 2.1"/>`;
  else if (st === 'todo') inner = `<circle cx="7" cy="7" r="${r}" fill="none" stroke="${c}" stroke-width="1.5"/>`;
  else if (st === 'progress') inner = `<circle cx="7" cy="7" r="${r}" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M7 3.4A3.6 3.6 0 0 1 7 10.6Z" fill="${c}"/>`;
  else if (st === 'review') inner = `<circle cx="7" cy="7" r="${r}" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M7 3.4A3.6 3.6 0 1 1 3.4 7L7 7Z" fill="${c}"/>`;
  else inner = `<circle cx="7" cy="7" r="6.2" fill="${c}"/><path d="M4.4 7.2 6.2 9 9.7 5.3" fill="none" stroke="var(--surface)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg width="${s}" height="${s}" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0">${inner}</svg>`;
}
function prIcon(p, s = 14) {
  if (p === 'urgent') return `<svg width="${s}" height="${s}" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0"><rect x="1" y="1" width="12" height="12" rx="3" fill="var(--red)"/><path d="M7 3.8v4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="7" cy="10.1" r=".95" fill="#fff"/></svg>`;
  if (!p || p === 'none') return `<svg width="${s}" height="${s}" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0"><path d="M2.5 7h2M6 7h2M9.5 7h2" stroke="var(--text-3)" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const w = PR[p].w;
  const bar = (x, h, on) => `<rect x="${x}" y="${12 - h}" width="2.6" height="${h}" rx="1" fill="${on ? 'var(--text-2)' : 'var(--border-strong)'}"/>`;
  return `<svg width="${s}" height="${s}" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0">${bar(1.8, 4.5, w >= 1)}${bar(5.7, 7.5, w >= 2)}${bar(9.6, 10.5, w >= 3)}</svg>`;
}
const stPill = st => `${stIcon(st)}<span>${ST[st].name}</span>`;
const prPill = p => `${prIcon(p)}<span>${PR[p || 'none'].name}</span>`;
const lbl = id => LB[id] ? `<span class="lbl" style="--c:${LB[id].c}"><i></i>${LB[id].name}</span>` : '';
const pIcon = (p, cls = '', s = 15) => `<span class="picon ${cls}" style="--c:${pColor(p)}">${ic(p.icon, s)}</span>`;
const pStatus = s => `<span class="pstatus" style="--c:${PSTAT[s].c}"><i></i>${PSTAT[s].name}</span>`;
function dueHtml(t, withIcon = true) {
  if (!t.due) return '';
  const n = diffD(parse(t.due), TODAY);
  const cls = t.status === 'done' ? '' : n < 0 ? 'over' : n <= 1 ? 'soon' : '';
  return `<span class="due ${cls}">${withIcon ? ic('calendar', 12) : ''}${relDate(t.due)}</span>`;
}
function progBar(v, cls = '') { return `<span class="prog ${cls}" role="progressbar" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"><i style="--p:${v / 100}"></i></span>`; }
function empty(icon, title, text, btn = '', cls = '', level = 2) {
  return `<div class="empty-state ${cls}"><div class="glyph">${ic(icon, 20)}</div><h${level} class="es-h">${esc(title)}</h${level}><p>${esc(text)}</p>${btn}</div>`;
}
function hl(text, q) {
  if (!q) return esc(text);
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}
function fmtComment(txt) {
  let h = esc(txt);
  D().members.forEach(m => { h = h.split('@' + esc(m.name)).join(`<span class="mention">@${esc(m.name)}</span>`); });
  return h;
}
const FT = { fig: { c: '#8662C9', i: 'pen-tool', n: 'Figma' }, pdf: { c: '#C4473A', i: 'file-text', n: 'PDF' }, zip: { c: '#6B7280', i: 'folder-archive', n: 'Archive' }, img: { c: '#23918A', i: 'image', n: 'Image' }, sheet: { c: '#3D8E5F', i: 'file-spreadsheet', n: 'Spreadsheet' }, doc: { c: '#3B82C4', i: 'file-text', n: 'Document' }, code: { c: '#C48A1E', i: 'file-code', n: 'Code' }, other: { c: '#6B7280', i: 'file', n: 'File' } };
function fileType(name) {
  const e = (name.split('.').pop() || '').toLowerCase();
  if (e === 'fig') return 'fig'; if (e === 'pdf') return 'pdf'; if (['zip', 'rar', '7z'].includes(e)) return 'zip';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(e)) return 'img'; if (['xlsx', 'xls', 'csv', 'numbers'].includes(e)) return 'sheet';
  if (['doc', 'docx', 'txt', 'md', 'pages', 'rtf'].includes(e)) return 'doc'; if (['js', 'ts', 'json', 'html', 'css', 'py'].includes(e)) return 'code'; return 'other';
}
function fsize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b / 1024) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function filePrev(f) {
  const t = FT[f.type] || FT.other;
  let art;
  if (f.type === 'img') art = `<div class="art" style="padding:0;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,${t.c} 35%,var(--surface)),color-mix(in srgb,${t.c} 10%,var(--surface)))"><svg viewBox="0 0 100 60" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M0 60 L30 28 L52 46 L70 32 L100 58 L100 60Z" fill="color-mix(in srgb,${t.c} 45%,var(--surface))"/><circle cx="76" cy="16" r="7" fill="color-mix(in srgb,${t.c} 30%,var(--surface))"/></svg></div>`;
  else if (f.type === 'sheet') art = `<div class="art" style="display:grid;grid-template-columns:repeat(4,1fr);gap:3px">${'<i></i>'.repeat(20)}</div>`;
  else if (f.type === 'fig') art = `<div class="art" style="flex-direction:row;gap:6px"><div style="flex:1;display:flex;flex-direction:column;gap:5px"><i class="h"></i><i></i><i style="width:70%"></i><i style="height:18px;background:color-mix(in srgb,${t.c} 20%,var(--surface))"></i></div><div style="width:34%;border-radius:3px;background:color-mix(in srgb,${t.c} 14%,var(--surface))"></div></div>`;
  else if (f.type === 'zip') art = `<div style="color:${t.c}">${ic('folder-archive', 30)}</div>`;
  else art = `<div class="art"><i class="h"></i><i></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div>`;
  const ext = (f.name.split('.').pop() || '').slice(0, 4);
  return `<div class="fprev">${art}<span class="ext" style="--c:${t.c}">${esc(ext)}</span></div>`;
}

/* ---------- theme ---------- */
function applyPrefs() {
  const r = document.documentElement, p = S.prefs;
  if (p.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', p.theme);
  if (p.accent === 'indigo') r.removeAttribute('data-accent'); else r.setAttribute('data-accent', p.accent);
  r.setAttribute('data-side', p.side); r.setAttribute('data-density', p.density);
  if (p.motion === 'reduce') r.setAttribute('data-motion', 'reduce'); else r.removeAttribute('data-motion');
}
function effectiveDark() {
  if (S.prefs.theme === 'dark') return true; if (S.prefs.theme === 'light') return false;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
}

/* ---------- toasts ---------- */
function toast(msg, opt = {}) {
  const host = $('#toasts'); if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  const icon = opt.kind === 'err' ? ic('circle-alert', 15, 'bad') : opt.kind === 'info' ? ic('info', 15) : ic('circle-check', 15, 'ok');
  el.innerHTML = `${icon}<span class="grow">${esc(msg)}</span>${opt.action ? `<button class="ta">${esc(opt.action)}</button>` : ''}<button class="ibtn ibtn-xs" aria-label="Dismiss" style="color:inherit;opacity:.6">${ic('x', 13)}</button>`;
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 160); };
  if (opt.action) el.querySelector('.ta').onclick = () => { opt.onAction?.(); kill(); };
  el.querySelector('.ibtn').onclick = kill;
  host.appendChild(el);
  setTimeout(kill, opt.ms || 4200);
}
/* guarded mutation: simulates offline failures for the "Failed to save" state */
function mutate(fn, label) {
  if (S.ui.offline) {
    toast("Your changes couldn't be saved. You're offline.", { kind: 'err', action: 'Try again', onAction: () => mutate(fn, label) });
    return false;
  }
  fn(); save(); render();
  return true;
}
