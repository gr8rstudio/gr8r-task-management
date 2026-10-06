"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { allTasks, isOverdue, me, visibleProjects } from "@/lib/workspace";
import { projectColor, PROJECT_STATUS } from "@/lib/vocab";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/ui-store";
import { usePrefs, useWorkspaceData } from "@/store/workspace-store";
import type { Project } from "@/types/workspace";

const MAIN = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
  { href: "/my-tasks", label: "My Tasks", icon: "circle-check" },
  { href: "/favorites", label: "Favorites", icon: "star" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
];

const WORKSPACE = [
  { href: "/overview", label: "Overview", icon: "layout-dashboard" },
  { href: "/projects", label: "Projects", icon: "folder-kanban" },
  { href: "/tasks", label: "Tasks", icon: "list-checks" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/timeline", label: "Timeline", icon: "chart-gantt" },
  { href: "/members", label: "Members", icon: "users" },
  { href: "/activity", label: "Activity", icon: "activity" },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const data = useWorkspaceData();
  const prefs = usePrefs();
  const collapsed = useUiStore((state) => state.collapsed);
  const toggleSide = useUiStore((state) => state.toggleSide);
  const logout = useAuthStore((state) => state.logout);
  const openCreate = useUiStore((state) => state.openCreate);
  const setMobileNav = useUiStore((state) => state.setMobileNav);

  const unreadInbox = data.notifs.filter((note) => !note.read && note.type !== "update").length;
  const unreadAll = data.notifs.filter((note) => !note.read).length;
  const myDue = allTasks(data).filter((task) => task.assignee === data.me && task.status !== "done" && (isOverdue(task) || task.due)).length;
  const projects = visibleProjects(data).filter((project) => project.status !== "complete");
  const person = me(data);

  const closeMobile = () => setMobileNav(false);

  return (
    <nav className="side" aria-label="Main">
      <div className="side-top">
        <div className="row" style={{ gap: 2 }}>
          <Link href="/" className="ws grow" onClick={closeMobile}>
            <span className="ws-logo brand">
              <img src="/gr8r-logo.png" alt="" />
            </span>
            <span className="ws-name trunc">{data.ws.name}</span>
            <span className="chev-d faint">
              <Icon name="chevrons-up-down" size={13} />
            </span>
          </Link>
          {collapsed ? null : (
            <button className="ibtn ibtn-sm hide-m" onClick={toggleSide} aria-label="Collapse sidebar">
              <Icon name="panel-left" size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="side-scroll">
        {collapsed ? (
          <button className="sitem" onClick={toggleSide} aria-label="Expand sidebar">
            <Icon name="panel-left" size={16} />
          </button>
        ) : null}
        {MAIN.map((item) => {
          const count = item.href === "/inbox" ? unreadInbox : item.href === "/my-tasks" ? myDue : item.href === "/notifications" ? unreadAll : 0;
          return (
            <Link key={item.href} href={item.href} className={`sitem ${active(pathname, item.href) ? "on" : ""}`} onClick={closeMobile} aria-current={active(pathname, item.href) ? "page" : undefined}>
              <Icon name={item.icon} size={16} />
              <span className="trunc">{item.label}</span>
              {count ? <span className={`ct ${item.href === "/inbox" ? "dotc" : ""}`}>{count}</span> : null}
            </Link>
          );
        })}
        <div className="sgroup">
          <div className="sgroup-h">Workspace</div>
          {WORKSPACE.map((item) => (
            <Link key={item.href} href={item.href} className={`sitem ${active(pathname, item.href) ? "on" : ""}`} onClick={closeMobile} aria-current={active(pathname, item.href) ? "page" : undefined}>
              <Icon name={item.icon} size={16} />
              <span className="trunc">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="sgroup">
          <div className="sgroup-h">
            <span>Projects</span>
            <span className="sp" />
            <button className="ibtn ibtn-xs" aria-label="New task" onClick={openCreate}>
              <Icon name="plus" size={14} />
            </button>
          </div>
          {projects.map((project) => (
            <ProjectLink key={project.id} project={project} on={pathname === `/projects/${project.id}`} onNavigate={closeMobile} />
          ))}
          <Link href="/archive" className={`sitem ${active(pathname, "/archive") ? "on" : ""}`} onClick={closeMobile}>
            <Icon name="archive" size={16} />
            <span className="trunc">Archive</span>
          </Link>
        </div>
        <div className="sgroup">
          <div className="sgroup-h">Teams</div>
          {data.teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`} className={`sitem ${pathname === `/teams/${team.id}` ? "on" : ""}`} onClick={closeMobile}>
              <Icon name={team.icon} size={16} />
              <span className="trunc">{team.name}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="side-bot">
        <Link href="/settings" className={`sitem ${active(pathname, "/settings") ? "on" : ""}`} onClick={closeMobile}>
          <Icon name="settings" size={16} />
          <span>Settings</span>
        </Link>
        <div className="sitem" style={{ height: 36 }}>
          <Avatar id={person.id} presence />
          <span className="trunc" style={{ color: "var(--text)", fontWeight: 500 }}>{prefs.name}</span>
          <button className="ct" onClick={logout} aria-label="Sign out" title="Sign out">
            <Icon name="log-out" size={13} />
          </button>
        </div>
      </div>
    </nav>
  );
}

function ProjectLink({ project, on, onNavigate }: { project: Project; on: boolean; onNavigate: () => void }) {
  return (
    <Link href={`/projects/${project.id}`} className={`sitem ${on ? "on" : ""}`} onClick={onNavigate}>
      <span className="pico" style={{ ["--c" as string]: projectColor(project) }}>
        <Icon name={project.icon} size={12} />
      </span>
      <span className="trunc">{project.name}</span>
      {project.fav ? <span className="fav"><Icon name="star" size={11} /></span> : null}
      {project.private ? <Icon name="lock" size={11} /> : null}
      <span className="sdot" style={{ background: PROJECT_STATUS[project.status].color }} />
    </Link>
  );
}
