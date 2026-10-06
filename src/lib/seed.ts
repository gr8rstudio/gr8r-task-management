import { daysFromToday, minutesAgo } from "@/lib/dates";
import type {
  ActivityItem,
  Attachment,
  Comment,
  Member,
  Notification,
  PriorityId,
  Project,
  StatusId,
  Subtask,
  Task,
  WorkspaceData,
} from "@/types/workspace";

type Extra = {
  est?: string;
  len?: number;
  age?: number;
  upd?: number;
  fav?: boolean;
  desc?: string;
  subtasks?: Subtask[];
  attachments?: Attachment[];
  deps?: string[];
  recur?: string;
};

export function seed(): WorkspaceData {
  const members: Member[] = [
    { id: "m1", name: "Alex Morgan", email: "hello@gr8rstudio.com", role: "Owner", team: "product", title: "Head of Product", color: "#5A67D8", status: "active", last: 0, tz: "San Francisco" },
    { id: "m2", name: "Sarah Chen", email: "sarah@gr8rstudio.com", role: "Admin", team: "design", title: "Design Lead", color: "#C54B78", status: "active", last: 4, tz: "New York" },
    { id: "m3", name: "John Carter", email: "john@gr8rstudio.com", role: "Member", team: "eng", title: "Frontend Engineer", color: "#3B82C4", status: "active", last: 22, tz: "London" },
    { id: "m4", name: "Emma Wilson", email: "emma@gr8rstudio.com", role: "Member", team: "design", title: "Product Designer", color: "#23918A", status: "active", last: 9, tz: "Berlin" },
    { id: "m5", name: "Priya Patel", email: "priya@gr8rstudio.com", role: "Member", team: "mkt", title: "Content Strategist", color: "#C48A1E", status: "active", last: 95, tz: "Toronto" },
    { id: "m6", name: "Marcus Lee", email: "marcus@gr8rstudio.com", role: "Member", team: "eng", title: "Backend Engineer", color: "#8662C9", status: "active", last: 240, tz: "Singapore" },
    { id: "m7", name: "Lena Fischer", email: "lena@gr8rstudio.com", role: "Admin", team: "product", title: "QA Lead", color: "#3D8E5F", status: "active", last: 1500, tz: "Munich" },
    { id: "m8", name: "Diego Alvarez", email: "diego@freelance.io", role: "Guest", team: "mkt", title: "Freelance Copywriter", color: "#C0612B", status: "invited", last: null, tz: "Madrid" },
  ];

  const projects: Project[] = [
    { id: "p1", key: "WEB", name: "Website Redesign", icon: "globe", color: "indigo", status: "active", team: "design", lead: "m2", due: daysFromToday(24), start: daysFromToday(-30), fav: true, members: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"], desc: "Rebuild gr8rstudio.com with a clearer information architecture, a responsive component library, and a faster CMS-driven blog.", milestones: [{ name: "Wireframes signed off", date: daysFromToday(2) }, { name: "Dev handoff", date: daysFromToday(14) }, { name: "Public launch", date: daysFromToday(24) }], last: 12 },
    { id: "p2", key: "MOB", name: "Mobile App", icon: "smartphone", color: "blue", status: "active", team: "eng", lead: "m3", due: daysFromToday(52), start: daysFromToday(-45), fav: true, members: ["m1", "m3", "m4", "m6", "m7"], desc: "Native iOS and Android client for field teams with offline sync, push notifications, and biometric sign-in.", milestones: [{ name: "Beta build", date: daysFromToday(9) }, { name: "App Store submission", date: daysFromToday(45) }], last: 48 },
    { id: "p3", key: "MKT", name: "Marketing Campaign", icon: "megaphone", color: "rose", status: "planning", team: "mkt", lead: "m5", due: daysFromToday(40), start: daysFromToday(-10), fav: false, members: ["m1", "m4", "m5", "m7", "m8"], desc: "Q4 awareness campaign across paid social, email, and a launch webinar targeting operations leads.", milestones: [{ name: "Creative lock", date: daysFromToday(12) }, { name: "Campaign live", date: daysFromToday(21) }], last: 130 },
    { id: "p4", key: "LCH", name: "Product Launch", icon: "rocket", color: "amber", status: "risk", team: "product", lead: "m1", due: daysFromToday(12), start: daysFromToday(-21), fav: false, members: ["m1", "m2", "m3", "m5", "m7"], desc: "Coordinate the Workflows 2.0 launch: pricing, docs, press, and sales enablement across teams.", milestones: [{ name: "Go / no-go", date: daysFromToday(11) }, { name: "Launch day", date: daysFromToday(12) }], last: 35 },
    { id: "p5", key: "DS", name: "Design System", icon: "component", color: "violet", status: "active", team: "design", lead: "m2", due: daysFromToday(70), start: daysFromToday(-60), fav: false, members: ["m2", "m3", "m4"], desc: "Shared tokens, components, and documentation used by web and mobile teams.", milestones: [{ name: "v2 tokens", date: daysFromToday(3) }], last: 300 },
    { id: "p6", key: "CP", name: "Customer Portal", icon: "building-2", color: "teal", status: "hold", team: "eng", lead: "m6", due: daysFromToday(90), start: daysFromToday(-5), fav: false, members: ["m6", "m7"], private: true, desc: "Self-serve billing and support portal for enterprise customers. Restricted during contract review.", milestones: [], last: 2880 },
    { id: "p7", key: "MW", name: "Marketing Website", icon: "layout-grid", color: "green", status: "complete", team: "mkt", lead: "m5", due: daysFromToday(-18), start: daysFromToday(-80), fav: false, members: ["m1", "m3", "m5"], desc: "Launch site for the spring release. Shipped and handed to the web team for maintenance.", milestones: [], last: 26000 },
  ];

  const tasks: Task[] = [];
  let n = 0;
  const add = (projectId: string, title: string, status: StatusId, assignee: string, priority: PriorityId, due: number | null, labels: string[] = [], extra: Extra = {}) => {
    const project = projects.find((item) => item.id === projectId)!;
    const count = tasks.filter((item) => item.project === projectId).length + 1;
    n += 1;
    tasks.push({
      id: `t${n}`,
      key: `${project.key}-${100 + count * 3}`,
      project: projectId,
      title,
      status,
      assignee,
      priority,
      due: due == null ? null : daysFromToday(due),
      start: due == null ? null : daysFromToday(due - (extra.len || 4)),
      labels,
      subtasks: extra.subtasks || [],
      attachments: extra.attachments || [],
      deps: extra.deps || [],
      desc: extra.desc || "",
      estimate: extra.est || null,
      created: minutesAgo(60 * 24 * (extra.age || 12)),
      updated: minutesAgo(60 * (extra.upd || 30)),
      order: n,
      fav: !!extra.fav,
      recur: extra.recur || null,
    });
  };

  add("p1", "Audit existing navigation", "done", "m2", "high", -12, ["research"], { est: "2d", len: 5, age: 28 });
  add("p1", "Summarize stakeholder interviews", "done", "m1", "medium", -9, ["research"], { est: "1d", age: 26 });
  add("p1", "Create homepage wireframes", "review", "m2", "high", 1, ["design"], { est: "3d", len: 7, fav: true, desc: "Low-fidelity wireframes for the new homepage covering desktop, tablet, and mobile.", subtasks: [{ id: "s1", title: "Desktop layout", done: true }, { id: "s2", title: "Tablet layout", done: true }, { id: "s3", title: "Mobile layout", done: true }, { id: "s4", title: "Annotate interactions", done: false }], attachments: [{ id: "a1", name: "homepage-wireframes-v3.fig", type: "fig", size: "4.2 MB", by: "m2", at: minutesAgo(300) }] });
  add("p1", "Finalize navigation", "progress", "m3", "high", 0, ["design", "frontend"], { est: "2d", len: 4, subtasks: [{ id: "s5", title: "Primary nav structure", done: true }, { id: "s6", title: "Mega-menu content", done: false }, { id: "s7", title: "Mobile drawer behavior", done: false }] });
  add("p1", "Design responsive navigation", "progress", "m4", "medium", 3, ["design"], { est: "3d", len: 6 });
  add("p1", "Prepare design system tokens", "todo", "m1", "medium", 6, ["design"], { est: "2d", len: 4 });
  add("p1", "Review responsive layouts", "todo", "m4", "medium", 8, ["qa", "design"], { est: "1d" });
  add("p1", "Prepare developer handoff", "todo", "m2", "high", 14, ["frontend"], { est: "2d", deps: ["t3", "t5"] });
  add("p1", "Design mobile onboarding", "progress", "m4", "urgent", -1, ["design"], { est: "3d", subtasks: [{ id: "s10", title: "Welcome screens", done: true }, { id: "s11", title: "Permission prompts", done: false }, { id: "s12", title: "Empty states", done: false }] });
  add("p1", "Write homepage copy", "backlog", "m5", "low", 18, ["content"], { est: "2d" });
  add("p1", "Set up analytics events", "backlog", "m6", "medium", 20, ["backend", "growth"], { est: "1d" });
  add("p1", "Accessibility audit of templates", "backlog", "m7", "high", 22, ["qa"], { est: "2d" });
  add("p1", "Build hero component", "todo", "m3", "medium", 10, ["frontend"], { est: "2d", deps: ["t3"] });
  add("p1", "Image optimization pipeline", "review", "m6", "low", 2, ["backend"], { est: "1d" });
  add("p1", "Weekly design sync notes", "todo", "m1", "low", 2, ["content"], { recur: "Weekly", est: "30m", len: 0 });
  add("p1", "Migrate blog to new CMS", "backlog", "m3", "medium", 28, ["backend"], { est: "5d" });
  add("p1", "Footer and legal pages", "done", "m5", "low", -5, ["frontend"], { est: "1d" });
  add("p1", "Fix broken anchor links on pricing", "done", "m3", "medium", -3, ["bug"], { est: "2h" });
  add("p2", "Onboarding flow prototype", "progress", "m4", "high", 4, ["design"], { est: "3d" });
  add("p2", "Push notification service", "progress", "m6", "high", 6, ["backend"], { est: "5d" });
  add("p2", "Offline mode sync", "todo", "m3", "urgent", 5, ["frontend", "backend"], { est: "8d", deps: ["t20"] });
  add("p2", "App Store screenshots", "backlog", "m5", "low", 40, ["content"]);
  add("p2", "Crash reporting setup", "done", "m6", "medium", -8, ["backend"]);
  add("p2", "Biometric sign-in", "review", "m3", "high", 2, ["frontend"], { est: "3d" });
  add("p2", "Settings screen redesign", "todo", "m4", "medium", 9, ["design"]);
  add("p2", "Triage beta tester feedback", "todo", "m1", "medium", 0, ["research"], { recur: "Weekly" });
  add("p2", "Crash on Android 12 when rotating", "todo", "m3", "urgent", 1, ["bug"]);
  add("p3", "Campaign brief", "done", "m5", "medium", -6, ["content"]);
  add("p3", "Landing page copy", "progress", "m5", "medium", 4, ["content"]);
  add("p3", "Paid social creatives", "todo", "m4", "high", 7, ["design", "growth"]);
  add("p3", "Email nurture sequence", "todo", "m8", "medium", 9, ["content"]);
  add("p3", "Influencer outreach list", "backlog", "m7", "low", null, ["growth"]);
  add("p3", "Launch webinar deck", "todo", "m1", "medium", 15, ["content"]);
  add("p3", "Budget approval", "review", "m1", "urgent", -2, []);
  add("p4", "Launch readiness checklist", "progress", "m1", "urgent", 3, ["qa"], { subtasks: [{ id: "s20", title: "Docs published", done: true }, { id: "s21", title: "Pricing live", done: false }, { id: "s22", title: "Support trained", done: false }, { id: "s23", title: "Status page updated", done: true }] });
  add("p4", "Pricing page update", "todo", "m2", "high", 6, ["design", "frontend"]);
  add("p4", "Press release draft", "review", "m5", "medium", 1, ["content"]);
  add("p4", "Sales enablement docs", "todo", "m7", "medium", 8, ["content"]);
  add("p4", "Release notes", "backlog", "m3", "low", 11, ["content"]);
  add("p4", "Go / no-go meeting", "todo", "m1", "high", 11, []);
  add("p5", "Color tokens v2", "done", "m2", "high", -4, ["design"]);
  add("p5", "Button component audit", "progress", "m2", "medium", 5, ["design", "frontend"]);
  add("p5", "Form field states", "todo", "m4", "medium", 12, ["design"]);
  add("p5", "Icon library cleanup", "backlog", "m4", "low", null, ["design"]);
  add("p5", "Documentation site", "todo", "m3", "medium", 20, ["frontend"]);
  add("p5", "Dark mode palette", "review", "m2", "high", 2, ["design"]);
  add("p7", "Launch site QA", "done", "m3", "high", -20, ["qa"]);
  add("p7", "Spring release hero video", "done", "m5", "medium", -24, ["content"]);
  add("p6", "Billing API contract", "todo", "m6", "high", 30, ["backend"]);

  tasks.filter((task) => task.status === "done").forEach((task, index) => {
    task.completedAt = minutesAgo(60 * (6 + index * 17));
  });
  const wireframes = tasks.find((task) => task.id === "t3");
  if (wireframes) wireframes.updated = minutesAgo(38);

  const comments: Comment[] = [
    { id: "c1", task: "t3", by: "m4", at: minutesAgo(260), text: "Tablet layout feels crowded around the logo strip. Could we drop to four logos under 1024px?" },
    { id: "c2", task: "t3", by: "m2", at: minutesAgo(210), text: "Good call. Updated in v3 — @Alex Morgan can you review before Thursday?" },
    { id: "c3", task: "t3", by: "m3", at: minutesAgo(95), text: "Hero spacing maps cleanly to our 8pt scale. No blockers from engineering." },
    { id: "c4", task: "t4", by: "m3", at: minutesAgo(400), text: "Mega-menu content still pending from marketing. I'll stub it for now." },
    { id: "c5", task: "t4", by: "m5", at: minutesAgo(120), text: "@John Carter content is in the shared doc now — six columns max." },
    { id: "c6", task: "t9", by: "m1", at: minutesAgo(55), text: "This slipped past yesterday — @Emma Wilson anything blocking the permission prompts?" },
    { id: "c9", task: "t35", by: "m7", at: minutesAgo(200), text: "Support training moved to Monday. @Alex Morgan please confirm the status page copy." },
  ];

  const activity: ActivityItem[] = [
    { id: "ac1", by: "m2", verb: "moved", task: "t3", project: "p1", at: minutesAgo(38), extra: "to Review" },
    { id: "ac2", by: "m3", verb: "completed", task: "t18", project: "p1", at: minutesAgo(90), extra: "" },
    { id: "ac3", by: "m4", verb: "commented on", task: "t19", project: "p2", at: minutesAgo(140), extra: "" },
    { id: "ac4", by: "m1", verb: "changed priority of", task: "t9", project: "p1", at: minutesAgo(180), extra: "to Urgent" },
    { id: "ac5", by: "m5", verb: "created", task: "t30", project: "p3", at: minutesAgo(330), extra: "" },
    { id: "ac6", by: "m2", verb: "assigned", task: "t8", project: "p1", at: minutesAgo(420), extra: "to Sarah Chen" },
    { id: "ac7", by: "m1", verb: "created project", task: null, project: "p4", at: minutesAgo(30000), extra: "" },
  ];

  const notifs: Notification[] = [
    { id: "n1", type: "mention", by: "m2", task: "t3", text: "mentioned you in", snippet: "Updated in v3 — @Alex Morgan can you review before Thursday?", at: minutesAgo(210), read: false },
    { id: "n2", type: "assign", by: "m3", task: "t26", text: "assigned you", snippet: "Due today · Medium priority", at: minutesAgo(300), read: false },
    { id: "n3", type: "comment", by: "m4", task: "t9", text: "commented on", snippet: "Permission prompts need legal review — drafting now.", at: minutesAgo(40), read: false },
    { id: "n4", type: "mention", by: "m7", task: "t35", text: "mentioned you in", snippet: "Support training moved to Monday.", at: minutesAgo(200), read: false },
    { id: "n5", type: "update", by: "m2", task: "t3", text: "moved to Review", snippet: "To Do → Review", at: minutesAgo(38), read: true },
    { id: "n6", type: "update", by: null, project: "p4", text: "Product Launch is at risk", snippet: "3 tasks due this week are not started", at: minutesAgo(600), read: false },
    { id: "n7", type: "comment", by: "m2", task: "t34", text: "commented on", snippet: "Finance needs the channel split before approving.", at: minutesAgo(1500), read: true },
    { id: "n8", type: "update", by: "m3", task: "t18", text: "completed", snippet: "Fix broken anchor links on pricing", at: minutesAgo(90), read: true },
  ];

  return {
    ws: { name: "Gr8r Studio", url: "gr8rstudio", color: "#1D1C1A", brand: true },
    me: "m1",
    members,
    teams: [
      { id: "design", name: "Design", icon: "palette", color: "#8662C9", desc: "Product design, brand, and research" },
      { id: "eng", name: "Engineering", icon: "code", color: "#3B82C4", desc: "Web, mobile, and platform engineering" },
      { id: "mkt", name: "Marketing", icon: "megaphone", color: "#C54B78", desc: "Campaigns, content, and growth" },
      { id: "product", name: "Product", icon: "target", color: "#C48A1E", desc: "Roadmap, planning, and QA" },
    ],
    projects,
    tasks,
    comments,
    activity,
    notifs,
    files: [
      { id: "f1", project: "p1", name: "homepage-wireframes-v3.fig", type: "fig", size: "4.2 MB", by: "m2", at: minutesAgo(300), task: "t3" },
      { id: "f2", project: "p1", name: "nav-audit-findings.pdf", type: "pdf", size: "860 KB", by: "m2", at: minutesAgo(8000), task: "t3" },
      { id: "f3", project: "p1", name: "brand-photography-set.zip", type: "zip", size: "128 MB", by: "m4", at: minutesAgo(3000) },
      { id: "f9", project: "p2", name: "onboarding-flow.fig", type: "fig", size: "6.8 MB", by: "m4", at: minutesAgo(500) },
      { id: "f11", project: "p3", name: "campaign-brief.pdf", type: "pdf", size: "1.1 MB", by: "m5", at: minutesAgo(4000) },
      { id: "f12", project: "p4", name: "launch-plan.docx", type: "doc", size: "180 KB", by: "m1", at: minutesAgo(6000) },
    ],
    events: [
      { id: "e1", title: "Design review", date: daysFromToday(1), time: "10:00", project: "p1" },
      { id: "e2", title: "Sprint planning", date: daysFromToday(5), time: "09:30", project: "p2" },
      { id: "e3", title: "Launch sync", date: daysFromToday(0), time: "15:00", project: "p4" },
      { id: "e4", title: "Stakeholder demo", date: daysFromToday(9), time: "14:00", project: "p1" },
    ],
    projOrder: projects.map((project) => project.id),
  };
}
