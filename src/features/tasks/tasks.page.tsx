"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { PageHeader } from "@/components/ui/chrome";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { TaskRow } from "@/features/tasks/components/task-row";
import { useTasks } from "@/features/tasks/useTasks";
import { allTasks, isOverdue, sortByDue } from "@/lib/workspace";
import { diffDays, parseIso, today } from "@/lib/dates";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData } from "@/store/workspace-store";

export default function TasksPage() {
  const data = useWorkspaceData();
  const openCreate = useUiStore((state) => state.openCreate);
  const [mode, setMode] = useState<"list" | "board">("list");
  const tasks = useTasks();

  return (
    <div className={mode === "board" ? "page flush" : "page"}>
      <div style={mode === "board" ? { padding: "24px 20px 0" } : undefined}>
        <PageHeader title="Tasks" text={`Every task across ${data.projects.filter((project) => !project.private || project.members.includes(data.me)).length} projects.`}>
          <div className="seg">
            <button className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}>List</button>
            <button className={mode === "board" ? "on" : ""} onClick={() => setMode("board")}>Board</button>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={14} />New task</button>
        </PageHeader>
      </div>
      {mode === "board" ? <TaskBoard tasks={tasks} /> : (
        <section className="panel" style={{ overflow: "hidden" }}>
          {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
        </section>
      )}
    </div>
  );
}

export function MyTasksPage() {
  const data = useWorkspaceData();
  const openCreate = useUiStore((state) => state.openCreate);
  const mine = allTasks(data).filter((task) => task.assignee === data.me);
  const groups = [
    { key: "overdue", name: "Overdue", tasks: mine.filter(isOverdue) },
    { key: "today", name: "Today", tasks: mine.filter((task) => task.status !== "done" && task.due && diffDays(parseIso(task.due)!, today()) === 0) },
    { key: "upcoming", name: "Upcoming", tasks: sortByDue(mine.filter((task) => task.status !== "done" && (!task.due || diffDays(parseIso(task.due)!, today()) > 0))) },
    { key: "completed", name: "Completed", tasks: mine.filter((task) => task.status === "done") },
  ];

  return (
    <div className="page">
      <PageHeader title="My Tasks" text={`${groups[1].tasks.length} due today · ${groups[0].tasks.length} overdue · ${groups[2].tasks.length} upcoming`}>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={14} />New task</button>
      </PageHeader>
      {groups.map((group) => (
        <section key={group.key} style={{ marginBottom: 18 }}>
          <h2 className="sec" style={{ marginBottom: 8 }}>{group.name} <span className="faint">{group.tasks.length}</span></h2>
          <div className="panel" style={{ overflow: "hidden" }}>
            {group.tasks.length ? group.tasks.map((task) => <TaskRow key={task.id} task={task} />) : <p className="panel-b faint">Nothing in this group.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
