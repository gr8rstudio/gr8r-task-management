"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { useWorkspaceData } from "@/store/workspace-store";
import { useUiStore } from "@/store/ui-store";

const ITEMS = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/my-tasks", label: "My Tasks", icon: "circle-check" },
  { href: "/projects", label: "Projects", icon: "folder-kanban" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const data = useWorkspaceData();
  const setMobileNav = useUiStore((state) => state.setMobileNav);
  const unread = data.notifs.some((note) => !note.read && note.type !== "update");

  return (
    <nav className="bottomnav" aria-label="Primary">
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={pathname === item.href ? "on" : ""}>
          <Icon name={item.icon} size={19} />
          <span>{item.label}</span>
          {item.href === "/inbox" && unread ? <span className="bdot" /> : null}
        </Link>
      ))}
      <button onClick={() => setMobileNav(true)}>
        <Icon name="ellipsis" size={19} />
        <span>More</span>
      </button>
    </nav>
  );
}
