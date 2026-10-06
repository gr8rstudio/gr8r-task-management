"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/chrome";
import { Avatar } from "@/components/ui/avatar";
import { Progress, ProjectStatusPill, StatusIcon } from "@/components/ui/status";
import { formatDate, relativeDate } from "@/lib/dates";
import { allTasks, canSee, isOverdue, progressOf, tasksOf, visibleProjects } from "@/lib/workspace";
import { projectColor, STATUSES } from "@/lib/vocab";
import { useWorkspaceData } from "@/store/workspace-store";

export default function OverviewPage() {
  const data = useWorkspaceData();
  const projects = visibleProjects(data).filter((project) => canSee(data, project));
  const tasks = allTasks(data);
  const done = tasks.filter((task) => task.status === "done").length;
  const counts = STATUSES.map((status) => ({ status, count: tasks.filter((task) => task.status === status.id).length }));

  return (
    <div className="page">
      <PageHeader title="Workspace overview" text={`Health of every project in ${data.ws.name}.`}>
        <Link href="/timeline" className="btn btn-secondary">Timeline</Link>
        <Link href="/projects" className="btn btn-primary">Projects</Link>
      </PageHeader>
      <div className="stats" style={{ marginBottom: 16 }}>
        <div className="stat"><span className="k">Projects</span><span className="v">{projects.length}</span></div>
        <div className="stat"><span className="k">Tasks</span><span className="v">{tasks.length}</span><span className="d">{tasks.length - done} open</span></div>
        <div className="stat"><span className="k">Completion</span><span className="v">{Math.round((done / Math.max(tasks.length, 1)) * 100)}%</span></div>
        <div className="stat"><span className="k">Members</span><span className="v">{data.members.length}</span></div>
      </div>
      <div className="grid2">
        <section className="panel">
          <div className="panel-h"><h2>Portfolio</h2></div>
          <div style={{ overflowX: "auto" }}>
            <table className="perm-t" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 14 }}>Project</th>
                  <th style={{ textAlign: "left" }}>Lead</th>
                  <th style={{ textAlign: "left" }}>Status</th>
                  <th style={{ textAlign: "left" }}>Progress</th>
                  <th>Open</th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const rows = tasksOf(data, project.id);
                  const value = progressOf(data, project.id);
                  const late = rows.filter(isOverdue).length;
                  const lead = data.members.find((member) => member.id === project.lead);
                  return (
                    <tr key={project.id}>
                      <td style={{ paddingLeft: 14 }}><Link href={`/projects/${project.id}`}>{project.name}</Link></td>
                      <td style={{ textAlign: "left" }}><span className="row"><Avatar id={project.lead} size="sm" />{lead?.name.split(" ")[0]}</span></td>
                      <td style={{ textAlign: "left" }}><ProjectStatusPill status={project.status} /></td>
                      <td><span className="row"><Progress value={value} /><span className="num faint">{value}%</span></span></td>
                      <td className="num">{rows.filter((task) => task.status !== "done").length}</td>
                      <td className="num" style={{ color: late ? "var(--red)" : "var(--text-3)" }}>{late}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel-h"><h2>Tasks by status</h2></div>
          <div className="panel-b">
            <div className="stackbar" style={{ height: 10, marginBottom: 12 }}>
              {counts.map((item) => (
                <i key={item.status.id} style={{ width: `${(item.count / Math.max(tasks.length, 1)) * 100}%`, background: `var(--st-${item.status.id})` }} />
              ))}
            </div>
            {counts.map((item) => (
              <div key={item.status.id} className="row" style={{ height: 28, fontSize: 13 }}>
                <StatusIcon status={item.status.id} />
                <span className="grow">{item.status.name}</span>
                <span className="num muted">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="panel-h"><h2>Upcoming milestones</h2></div>
          <div className="panel-b">
            {projects.flatMap((project) => project.milestones.map((milestone) => ({ ...milestone, project }))).filter((milestone) => milestone.date >= new Date().toISOString().slice(0, 10)).slice(0, 6).map((milestone) => (
              <div key={`${milestone.project.id}-${milestone.name}`} className="row" style={{ height: 32, fontSize: 13 }}>
                <span style={{ width: 9, height: 9, transform: "rotate(45deg)", background: projectColor(milestone.project), borderRadius: 2 }} />
                <span className="grow trunc">{milestone.name} <span className="faint">· {milestone.project.name}</span></span>
                <span className="num muted">{relativeDate(milestone.date) || formatDate(milestone.date)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
