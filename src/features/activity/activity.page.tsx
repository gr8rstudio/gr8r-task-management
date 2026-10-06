"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, PageHeader } from "@/components/ui/chrome";
import { ago, dayBucket } from "@/lib/dates";
import { canSee, projectById, taskById } from "@/lib/workspace";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData } from "@/store/workspace-store";

export default function ActivityPage() {
  const data = useWorkspaceData();
  const openTask = useUiStore((state) => state.openTask);
  const [who, setWho] = useState("all");
  const items = data.activity.filter((item) => {
    if (item.project) {
      const project = projectById(data, item.project);
      if (project && !canSee(data, project)) return false;
    }
    return who === "all" || item.by === who;
  });
  const buckets = new Map<string, typeof items>();
  items.forEach((item) => {
    const key = dayBucket(item.at);
    buckets.set(key, [...(buckets.get(key) || []), item]);
  });

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <PageHeader title="Activity" text="Everything that's changed across the workspace.">
        <select className="select" style={{ height: 26, width: "auto", fontSize: 12 }} value={who} onChange={(event) => setWho(event.target.value)} aria-label="Filter by person">
          <option value="all">Everyone</option>
          {data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </PageHeader>
      {items.length ? [...buckets.entries()].map(([bucket, list]) => (
        <div key={bucket}>
          <div className="day-h">{bucket}</div>
          <div className="feed lined">
            {list.map((item) => {
              const person = data.members.find((member) => member.id === item.by);
              const task = item.task ? taskById(data, item.task) : undefined;
              const project = projectById(data, item.project);
              return (
                <div key={item.id} className="fitem">
                  <Avatar id={item.by} size="sm" />
                  <div className="grow">
                    <b>{person?.name}</b> {item.verb}{" "}
                    {task ? <button className="obj" onClick={() => openTask(task.id)}>{task.title}</button> : null}{" "}
                    {project ? <span className="faint">in {project.name}</span> : null} {item.extra}
                  </div>
                  <time>{ago(item.at)}</time>
                </div>
              );
            })}
          </div>
        </div>
      )) : <EmptyState icon="activity" title="No activity yet" text="Changes to tasks and projects will appear here." />}
    </div>
  );
}
