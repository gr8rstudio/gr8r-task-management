"use client";

import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/chrome";
import { Progress, ProjectStatusPill } from "@/components/ui/status";
import { TaskRow } from "@/features/tasks/components/task-row";
import { formatLongDate, greeting, relativeDate } from "@/lib/dates";
import { diffDays, parseIso, today } from "@/lib/dates";
import { allTasks, canSee, isOverdue, me, progressOf, sortByDue, visibleProjects } from "@/lib/workspace";
import { projectColor } from "@/lib/vocab";
import { usePrefs, useWorkspaceData } from "@/store/workspace-store";
import { useUiStore } from "@/store/ui-store";

export function PersonalDashboardPage() {
  const data = useWorkspaceData();
  const prefs = usePrefs();
  const openCreate = useUiStore((state) => state.openCreate);
  const mine = allTasks(data).filter((task) => task.assignee === data.me);
  const upcoming = sortByDue(mine.filter((task) => task.status !== "done" && !isOverdue(task))).slice(0, 7);
  const overdue = mine.filter(isOverdue);
  const open = allTasks(data).filter((task) => task.status !== "done");
  const deadlines = [
    { label: "Today", tasks: sortByDue(open.filter((task) => task.due && diffDays(parseIso(task.due)!, today()) === 0)) },
    { label: "Tomorrow", tasks: sortByDue(open.filter((task) => task.due && diffDays(parseIso(task.due)!, today()) === 1)) },
    { label: "This week", tasks: sortByDue(open.filter((task) => task.due && diffDays(parseIso(task.due)!, today()) > 1 && diffDays(parseIso(task.due)!, today()) <= 7)) },
  ];

  return (
    <div className="page">
      <PageHeader title={`${greeting()}, ${prefs.name.split(" ")[0]}`} text={formatLongDate()}>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icon name="plus" size={14} />
          New task
        </button>
      </PageHeader>
      <div className="grid2">
        <section className="panel">
          <div className="panel-h">
            <h2>My tasks</h2>
            <div className="acts">
              <Link href="/my-tasks" className="btn btn-sm btn-ghost">Open My Tasks</Link>
            </div>
          </div>
          {upcoming.length ? upcoming.map((task) => <TaskRow key={task.id} task={task} showAvatar={false} />) : <p className="panel-b faint">Nothing coming up.</p>}
          {overdue.length ? <p className="panel-b" style={{ color: "var(--red)" }}>{overdue.length} overdue</p> : null}
        </section>
        <section className="panel">
          <div className="panel-h">
            <h2>Upcoming deadlines</h2>
            <div className="acts">
              <Link href="/calendar" className="btn btn-sm btn-ghost">Calendar</Link>
            </div>
          </div>
          <div className="panel-b">
            {deadlines.map((group) => (
              <div key={group.label} style={{ marginBottom: 10 }}>
                <div className="row" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>
                  {group.label}
                  <span className="faint">{group.tasks.length}</span>
                </div>
                {group.tasks.slice(0, 4).map((task) => {
                  const project = data.projects.find((item) => item.id === task.project);
                  return (
                    <div key={task.id} className="row" style={{ height: 30, fontSize: 13 }}>
                      <span className="pdot" style={{ ["--c" as string]: projectColor(project) }} />
                      <span className="trunc grow">{task.title}</span>
                      <span className="faint">{relativeDate(task.due)}</span>
                    </div>
                  );
                })}
                {!group.tasks.length ? <div className="faint">Nothing due</div> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CompanyDashboardPage() {
  const data = useWorkspaceData();
  const person = me(data);
  const projects = visibleProjects(data).filter((project) => canSee(data, project) && project.status !== "complete");
  const tasks = allTasks(data);
  const open = tasks.filter((task) => task.status !== "done");
  const overdue = tasks.filter(isOverdue);
  const doneWeek = tasks.filter((task) => task.status === "done" && task.completedAt && Date.now() - task.completedAt < 7 * 864e5);

  return (
    <div className="page">
      <PageHeader title={data.ws.name} text={`${person.name.split(" ")[0]} · workspace health across every active project.`}>
        <Link href="/projects" className="btn btn-secondary">All projects</Link>
        <Link href="/tasks" className="btn btn-primary">Tasks</Link>
      </PageHeader>
      <div className="stats" style={{ marginBottom: 16 }}>
        <Link href="/projects" className="stat"><span className="k">Active projects</span><span className="v">{projects.length}</span><span className="d">{projects.filter((project) => project.status === "risk").length} at risk</span></Link>
        <Link href="/tasks" className="stat"><span className="k">Open tasks</span><span className="v">{open.length}</span><span className="d">{open.filter((task) => task.assignee === data.me).length} assigned to you</span></Link>
        <div className="stat"><span className="k">Completed</span><span className="v">{doneWeek.length}</span><span className="d up">this week</span></div>
        <div className="stat"><span className="k">Overdue</span><span className="v" style={{ color: overdue.length ? "var(--red)" : undefined }}>{overdue.length}</span><span className={`d ${overdue.length ? "bad" : ""}`}>{overdue.length ? "need attention" : "all on track"}</span></div>
      </div>
      <section className="panel">
        <div className="panel-h">
          <h2>Project progress</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="perm-t" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 14 }}>Project</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th style={{ textAlign: "left", width: "26%" }}>Progress</th>
                <th style={{ textAlign: "left" }}>Due</th>
                <th style={{ textAlign: "right", paddingRight: 14 }}>Team</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const value = progressOf(data, project.id);
                return (
                  <tr key={project.id}>
                    <td style={{ paddingLeft: 14 }}>
                      <Link href={`/projects/${project.id}`} className="row">
                        <b style={{ fontWeight: 500 }}>{project.name}</b>
                      </Link>
                    </td>
                    <td style={{ textAlign: "left" }}><ProjectStatusPill status={project.status} /></td>
                    <td>
                      <span className="row">
                        <Progress value={value} tone={project.status === "risk" ? "red" : ""} />
                        <span className="num faint" style={{ fontSize: 12, width: 32 }}>{value}%</span>
                      </span>
                    </td>
                    <td className="num muted" style={{ textAlign: "left" }}>{relativeDate(project.due)}</td>
                    <td style={{ textAlign: "right", paddingRight: 14 }}><AvatarStack ids={project.members} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
