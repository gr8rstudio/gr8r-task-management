import { diffDays, parseIso, today } from "@/lib/dates";
import type { Member, Project, Task, Team, WorkspaceData } from "@/types/workspace";

export function memberById(data: WorkspaceData, id: string | null | undefined) {
  if (!id) return undefined;
  return data.members.find((member) => member.id === id);
}

export function me(data: WorkspaceData) {
  return memberById(data, data.me) as Member;
}

export function projectById(data: WorkspaceData, id: string | null | undefined) {
  if (!id) return undefined;
  return data.projects.find((project) => project.id === id);
}

export function teamById(data: WorkspaceData, id: string | null | undefined) {
  if (!id) return undefined;
  return data.teams.find((team) => team.id === id);
}

export function taskById(data: WorkspaceData, id: string | null | undefined) {
  if (!id) return undefined;
  return data.tasks.find((task) => task.id === id);
}

export function canSee(data: WorkspaceData, project: Project) {
  return !project.private || project.members.includes(data.me);
}

export function visibleProjects(data: WorkspaceData) {
  return data.projOrder
    .map((id) => projectById(data, id))
    .filter((project): project is Project => !!project && !project.archived);
}

export function tasksOf(data: WorkspaceData, projectId: string) {
  return data.tasks.filter((task) => task.project === projectId && !task.archived);
}

export function allTasks(data: WorkspaceData) {
  return data.tasks.filter((task) => {
    if (task.archived) return false;
    const project = projectById(data, task.project);
    return !!project && canSee(data, project);
  });
}

export function isOverdue(task: Task) {
  if (!task.due || task.status === "done") return false;
  const due = parseIso(task.due);
  return !!due && diffDays(due, today()) < 0;
}

export function progressOf(data: WorkspaceData, projectId: string) {
  const tasks = tasksOf(data, projectId);
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "done").length / tasks.length) * 100);
}

export function commentsOf(data: WorkspaceData, taskId: string) {
  return data.comments.filter((comment) => comment.task === taskId).sort((a, b) => a.at - b.at);
}

export function sortByDue(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });
}

export function teamOf(data: WorkspaceData, member: Member): Team | undefined {
  return teamById(data, member.team);
}
