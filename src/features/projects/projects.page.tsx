"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { AvatarStack } from "@/components/ui/avatar";
import { EmptyState, PageHeader } from "@/components/ui/chrome";
import { Progress, ProjectStatusPill } from "@/components/ui/status";
import { formatDate } from "@/lib/dates";
import { canSee, progressOf, tasksOf, visibleProjects } from "@/lib/workspace";
import { projectColor, PROJECT_STATUS } from "@/lib/vocab";
import { useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";
import type { Project, ProjectStatus } from "@/types/workspace";

export function listProjects(data: ReturnType<typeof useWorkspaceData>) {
  return visibleProjects(data);
}

function ProjectCard({ project }: { project: Project }) {
  const data = useWorkspaceData();
  const toggle = useWorkspaceStore((state) => state.toggleProjectFav);
  const locked = !canSee(data, project);
  const value = progressOf(data, project.id);
  const tasks = tasksOf(data, project.id);
  const open = tasks.filter((task) => task.status !== "done").length;

  return (
    <div className="pcard">
      <div className="row">
        <span className="picon" style={{ ["--c" as string]: projectColor(project) }}>
          <Icon name={project.icon} size={15} />
        </span>
        <div className="grow">
          <Link href={locked ? "/projects" : `/projects/${project.id}`} className="trunc" style={{ fontWeight: 600, fontSize: 14 }}>
            {project.name}
          </Link>
        </div>
        <ProjectStatusPill status={project.status} />
      </div>
      <div className="desc">{project.desc}</div>
      {locked ? (
        <div className="row faint" style={{ fontSize: 12 }}><Icon name="lock" size={12} /> Restricted</div>
      ) : (
        <div className="row" style={{ gap: 10 }}>
          <Progress value={value} tone={project.status === "risk" ? "red" : project.status === "complete" ? "green" : ""} />
          <span className="num" style={{ fontSize: 12, fontWeight: 500 }}>{value}%</span>
        </div>
      )}
      <div className="foot">
        <span className="row" style={{ gap: 4 }}><Icon name="circle-check" size={12} />{locked ? "—" : `${tasks.length - open}/${tasks.length}`}</span>
        <span className="row" style={{ gap: 4 }}><Icon name="calendar" size={12} />{formatDate(project.due)}</span>
        <span className="sp" />
        <AvatarStack ids={project.members} />
        <button className="ibtn ibtn-sm" aria-label={project.fav ? "Unstar" : "Star"} onClick={() => toggle(project.id)} style={{ color: project.fav ? "var(--amber)" : undefined }}>
          <Icon name="star" size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const data = useWorkspaceData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const projects = useMemo(() => {
    return listProjects(data).filter((project) => {
      const matchesStatus = status === "all" || project.status === status;
      const haystack = `${project.name} ${project.desc}`.toLowerCase();
      return matchesStatus && haystack.includes(query.trim().toLowerCase());
    });
  }, [data, query, status]);
  const all = listProjects(data);

  return (
    <div className="page wide" style={{ maxWidth: 1280 }}>
      <PageHeader title="Projects" text={`${all.filter((project) => project.status !== "complete").length} active · ${all.filter((project) => project.status === "complete").length} completed`} />
      <div className="row" style={{ marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div className="inwrap">
          <Icon name="search" size={13} />
          <input className="input search-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" aria-label="Search projects" />
        </div>
        <select className="select" style={{ height: 26, width: "auto", fontSize: 12 }} value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {Object.entries(PROJECT_STATUS).map(([id, meta]) => (
            <option key={id} value={id}>{meta.name}</option>
          ))}
        </select>
      </div>
      {projects.length ? <div className="pgrid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : (
        <div className="panel"><EmptyState icon="search-x" title="No results found" text="No projects match your search or filters." /></div>
      )}
    </div>
  );
}
