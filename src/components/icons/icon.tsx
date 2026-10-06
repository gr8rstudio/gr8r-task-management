"use client";

import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ALIAS: Record<string, string> = {
  "chart-gantt": "ChartGantt",
  "clock-alert": "AlarmClock",
  "circle-dashed": "CircleDashed",
  "square-kanban": "SquareKanban",
  "building-2": "Building2",
  "layout-grid": "LayoutGrid",
  "layout-dashboard": "LayoutDashboard",
  "folder-kanban": "FolderKanban",
  "list-checks": "ListChecks",
  "panel-left": "PanelLeft",
  "chevrons-up-down": "ChevronsUpDown",
  "chevron-right": "ChevronRight",
  "chevron-down": "ChevronDown",
  "user-plus": "UserPlus",
  "folder-plus": "FolderPlus",
  "arrow-up-right": "ArrowUpRight",
  "arrow-right": "ArrowRight",
  "circle-check": "CircleCheck",
  "circle-dot": "CircleDot",
  "circle-alert": "CircleAlert",
  "circle-help": "CircleHelp",
  "mail-open": "MailOpen",
  "check-check": "CheckCheck",
  "message-square": "MessageSquare",
  "refresh-cw": "RefreshCw",
  "triangle-alert": "TriangleAlert",
  "at-sign": "AtSign",
  "map-pin": "MapPin",
  "search-x": "SearchX",
  "file-question": "FileQuestion",
  "bell-off": "BellOff",
  "log-out": "LogOut",
  "calendar-days": "CalendarDays",
  "table-2": "Table2",
  "share-2": "Share2",
};

const table = Lucide as unknown as Record<string, LucideIcon | undefined>;

function lookup(name: string) {
  const pascal = (ALIAS[name] || name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return table[pascal] || table[ALIAS[name] || ""] || Lucide.Circle;
}

export function Icon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  const Cmp = lookup(name);
  return <Cmp className={`i ${className}`.trim()} size={size} strokeWidth={1.8} aria-hidden />;
}
