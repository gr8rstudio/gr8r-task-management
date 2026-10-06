"use client";

import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { EmptyState, PageHeader } from "@/components/ui/chrome";
import { ProjectStatusPill } from "@/components/ui/status";
import { TaskRow } from "@/features/tasks/components/task-row";
import { allTasks, canSee, progressOf, visibleProjects } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { useWorkspaceData } from "@/store/workspace-store";

export default function FavoritesPage() {
  const data = useWorkspaceData();
  const projects = visibleProjects(data).filter((project) => project.fav && canSee(data, project));
  const tasks = allTasks(data).filter((task) => task.fav);

  return (
    <div className="page">
      <PageHeader title="Favorites" text="Projects and tasks you've starred for quick access." />
      {!projects.length && !tasks.length ? (
        <div className="panel"><EmptyState icon="star" title="No favorites yet" text="Star a project or task to pin it here." action={<Link href="/projects" className="btn btn-secondary btn-sm">Browse projects</Link>} /></div>
      ) : (
        <>
          <h2 className="sec" style={{ marginBottom: 10 }}>Projects <span className="faint">{projects.length}</span></h2>
          <div className="pgrid" style={{ marginBottom: 28 }}>
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="pcard">
                <div className="row">
                  <span className="picon" style={{ ["--c" as string]: projectColor(project) }}><Icon name={project.icon} size={15} /></span>
                  <b>{project.name}</b>
                  <span className="sp" />
                  <ProjectStatusPill status={project.status} />
                </div>
                <div className="desc">{project.desc}</div>
                <div className="foot"><span>{progressOf(data, project.id)}% complete</span></div>
              </Link>
            ))}
          </div>
          <h2 className="sec" style={{ marginBottom: 6 }}>Tasks <span className="faint">{tasks.length}</span></h2>
          <div className="panel" style={{ overflow: "hidden" }}>
            {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
          </div>
        </>
      )}
    </div>
  );
}
