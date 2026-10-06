"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/chrome";
import { ProjectStatusPill } from "@/components/ui/status";
import { diffDays, formatDate, parseIso, today } from "@/lib/dates";
import { canSee, visibleProjects } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { useWorkspaceData } from "@/store/workspace-store";

export default function TimelinePage() {
  const data = useWorkspaceData();
  const projects = visibleProjects(data).filter((project) => canSee(data, project) && project.status !== "complete");
  const windowStart = today();
  const span = 90;

  return (
    <div className="page">
      <PageHeader title="Timeline" text="Where each active project sits between now and the next quarter." />
      <section className="panel">
        <div className="panel-b" style={{ paddingTop: 14 }}>
          {projects.map((project) => {
            const start = parseIso(project.start) || windowStart;
            const due = parseIso(project.due) || windowStart;
            const left = Math.max(0, Math.min(100, (diffDays(start, windowStart) / span) * 100));
            const width = Math.max(4, Math.min(100 - left, (diffDays(due, start) / span) * 100));
            return (
              <div key={project.id} className="row" style={{ minHeight: 48, gap: 12, borderBottom: "1px solid var(--divider)" }}>
                <Link href={`/projects/${project.id}`} className="trunc" style={{ width: 180, fontWeight: 500 }}>{project.name}</Link>
                <ProjectStatusPill status={project.status} />
                <div className="grow" style={{ position: "relative", height: 18, background: "var(--surface-3)", borderRadius: 6 }}>
                  <span style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 3, bottom: 3, borderRadius: 4, background: projectColor(project) }} />
                </div>
                <span className="num muted" style={{ width: 72 }}>{formatDate(project.due)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
