"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { PRIORITIES } from "@/lib/vocab";
import { visibleProjects } from "@/lib/workspace";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";
import type { PriorityId } from "@/types/workspace";

export function NewTaskModal() {
  const open = useUiStore((state) => state.creating);
  const closeCreate = useUiStore((state) => state.closeCreate);
  const openTask = useUiStore((state) => state.openTask);
  const data = useWorkspaceData();
  const addTask = useWorkspaceStore((state) => state.addTask);
  const projects = visibleProjects(data).filter((project) => project.status !== "complete");
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [assignee, setAssignee] = useState(data.me);
  const [priority, setPriority] = useState<PriorityId>("medium");
  const [due, setDue] = useState("");

  if (!open) return null;

  return (
    <div className="modal-wrap" role="presentation" onMouseDown={closeCreate}>
      <div className="modal enter" role="dialog" aria-labelledby="new-task-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-h">
          <h2 id="new-task-title">New task</h2>
          <button className="ibtn ibtn-sm" aria-label="Close" onClick={closeCreate}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <form
          className="modal-b"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim() || !projectId) return;
            const id = addTask({ title, projectId, assignee, priority, due: due || null });
            setTitle("");
            closeCreate();
            openTask(id);
          }}
        >
          <div className="field">
            <label className="label" htmlFor="task-title">Task name</label>
            <input id="task-title" className="input input-lg" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus placeholder="What needs to be done?" />
          </div>
          <div className="field">
            <label className="label" htmlFor="task-project">Project</label>
            <select id="task-project" className="select" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field grow">
              <label className="label" htmlFor="task-who">Assignee</label>
              <select id="task-who" className="select" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div className="field grow">
              <label className="label" htmlFor="task-prio">Priority</label>
              <select id="task-prio" className="select" value={priority} onChange={(event) => setPriority(event.target.value as PriorityId)}>
                {PRIORITIES.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="task-due">Due date</label>
            <input id="task-due" className="input" type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </div>
          <div className="modal-f" style={{ margin: "0 -16px -14px", padding: "12px 16px" }}>
            <span className="sp" />
            <button type="button" className="btn btn-secondary" onClick={closeCreate}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create task</button>
          </div>
        </form>
      </div>
    </div>
  );
}
