"use client";

import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, PageHeader } from "@/components/ui/chrome";
import { ago, dayBucket } from "@/lib/dates";
import { memberById, projectById, taskById } from "@/lib/workspace";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";
import { useState } from "react";

export default function NotificationsPage() {
  const data = useWorkspaceData();
  const mark = useWorkspaceStore((state) => state.markNotification);
  const markAll = useWorkspaceStore((state) => state.markAllRead);
  const openTask = useUiStore((state) => state.openTask);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notes = [...data.notifs].sort((a, b) => b.at - a.at).filter((note) => filter === "all" || !note.read);
  const unread = data.notifs.filter((note) => !note.read).length;
  const buckets = new Map<string, typeof notes>();
  notes.forEach((note) => {
    const key = dayBucket(note.at);
    buckets.set(key, [...(buckets.get(key) || []), note]);
  });

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <PageHeader title="Notifications" text="Updates on tasks and projects you follow.">
        <div className="seg">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "unread" ? "on" : ""} onClick={() => setFilter("unread")}>Unread</button>
        </div>
        <button className="btn btn-secondary" disabled={!unread} onClick={markAll}><Icon name="check-check" size={14} />Mark all as read</button>
      </PageHeader>
      {unread ? <span className="badge accent" style={{ marginBottom: 12 }}>{unread} unread</span> : null}
      {notes.length ? [...buckets.entries()].map(([bucket, list]) => (
        <div key={bucket}>
          <div className="day-h">{bucket}</div>
          <div className="panel" style={{ overflow: "hidden" }}>
            {list.map((note) => {
              const task = note.task ? taskById(data, note.task) : undefined;
              const project = note.project ? projectById(data, note.project) : task ? projectById(data, task.project) : undefined;
              const who = note.by ? memberById(data, note.by)?.name : "Workspace";
              return (
                <button key={note.id} className="row" style={{ gap: 12, padding: "11px 14px", borderTop: "1px solid var(--divider)", width: "100%", textAlign: "left", alignItems: "flex-start", background: note.read ? undefined : "color-mix(in srgb, var(--accent) 3.5%, transparent)" }} onClick={() => { mark(note.id, true); if (task) openTask(task.id); }}>
                  <Avatar id={note.by} size="md" />
                  <div className="grow" style={{ fontSize: 13 }}>
                    <div><b>{who}</b> <span className="muted">{note.text}</span> {task ? <b>{task.title}</b> : null}</div>
                    <div className="muted trunc">{note.snippet}</div>
                    <div className="faint" style={{ marginTop: 4 }}>{project?.name} · {ago(note.at)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )) : <div className="panel"><EmptyState icon="bell-off" title="You're all caught up." text="We'll let you know when something needs you." /></div>}
    </div>
  );
}
