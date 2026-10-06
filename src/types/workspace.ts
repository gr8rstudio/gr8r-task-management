export type Role = "Owner" | "Admin" | "Member" | "Guest";
export type MemberStatus = "active" | "invited" | "deactivated";
export type StatusId = "backlog" | "todo" | "progress" | "review" | "done";
export type PriorityId = "urgent" | "high" | "medium" | "low" | "none";
export type ProjectStatus = "planning" | "active" | "risk" | "hold" | "complete";
export type NotifType = "mention" | "assign" | "comment" | "update";
export type ThemePref = "light" | "dark" | "system";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
  title: string;
  color: string;
  status: MemberStatus;
  last: number | null;
  tz: string;
};

export type Team = {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
};

export type Milestone = { name: string; date: string };

export type Project = {
  id: string;
  key: string;
  name: string;
  icon: string;
  color: string;
  status: ProjectStatus;
  team: string;
  lead: string;
  due: string;
  start: string;
  fav: boolean;
  members: string[];
  desc: string;
  milestones: Milestone[];
  last: number;
  private?: boolean;
  archived?: boolean;
};

export type Subtask = { id: string; title: string; done: boolean };
export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: string;
  by: string;
  at: number;
};

export type Task = {
  id: string;
  key: string;
  project: string;
  title: string;
  status: StatusId;
  assignee: string | null;
  priority: PriorityId;
  due: string | null;
  start: string | null;
  labels: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  deps: string[];
  desc: string;
  estimate: string | null;
  created: number;
  updated: number;
  order: number;
  fav: boolean;
  recur: string | null;
  completedAt?: number;
  archived?: boolean;
};

export type Comment = {
  id: string;
  task: string;
  by: string;
  at: number;
  text: string;
};

export type ActivityItem = {
  id: string;
  by: string;
  verb: string;
  task: string | null;
  project: string | null;
  at: number;
  extra: string;
};

export type Notification = {
  id: string;
  type: NotifType;
  by: string | null;
  task?: string;
  project?: string;
  text: string;
  snippet: string;
  at: number;
  read: boolean;
};

export type WorkspaceFile = {
  id: string;
  project: string;
  name: string;
  type: string;
  size: string;
  by: string;
  at: number;
  task?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  project: string;
};

export type WorkspaceInfo = {
  name: string;
  url: string;
  color: string;
  brand: boolean;
};

export type WorkspaceData = {
  ws: WorkspaceInfo;
  me: string;
  members: Member[];
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  activity: ActivityItem[];
  notifs: Notification[];
  files: WorkspaceFile[];
  events: CalendarEvent[];
  projOrder: string[];
};

export type Prefs = {
  theme: ThemePref;
  accent: string;
  side: "comfortable" | "compact";
  density: "comfortable" | "compact";
  name: string;
  title: string;
};

export type ViewMode = "company" | "personal";
