"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { projectById } from "@/lib/workspace";
import { useEffectiveViewMode } from "@/hooks/useEffectiveViewMode";
import { useUiStore } from "@/store/ui-store";
import { useViewModeStore } from "@/store/view-mode-store";
import { useWorkspaceData } from "@/store/workspace-store";

const NAMES: Record<string, string> = {
  "/": "Home",
  "/inbox": "Inbox",
  "/my-tasks": "My Tasks",
  "/favorites": "Favorites",
  "/notifications": "Notifications",
  "/search": "Search",
  "/overview": "Overview",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/timeline": "Timeline",
  "/members": "Members",
  "/teams": "Teams",
  "/activity": "Activity",
  "/settings": "Settings",
  "/archive": "Archive",
  "/profile": "Profile",
};

export default function Topbar() {
  const pathname = usePathname();
  const data = useWorkspaceData();
  const mode = useEffectiveViewMode();
  const setMode = useViewModeStore((state) => state.setMode);
  const openCreate = useUiStore((state) => state.openCreate);
  const setMobileNav = useUiStore((state) => state.setMobileNav);
  const unread = data.notifs.some((note) => !note.read);
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const project = projectMatch ? projectById(data, projectMatch[1]) : undefined;
  const memberMatch = pathname.match(/^\/members\/([^/]+)/);
  const member = memberMatch ? data.members.find((item) => item.id === memberMatch[1]) : undefined;

  return (
    <header className="topbar">
      <button className="ibtn" id="mnav-btn" aria-label="Open navigation" onClick={() => setMobileNav(true)} style={{ display: "none" }}>
        <Icon name="menu" size={17} />
      </button>
      <nav className="crumbs trunc" aria-label="Breadcrumb">
        <Link href="/">{data.ws.name}</Link>
        <span className="sep">/</span>
        {project ? (
          <>
            <Link href="/projects">Projects</Link>
            <span className="sep">/</span>
            <span className="cur">{project.name}</span>
          </>
        ) : member ? (
          <>
            <Link href="/members">Members</Link>
            <span className="sep">/</span>
            <span className="cur">{member.name}</span>
          </>
        ) : (
          <span className="cur">{NAMES[pathname] || "Gr8r Studio"}</span>
        )}
      </nav>
      <span className="sp" />
      <div className="seg hide-m" role="tablist" aria-label="View">
        <button className={mode === "company" ? "on" : ""} onClick={() => setMode("company")}>Company</button>
        <button className={mode === "personal" ? "on" : ""} onClick={() => setMode("personal")}>Personal</button>
      </div>
      <Link href="/search" className="topsearch" aria-label="Search">
        <Icon name="search" size={14} />
        <span className="lbltxt">Search or jump to…</span>
      </Link>
      <Link href="/notifications" className="ibtn" aria-label="Notifications" style={{ position: "relative" }}>
        <Icon name="bell" size={16} />
        {unread ? <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} /> : null}
      </Link>
      <button className="btn btn-secondary btn-sm" onClick={openCreate}>
        <Icon name="plus" size={14} />
        <span className="hide-m">New</span>
      </button>
      <Link href="/profile" className="ibtn hide-m" aria-label="Profile" style={{ width: "auto", padding: "0 2px" }}>
        <Avatar id={data.me} size="md" />
      </Link>
      <style>{`@media(max-width:900px){#mnav-btn{display:inline-flex!important}}`}</style>
    </header>
  );
}
