"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/chrome";
import { ago } from "@/lib/dates";
import { memberById, projectById, taskById } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";
import type { Notification } from "@/types/workspace";

const CATS = [
  ["all", "All"],
  ["mention", "Mentions"],
  ["assign", "Assignments"],
  ["comment", "Comments"],
  ["update", "Updates"],
] as const;

function line(data: ReturnType<typeof useWorkspaceData>, note: Notification) {
  const who = note.by ? memberById(data, note.by)?.name : "";
  const task = note.task ? taskById(data, note.task) : undefined;
  if (!note.by && !task) return note.text;
  if (!note.by && task) return `${task.title} ${note.text}`;
  return `${who} ${note.text}${task ? ` ${task.title}` : ""}`;
}

export default function InboxPage() {
  const data = useWorkspaceData();
  const mark = useWorkspaceStore((state) => state.markNotification);
  const markAll = useWorkspaceStore((state) => state.markAllRead);
  const openTask = useUiStore((state) => state.openTask);
  const [cat, setCat] = useState<(typeof CATS)[number][0]>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(data.notifs.find((note) => !note.read)?.id ?? data.notifs[0]?.id ?? null);

  const notes = [...data.notifs].sort((a, b) => b.at - a.at).filter((note) => (cat === "all" || note.type === cat) && (!unreadOnly || !note.read));
  const current = data.notifs.find((note) => note.id === selected) || null;
  const task = current?.task ? taskById(data, current.task) : undefined;
  const project = current?.project ? projectById(data, current.project) : task ? projectById(data, task.project) : undefined;

  return (
    <div className="page flush">
      <div className="inbox-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,400px) minmax(0,1fr)", flex: 1, minHeight: 0, height: "100%" }}>
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="row" style={{ padding: "18px 16px 0" }}>
            <h1 style={{ fontSize: "var(--fs-xl)", margin: 0, fontWeight: 600 }}>Inbox</h1>
            <span className="sp" />
            <label className="row" style={{ fontSize: 12, gap: 6 }}>
              <input type="checkbox" className="toggle" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
              Unread
            </label>
            <button className="ibtn ibtn-sm" aria-label="Mark all as read" onClick={markAll}><Icon name="check-check" size={15} /></button>
          </div>
          <div className="tabs" style={{ padding: "0 8px", marginTop: 8 }}>
            {CATS.map(([id, label]) => (
              <button key={id} className={`tab ${cat === id ? "on" : ""}`} onClick={() => setCat(id)}>{label}</button>
            ))}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notes.length ? notes.map((note) => (
              <button key={note.id} className="row" style={{ alignItems: "flex-start", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--divider)", width: "100%", textAlign: "left", background: selected === note.id ? "var(--surface-2)" : undefined }} onClick={() => { setSelected(note.id); mark(note.id, true); }}>
                <Avatar id={note.by} size="md" />
                <div className="grow" style={{ fontSize: 13 }}>
                  <div>{line(data, note)}{!note.read ? <span className="badge accent" style={{ marginLeft: 6 }}>New</span> : null}</div>
                  <div className="trunc muted" style={{ marginTop: 2 }}>{note.snippet}</div>
                  <div className="faint" style={{ marginTop: 4, fontSize: 11 }}>{ago(note.at)}</div>
                </div>
              </button>
            )) : <EmptyState icon="inbox" title="You're all caught up." text="New mentions, assignments, and comments will show up here." />}
          </div>
        </div>
        <div style={{ overflowY: "auto" }}>
          {current && task ? (
            <div style={{ padding: "24px 28px", maxWidth: 720 }}>
              <div className="row" style={{ marginBottom: 10, gap: 8 }}>
                {project ? <span className="pdot" style={{ ["--c" as string]: projectColor(project) }} /> : null}
                <span className="muted">{project?.name}</span>
                <span className="mono faint">{task.key}</span>
              </div>
              <h2 style={{ margin: "0 0 8px" }}>{task.title}</h2>
              <p className="muted">{current.snippet}</p>
              <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => openTask(task.id)}>Open task</button>
            </div>
          ) : current && project ? (
            <div style={{ padding: 28 }}>
              <h2>{current.text}</h2>
              <p className="muted">{current.snippet}</p>
              <Link href={`/projects/${project.id}`} className="btn btn-secondary">Open project</Link>
            </div>
          ) : <EmptyState icon="mail-open" title="Select a notification" text="Read it without leaving your inbox." />}
        </div>
      </div>
    </div>
  );
}
