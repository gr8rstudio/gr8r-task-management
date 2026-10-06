"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { PriorityIcon, StatusIcon } from "@/components/ui/status";
import { ago } from "@/lib/dates";
import { commentsOf, memberById, projectById } from "@/lib/workspace";
import { labelById, priorityName, projectColor, STATUSES, statusName } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";

export function TaskDrawer() {
  const taskId = useUiStore((state) => state.taskId);
  const closeTask = useUiStore((state) => state.closeTask);
  const data = useWorkspaceData();
  const setTaskStatus = useWorkspaceStore((state) => state.setTaskStatus);
  const toggleTaskFav = useWorkspaceStore((state) => state.toggleTaskFav);
  const toggleSubtask = useWorkspaceStore((state) => state.toggleSubtask);
  const addComment = useWorkspaceStore((state) => state.addComment);
  const [draft, setDraft] = useState("");

  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return null;
  const project = projectById(data, task.project);
  const assignee = memberById(data, task.assignee);
  const comments = commentsOf(data, task.id);

  return (
    <>
      <button className="drawer-scrim" aria-label="Close task" onClick={closeTask} />
      <aside className="drawer enter" role="dialog" aria-label={task.title}>
        <div className="drawer-h">
          <span className="mono faint">{task.key}</span>
          <span className="sp" />
          <button className="ibtn ibtn-sm" aria-label="Favorite" onClick={() => toggleTaskFav(task.id)} style={{ color: task.fav ? "var(--amber)" : undefined }}>
            <Icon name="star" size={15} />
          </button>
          <button className="ibtn ibtn-sm" aria-label="Close" onClick={closeTask}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-b">
          <h2 style={{ fontSize: "var(--fs-xl)", margin: "0 0 8px", fontWeight: 600 }}>{task.title}</h2>
          {project ? (
            <div className="row" style={{ marginBottom: 14, color: "var(--text-2)", fontSize: 13 }}>
              <span className="pdot" style={{ ["--c" as string]: projectColor(project) }} />
              {project.name}
            </div>
          ) : null}
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <label className="pillbtn bordered">
              <StatusIcon status={task.status} />
              <select
                aria-label="Status"
                value={task.status}
                onChange={(event) => setTaskStatus(task.id, event.target.value as typeof task.status)}
                style={{ border: 0, background: "transparent" }}
              >
                {STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </label>
            <span className="pillbtn">
              <PriorityIcon priority={task.priority} />
              {priorityName(task.priority)}
            </span>
            <span className="pillbtn">
              <Avatar id={task.assignee} size="sm" />
              {assignee?.name || "Unassigned"}
            </span>
          </div>
          {task.desc ? <p style={{ lineHeight: 1.55 }}>{task.desc}</p> : <p className="muted">No description yet.</p>}
          {task.labels.length ? (
            <div className="row" style={{ gap: 6, margin: "12px 0" }}>
              {task.labels.map((id) => {
                const label = labelById(id);
                return label ? (
                  <span key={id} className="lbl" style={{ ["--c" as string]: label.color }}>
                    <i />
                    {label.name}
                  </span>
                ) : null;
              })}
            </div>
          ) : null}
          {task.subtasks.length ? (
            <div style={{ marginTop: 18 }}>
              <div className="eyebrow">Subtasks</div>
              {task.subtasks.map((sub) => (
                <label key={sub.id} className="row" style={{ height: 32, gap: 8 }}>
                  <input type="checkbox" className="check" checked={sub.done} onChange={() => toggleSubtask(task.id, sub.id)} />
                  <span style={{ textDecoration: sub.done ? "line-through" : undefined, color: sub.done ? "var(--text-3)" : undefined }}>{sub.title}</span>
                </label>
              ))}
            </div>
          ) : null}
          <div style={{ marginTop: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Comments</div>
            {comments.map((comment) => {
              const author = memberById(data, comment.by);
              return (
                <div key={comment.id} className="cmt" style={{ marginBottom: 12 }}>
                  <div className="who row" style={{ gap: 8 }}>
                    <Avatar id={comment.by} size="sm" />
                    <b>{author?.name}</b>
                    <time>{ago(comment.at)}</time>
                  </div>
                  <div className="txt">{comment.text}</div>
                </div>
              );
            })}
            <form
              className="cbox"
              onSubmit={(event) => {
                event.preventDefault();
                addComment(task.id, draft);
                setDraft("");
              }}
            >
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a comment" aria-label="Comment" />
              <div className="row">
                <span className="sp" />
                <button className="btn btn-primary btn-sm" type="submit">Comment</button>
              </div>
            </form>
          </div>
          <p className="faint" style={{ marginTop: 16, fontSize: 12 }}>Status: {statusName(task.status)}</p>
        </div>
      </aside>
    </>
  );
}
