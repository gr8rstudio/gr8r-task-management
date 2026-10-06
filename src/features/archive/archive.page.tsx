"use client";

import { EmptyState, PageHeader } from "@/components/ui/chrome";
import { TaskRow } from "@/features/tasks/components/task-row";
import { useWorkspaceData } from "@/store/workspace-store";

export default function ArchivePage() {
  const data = useWorkspaceData();
  const tasks = data.tasks.filter((task) => task.archived);
  const projects = data.projects.filter((project) => project.archived);

  return (
    <div className="page">
      <PageHeader title="Archive" text="Projects and tasks you've put away. They stay out of the sidebar and active lists." />
      {!tasks.length && !projects.length ? (
        <div className="panel"><EmptyState icon="archive" title="Nothing archived" text="Completed work you archive will land here, away from the active lists." /></div>
      ) : (
        <div className="panel" style={{ overflow: "hidden" }}>
          {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
        </div>
      )}
    </div>
  );
}
