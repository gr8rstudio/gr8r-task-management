import type { PriorityId, Project, ProjectStatus, StatusId } from "@/types/workspace";

export const STATUSES: { id: StatusId; name: string }[] = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To Do" },
  { id: "progress", name: "In Progress" },
  { id: "review", name: "Review" },
  { id: "done", name: "Done" },
];

export const PRIORITIES: { id: PriorityId; name: string; weight: number }[] = [
  { id: "urgent", name: "Urgent", weight: 4 },
  { id: "high", name: "High", weight: 3 },
  { id: "medium", name: "Medium", weight: 2 },
  { id: "low", name: "Low", weight: 1 },
  { id: "none", name: "No priority", weight: 0 },
];

export const LABELS: { id: string; name: string; color: string }[] = [
  { id: "design", name: "Design", color: "var(--violet)" },
  { id: "frontend", name: "Frontend", color: "var(--blue)" },
  { id: "backend", name: "Backend", color: "var(--teal)" },
  { id: "research", name: "Research", color: "var(--amber)" },
  { id: "content", name: "Content", color: "var(--rose)" },
  { id: "bug", name: "Bug", color: "var(--red)" },
  { id: "qa", name: "QA", color: "var(--green)" },
  { id: "growth", name: "Growth", color: "var(--orange)" },
];

export const PROJECT_STATUS: Record<ProjectStatus, { name: string; color: string }> = {
  planning: { name: "Planning", color: "var(--gray)" },
  active: { name: "In Progress", color: "var(--blue)" },
  risk: { name: "At Risk", color: "var(--red)" },
  hold: { name: "On Hold", color: "var(--amber)" },
  complete: { name: "Completed", color: "var(--green)" },
};

export const PROJECT_COLORS: Record<string, string> = {
  indigo: "#5A67D8",
  blue: "#3B82C4",
  violet: "#8662C9",
  teal: "#23918A",
  rose: "#C54B78",
  amber: "#C48A1E",
  green: "#3D8E5F",
  slate: "#6B7280",
};

export const ROLES = ["Owner", "Admin", "Member", "Guest"] as const;

export function projectColor(project?: Project | null) {
  return PROJECT_COLORS[project?.color || "slate"] || PROJECT_COLORS.slate;
}

export function statusName(id: StatusId) {
  return STATUSES.find((status) => status.id === id)?.name ?? id;
}

export function priorityName(id: PriorityId) {
  return PRIORITIES.find((priority) => priority.id === id)?.name ?? "No priority";
}

export function priorityWeight(id: PriorityId) {
  return PRIORITIES.find((priority) => priority.id === id)?.weight ?? 0;
}

export function labelById(id: string) {
  return LABELS.find((label) => label.id === id);
}
