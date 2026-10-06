"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/chrome";
import { StatusIcon } from "@/components/ui/status";
import { allTasks, projectById, visibleProjects } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData } from "@/store/workspace-store";

export default function SearchPage() {
  const data = useWorkspaceData();
  const openTask = useUiStore((state) => state.openTask);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return { tasks: [], projects: [], people: [] };
    const has = (value?: string | null) => (value || "").toLowerCase().includes(q);
    return {
      tasks: allTasks(data).filter((task) => has(task.title) || has(task.key)).slice(0, 20),
      projects: visibleProjects(data).filter((project) => has(project.name) || has(project.desc)),
      people: data.members.filter((member) => has(member.name) || has(member.email) || has(member.title)),
    };
  }, [data, q]);
  const total = results.tasks.length + results.projects.length + results.people.length;

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="inwrap" style={{ marginBottom: 18 }}>
        <Icon name="search" size={16} />
        <input className="input input-lg" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, projects, and people" aria-label="Search" style={{ paddingLeft: 34, fontSize: 15 }} autoFocus />
      </div>
      {!q ? <p className="faint">Try “homepage”, “Sarah”, or “wireframes”.</p> : null}
      {q && !total ? <div className="panel"><EmptyState icon="search-x" title="No results found" text={`Nothing matches “${query}”.`} /></div> : null}
      {results.tasks.length ? (
        <section style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Tasks · {results.tasks.length}</div>
          <div className="panel" style={{ overflow: "hidden" }}>
            {results.tasks.map((task) => {
              const project = projectById(data, task.project);
              return (
                <button key={task.id} className="mini" onClick={() => openTask(task.id)}>
                  <StatusIcon status={task.status} />
                  <span className="mono faint" style={{ fontSize: 11 }}>{task.key}</span>
                  <span className="tt">{task.title}</span>
                  {project ? <span className="pj"><span className="pdot" style={{ ["--c" as string]: projectColor(project) }} />{project.name}</span> : null}
                  <Avatar id={task.assignee} size="sm" />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
      {results.projects.length ? (
        <section style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Projects · {results.projects.length}</div>
          <div className="panel" style={{ overflow: "hidden" }}>
            {results.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="mini">
                <Icon name={project.icon} size={14} />
                <span className="tt">{project.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {results.people.length ? (
        <section>
          <div className="eyebrow" style={{ marginBottom: 6 }}>People · {results.people.length}</div>
          <div className="panel" style={{ overflow: "hidden" }}>
            {results.people.map((member) => (
              <Link key={member.id} href={`/members/${member.id}`} className="mini">
                <Avatar id={member.id} size="md" />
                <span className="tt">{member.name} <span className="faint">{member.title}</span></span>
                <span className="faint">{member.email}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
