"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { PageHeader } from "@/components/ui/chrome";
import { addDays, startOfDay, today, toIso } from "@/lib/dates";
import { allTasks, projectById } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData } from "@/store/workspace-store";

export default function CalendarPage() {
  const data = useWorkspaceData();
  const openTask = useUiStore((state) => state.openTask);
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [cursor]);
  const tasks = allTasks(data);
  const label = cursor.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="page flush" style={{ height: "100%" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <PageHeader title="Calendar" text="Tasks and meetings across the workspace.">
          <button className="ibtn" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><Icon name="chevron-left" size={16} /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => setCursor(startOfDay(new Date()))}>Today</button>
          <button className="ibtn" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><Icon name="chevron-right" size={16} /></button>
          <span style={{ fontWeight: 600 }}>{label}</span>
        </PageHeader>
      </div>
      <div className="cal">
        <div className="cal-h">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}</div>
        <div className="cal-g">
          {grid.map((day) => {
            const iso = toIso(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const due = tasks.filter((task) => task.due === iso).slice(0, 3);
            const events = data.events.filter((event) => event.date === iso);
            const isToday = iso === toIso(today());
            return (
              <div key={iso} style={{ borderRight: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)", padding: 6, opacity: inMonth ? 1 : 0.45, background: isToday ? "var(--accent-soft)" : undefined }}>
                <div className="num" style={{ fontSize: 12, fontWeight: isToday ? 600 : 500, marginBottom: 4 }}>{day.getDate()}</div>
                {events.map((event) => {
                  const project = projectById(data, event.project);
                  return <div key={event.id} className="trunc" style={{ fontSize: 11, marginBottom: 2, color: projectColor(project) }}>{event.time} {event.title}</div>;
                })}
                {due.map((task) => (
                  <button key={task.id} className="trunc" style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, marginBottom: 2 }} onClick={() => openTask(task.id)}>
                    {task.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
