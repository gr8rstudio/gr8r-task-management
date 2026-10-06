"use client";

import { Avatar } from "@/components/ui/avatar";
import { PriorityIcon } from "@/components/ui/status";
import { labelById, STATUSES } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { StatusId, Task } from "@/types/workspace";
import { DueLabel } from "./task-row";

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const openTask = useUiStore((state) => state.openTask);
  const setTaskStatus = useWorkspaceStore((state) => state.setTaskStatus);

  return (
    <div className="board">
      {STATUSES.map((column) => {
        const cards = tasks.filter((task) => task.status === column.id);
        return (
          <section
            key={column.id}
            className="bcol"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              if (id) setTaskStatus(id, column.id);
            }}
          >
            <div className="bcol-h">
              <span>{column.name}</span>
              <span className="cnt">{cards.length}</span>
            </div>
            <div className="bcol-b">
              {cards.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={`kcard ${task.status === "done" ? "done" : ""}`}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
                  onClick={() => openTask(task.id)}
                >
                  {task.labels.length ? (
                    <div className="labels">
                      {task.labels.map((id) => {
                        const label = labelById(id);
                        if (!label) return null;
                        return (
                          <span key={id} className="lbl" style={{ ["--c" as string]: label.color }}>
                            <i />
                            {label.name}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="top">
                    <div className="title">{task.title}</div>
                  </div>
                  <div className="meta">
                    <span className="key">{task.key}</span>
                    <PriorityIcon priority={task.priority} size={13} />
                    <DueLabel task={task} />
                    <Avatar id={task.assignee} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function statusColumns(): StatusId[] {
  return STATUSES.map((status) => status.id);
}
