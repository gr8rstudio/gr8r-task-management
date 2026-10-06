"use client";

import type { PriorityId, ProjectStatus, StatusId } from "@/types/workspace";
import { PROJECT_STATUS, priorityWeight, statusName } from "@/lib/vocab";

export function StatusIcon({ status, size = 14 }: { status: StatusId; size?: number }) {
  const color = `var(--st-${status})`;
  let inner = <circle cx="7" cy="7" r="5.4" fill="none" stroke={color} strokeWidth="1.5" />;
  if (status === "backlog") {
    inner = <circle cx="7" cy="7" r="5.4" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="1.9 2.1" />;
  } else if (status === "progress") {
    inner = (
      <>
        <circle cx="7" cy="7" r="5.4" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M7 3.4A3.6 3.6 0 0 1 7 10.6Z" fill={color} />
      </>
    );
  } else if (status === "review") {
    inner = (
      <>
        <circle cx="7" cy="7" r="5.4" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M7 3.4A3.6 3.6 0 1 1 3.4 7L7 7Z" fill={color} />
      </>
    );
  } else if (status === "done") {
    inner = (
      <>
        <circle cx="7" cy="7" r="6.2" fill={color} />
        <path d="M4.4 7.2 6.2 9 9.7 5.3" fill="none" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" />
      </>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden style={{ flexShrink: 0 }}>
      {inner}
    </svg>
  );
}

export function StatusPill({ status }: { status: StatusId }) {
  return (
    <span className="row" style={{ gap: 6 }}>
      <StatusIcon status={status} />
      <span>{statusName(status)}</span>
    </span>
  );
}

export function PriorityIcon({ priority, size = 14 }: { priority: PriorityId; size?: number }) {
  if (priority === "urgent") {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="12" height="12" rx="3" fill="var(--red)" />
        <path d="M7 3.8v4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="7" cy="10.1" r=".95" fill="#fff" />
      </svg>
    );
  }
  const weight = priorityWeight(priority);
  const bar = (x: number, height: number, on: boolean) => (
    <rect key={x} x={x} y={12 - height} width="2.6" height={height} rx="1" fill={on ? "var(--text-2)" : "var(--border-strong)"} />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden style={{ flexShrink: 0 }}>
      {bar(1.8, 4.5, weight >= 1)}
      {bar(5.7, 7.5, weight >= 2)}
      {bar(9.6, 10.5, weight >= 3)}
    </svg>
  );
}

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS[status];
  return (
    <span className="pstatus" style={{ ["--c" as string]: meta.color }}>
      <i />
      {meta.name}
    </span>
  );
}

export function Progress({ value, tone = "" }: { value: number; tone?: string }) {
  return (
    <span className={`prog ${tone}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ ["--p" as string]: value / 100 }} />
    </span>
  );
}
