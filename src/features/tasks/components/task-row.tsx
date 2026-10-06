"use client";

import { Avatar } from "@/components/ui/avatar";
import { PriorityIcon, StatusIcon } from "@/components/ui/status";
import { relativeDate } from "@/lib/dates";
import { diffDays, parseIso, today } from "@/lib/dates";
import { isOverdue, projectById } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData } from "@/store/workspace-store";
import type { Task } from "@/types/workspace";

export function DueLabel({ task }: { task: Task }) {
  if (!task.due) return <span className="due" />;
  const due = parseIso(task.due);
  const delta = due ? diffDays(due, today()) : 0;
  const tone = task.status === "done" ? "" : delta < 0 ? "over" : delta <= 1 ? "soon" : "";
  return <span className={`due ${tone}`}>{relativeDate(task.due)}</span>;
}

export function TaskRow({
  task,
  showProject = true,
  showAvatar = true,
}: {
  task: Task;
  showProject?: boolean;
  showAvatar?: boolean;
}) {
  const data = useWorkspaceData();
  const openTask = useUiStore((state) => state.openTask);
  const project = projectById(data, task.project);
  return (
    <button type="button" className={`mini ${task.status === "done" ? "done" : ""}`} onClick={() => openTask(task.id)}>
      <StatusIcon status={task.status} />
      <span className="tt">{task.title}</span>
      {showProject && project ? (
        <span className="pj">
          <span className="pdot" style={{ ["--c" as string]: projectColor(project) }} />
          <span className="trunc">{project.name}</span>
        </span>
      ) : null}
      <PriorityIcon priority={task.priority} />
      <DueLabel task={task} />
      {showAvatar ? <Avatar id={task.assignee} size="sm" /> : null}
      {isOverdue(task) ? <span className="sr">Overdue</span> : null}
    </button>
  );
}
