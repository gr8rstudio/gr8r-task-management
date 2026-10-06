"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { EmptyState, PageHeader } from "@/components/ui/chrome";
import { Progress, ProjectStatusPill } from "@/components/ui/status";
import { TaskRow } from "@/features/tasks/components/task-row";
import { ago, minutesAgo } from "@/lib/dates";
import { allTasks, isOverdue, progressOf, sortByDue, teamById, visibleProjects } from "@/lib/workspace";
import { ROLES } from "@/lib/vocab";
import { useWorkspaceData } from "@/store/workspace-store";
import type { Role } from "@/types/workspace";

export default function MembersPage() {
  const data = useWorkspaceData();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [tab, setTab] = useState<"members" | "teams">("members");
  const members = data.members.filter((member) => (role === "all" || member.role === role) && `${member.name} ${member.email}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="page wide" style={{ maxWidth: 1200 }}>
      <PageHeader title="Members" text={`${data.members.length} people in ${data.ws.name} · ${data.members.filter((member) => member.status === "invited").length} pending`} />
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button className={`tab ${tab === "members" ? "on" : ""}`} onClick={() => setTab("members")}>Members</button>
        <button className={`tab ${tab === "teams" ? "on" : ""}`} onClick={() => setTab("teams")}>Teams</button>
      </div>
      {tab === "teams" ? (
        <div className="pgrid">
          {data.teams.map((team) => {
            const people = data.members.filter((member) => member.team === team.id);
            const projects = visibleProjects(data).filter((project) => project.team === team.id);
            return (
              <Link key={team.id} href={`/teams/${team.id}`} className="pcard">
                <div className="row"><span className="picon" style={{ ["--c" as string]: team.color }}><Icon name={team.icon} size={15} /></span><b>{team.name}</b></div>
                <div className="desc">{team.desc}</div>
                <div className="foot"><span>{people.length} members</span><span>{projects.length} projects</span><span className="sp" /><AvatarStack ids={people.map((member) => member.id)} /></div>
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
            <div className="inwrap">
              <Icon name="search" size={13} />
              <input className="input search-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" aria-label="Search members" />
            </div>
            <div className="seg">
              <button className={role === "all" ? "on" : ""} onClick={() => setRole("all")}>All</button>
              {ROLES.map((item) => <button key={item} className={role === item ? "on" : ""} onClick={() => setRole(item)}>{item}</button>)}
            </div>
          </div>
          <div className="panel" style={{ overflowX: "auto" }}>
            {members.length ? (
              <table className="perm-t" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 14 }}>Member</th>
                    <th style={{ textAlign: "left" }}>Role</th>
                    <th style={{ textAlign: "left" }}>Team</th>
                    <th>Open tasks</th>
                    <th style={{ textAlign: "left" }}>Last active</th>
                    <th style={{ textAlign: "left" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const team = teamById(data, member.team);
                    const open = allTasks(data).filter((task) => task.assignee === member.id && task.status !== "done").length;
                    return (
                      <tr key={member.id}>
                        <td style={{ paddingLeft: 14 }}>
                          <Link href={`/members/${member.id}`} className="row" style={{ gap: 10 }}>
                            <Avatar id={member.id} size="md" />
                            <span className="col"><b style={{ fontWeight: 500 }}>{member.name}{member.id === data.me ? " (you)" : ""}</b><span className="faint">{member.email}</span></span>
                          </Link>
                        </td>
                        <td style={{ textAlign: "left" }}>{member.role}</td>
                        <td style={{ textAlign: "left" }}>{team?.name}</td>
                        <td className="num">{open}</td>
                        <td style={{ textAlign: "left" }} className="muted">{member.last == null ? "—" : member.last < 5 ? "Online" : ago(minutesAgo(member.last))}</td>
                        <td style={{ textAlign: "left" }}>{member.status === "invited" ? <span className="badge amber">Invited</span> : <span className="badge green">Active</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <EmptyState icon="search-x" title="No results found" text="No members match that search." />}
          </div>
        </>
      )}
    </div>
  );
}

export function MemberPage() {
  const params = useParams<{ memberId: string }>();
  const data = useWorkspaceData();
  const member = data.members.find((item) => item.id === params.memberId);
  if (!member) return <div className="page"><EmptyState icon="user" title="Member not found" text="That person is not in this workspace." /></div>;
  const team = teamById(data, member.team);
  const tasks = allTasks(data).filter((task) => task.assignee === member.id);
  const open = tasks.filter((task) => task.status !== "done");
  const projects = visibleProjects(data).filter((project) => project.members.includes(member.id) && project.status !== "complete");

  return (
    <div className="page">
      <div className="row" style={{ gap: 18, marginBottom: 22, alignItems: "flex-start" }}>
        <Avatar id={member.id} size="xl" presence={member.last != null && member.last < 5} />
        <div className="grow">
          <h1 style={{ fontSize: "var(--fs-2xl)", margin: 0 }}>{member.name}</h1>
          <div className="muted" style={{ marginTop: 4 }}>{member.title} · {team?.name}</div>
          <div className="row faint" style={{ marginTop: 8, gap: 14 }}>
            <span>{member.email}</span>
            <span>{member.tz}</span>
            <span>{member.last == null ? "Never signed in" : member.last < 5 ? "Online now" : `Active ${ago(minutesAgo(member.last))}`}</span>
          </div>
        </div>
        <span className="badge">{member.role}</span>
      </div>
      <div className="stats" style={{ marginBottom: 18 }}>
        <div className="stat"><span className="k">Active projects</span><span className="v">{projects.length}</span></div>
        <div className="stat"><span className="k">Assigned</span><span className="v">{open.length}</span></div>
        <div className="stat"><span className="k">Completed</span><span className="v">{tasks.length - open.length}</span></div>
        <div className="stat"><span className="k">Overdue</span><span className="v">{open.filter(isOverdue).length}</span></div>
      </div>
      <div className="grid2">
        <section className="panel">
          <div className="panel-h"><h2>Assigned tasks</h2></div>
          {sortByDue(open).map((task) => <TaskRow key={task.id} task={task} showAvatar={false} />)}
        </section>
        <section className="panel">
          <div className="panel-h"><h2>Active projects</h2></div>
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="mini">
              <span className="tt">{project.name}</span>
              <ProjectStatusPill status={project.status} />
              <span style={{ width: 90 }}><Progress value={progressOf(data, project.id)} /></span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

export function TeamPage() {
  const params = useParams<{ teamId: string }>();
  const data = useWorkspaceData();
  const team = teamById(data, params.teamId);
  if (!team) return <div className="page"><EmptyState icon="users" title="Team not found" text="That team is not in this workspace." /></div>;
  const members = data.members.filter((member) => member.team === team.id);
  const projects = visibleProjects(data).filter((project) => project.team === team.id);
  const tasks = sortByDue(allTasks(data).filter((task) => members.some((member) => member.id === task.assignee) && task.status !== "done")).slice(0, 8);

  return (
    <div className="page">
      <PageHeader title={team.name} text={team.desc} />
      <div className="grid2">
        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2>Projects</h2><span className="faint">{projects.length}</span></div>
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="mini">
                <span className="tt">{project.name}</span>
                <ProjectStatusPill status={project.status} />
              </Link>
            ))}
          </section>
          <section className="panel">
            <div className="panel-h"><h2>Open tasks</h2></div>
            {tasks.map((task) => <TaskRow key={task.id} task={task} />)}
          </section>
        </div>
        <section className="panel">
          <div className="panel-h"><h2>Members</h2></div>
          {members.map((member) => (
            <Link key={member.id} href={`/members/${member.id}`} className="mini" style={{ minHeight: 48 }}>
              <Avatar id={member.id} size="md" />
              <div className="grow"><div style={{ fontWeight: 500 }}>{member.name}</div><div className="faint">{member.title}</div></div>
              <span className="badge">{member.role}</span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

export function TeamsPage() {
  const data = useWorkspaceData();
  return (
    <div className="page">
      <PageHeader title="Teams" text="Groups of people who work on projects together." />
      <div className="pgrid">
        {data.teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`} className="pcard">
            <div className="row"><span className="picon" style={{ ["--c" as string]: team.color }}><Icon name={team.icon} size={15} /></span><b>{team.name}</b></div>
            <div className="desc">{team.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
