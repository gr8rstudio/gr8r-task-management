"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/icons/icon";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/chrome";
import { Progress, ProjectStatusPill, StatusIcon } from "@/components/ui/status";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { TaskRow } from "@/features/tasks/components/task-row";
import { ago, diffDays, formatDate, parseIso, relativeDate, today } from "@/lib/dates";
import { canSee, progressOf, sortByDue, tasksOf, teamById } from "@/lib/workspace";
import { projectColor, STATUSES } from "@/lib/vocab";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";

const TABS = [
  ["board", "Board", "square-kanban"],
  ["list", "List", "list"],
  ["overview", "Overview", "layout-dashboard"],
  ["files", "Files", "paperclip"],
  ["activity", "Activity", "activity"],
] as const;

function ProjectScreen() {
  const params = useParams<{ projectId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const data = useWorkspaceData();
  const toggleFav = useWorkspaceStore((state) => state.toggleProjectFav);
  const openCreate = useUiStore((state) => state.openCreate);
  const project = data.projects.find((item) => item.id === params.projectId);
  const tab = search.get("tab") || "board";

  if (!project) {
    return <div className="page"><EmptyState icon="file-question" title="Project not found" text="That project is not in this workspace." /></div>;
  }
  if (!canSee(data, project)) {
    return <div className="page"><EmptyState icon="lock" title="You don't have access" text={`${project.name} is a private project.`} /></div>;
  }

  const tasks = tasksOf(data, project.id);
  const value = progressOf(data, project.id);
  const team = teamById(data, project.team);
  const daysLeft = project.due ? diffDays(parseIso(project.due)!, today()) : 0;
  const setTab = (next: string) => router.replace(`/projects/${project.id}?tab=${next}`);

  return (
    <div className="page flush">
      <div className="proj-h">
        <div className="t">
          <span className="picon lg" style={{ ["--c" as string]: projectColor(project) }}>
            <Icon name={project.icon} size={18} />
          </span>
          <h1>{project.name}</h1>
          <button className="ibtn ibtn-sm" aria-label="Favorite" onClick={() => toggleFav(project.id)} style={{ color: project.fav ? "var(--amber)" : undefined }}>
            <Icon name="star" size={15} />
          </button>
          <ProjectStatusPill status={project.status} />
          <span className="sp" />
          <AvatarStack ids={project.members} max={5} />
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Icon name="plus" size={13} />New task</button>
        </div>
        <nav className="tabs" aria-label="Project views">
          {TABS.map(([id, label, icon]) => (
            <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}>
              <Icon name={icon} size={14} />
              {label}
            </button>
          ))}
        </nav>
      </div>
      {tab === "board" ? <TaskBoard tasks={tasks} /> : null}
      {tab === "list" ? (
        <div style={{ padding: "8px 20px 40px" }}>
          <div className="panel" style={{ overflow: "hidden" }}>
            {tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} showProject={false} />) : <EmptyState icon="list-checks" title="No tasks here" text="Add a task to get things moving." />}
          </div>
        </div>
      ) : null}
      {tab === "overview" ? (
        <div className="page" style={{ maxWidth: 1160, paddingTop: 22 }}>
          <div className="grid2">
            <div className="stack">
              <section className="panel"><div className="panel-h"><h2>About</h2></div><div className="panel-b" style={{ fontSize: 14, lineHeight: 1.6 }}>{project.desc}</div></section>
              <section className="panel">
                <div className="panel-h"><h2>Progress</h2><div className="acts"><span className="faint">{tasks.filter((task) => task.status === "done").length} of {tasks.length} done</span></div></div>
                <div className="panel-b">
                  <div className="row" style={{ alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                    <span className="num" style={{ fontSize: 30, fontWeight: 600 }}>{value}%</span>
                    <span className="muted">{daysLeft >= 0 ? `${daysLeft} days until ${formatDate(project.due)}` : `Ended ${formatDate(project.due)}`}</span>
                  </div>
                  <Progress value={value} />
                  <div className="row" style={{ flexWrap: "wrap", gap: 14, marginTop: 12, fontSize: 13 }}>
                    {STATUSES.map((status) => (
                      <span key={status.id} className="row" style={{ gap: 5 }}>
                        <StatusIcon status={status.id} size={12} />
                        <span className="muted">{status.name}</span>
                        <b>{tasks.filter((task) => task.status === status.id).length}</b>
                      </span>
                    ))}
                  </div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-h"><h2>Coming up</h2></div>
                {sortByDue(tasks.filter((task) => task.status !== "done" && task.due)).slice(0, 6).map((task) => <TaskRow key={task.id} task={task} showProject={false} />)}
              </section>
            </div>
            <div className="stack">
              <section className="panel">
                <div className="panel-h"><h2>Details</h2></div>
                <div className="panel-b">
                  <dl className="kv">
                    <dt>Status</dt><dd><ProjectStatusPill status={project.status} /></dd>
                    <dt>Lead</dt><dd><span className="row"><Avatar id={project.lead} size="sm" />{data.members.find((member) => member.id === project.lead)?.name}</span></dd>
                    <dt>Team</dt><dd>{team ? <Link href={`/teams/${team.id}`}>{team.name}</Link> : "—"}</dd>
                    <dt>Start</dt><dd className="num">{formatDate(project.start)}</dd>
                    <dt>Due</dt><dd className="num">{formatDate(project.due)}</dd>
                  </dl>
                </div>
              </section>
              <section className="panel">
                <div className="panel-h"><h2>Milestones</h2></div>
                <div className="panel-b">
                  {project.milestones.map((milestone) => (
                    <div key={milestone.name} className="row" style={{ height: 32 }}>
                      <span className="grow">{milestone.name}</span>
                      <span className="num muted">{relativeDate(milestone.date)}</span>
                    </div>
                  ))}
                  {!project.milestones.length ? <span className="faint">No milestones yet</span> : null}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
      {tab === "files" ? (
        <div className="page" style={{ paddingTop: 18 }}>
          <div className="panel" style={{ overflow: "hidden" }}>
            {data.files.filter((file) => file.project === project.id).map((file) => (
              <div key={file.id} className="mini">
                <Icon name="paperclip" size={14} />
                <span className="tt">{file.name}</span>
                <span className="faint">{file.size}</span>
                <span className="faint">{ago(file.at)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "activity" ? (
        <div className="page" style={{ maxWidth: 780, paddingTop: 18 }}>
          <div className="feed">
            {data.activity.filter((item) => item.project === project.id).map((item) => {
              const who = data.members.find((member) => member.id === item.by);
              const task = data.tasks.find((row) => row.id === item.task);
              return (
                <div key={item.id} className="fitem">
                  <Avatar id={item.by} size="sm" />
                  <div className="grow"><b>{who?.name}</b> {item.verb} {task ? <b>{task.title}</b> : project.name} {item.extra}</div>
                  <time>{ago(item.at)}</time>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <ProjectScreen />
    </Suspense>
  );
}
