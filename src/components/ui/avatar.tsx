"use client";

import { Icon } from "@/components/icons/icon";
import { memberById } from "@/lib/workspace";
import { useWorkspaceData } from "@/store/workspace-store";

export function Avatar({ id, size = "", presence = false }: { id?: string | null; size?: string; presence?: boolean }) {
  const data = useWorkspaceData();
  const member = memberById(data, id);
  if (!member) {
    return (
      <span className={`av empty ${size}`}>
        <Icon name="user" size={11} />
      </span>
    );
  }
  const initials = member.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return (
    <span className={`av ${size} ${presence ? "presence" : ""}`} style={{ ["--c" as string]: member.color }} title={member.name}>
      {initials}
    </span>
  );
}

export function AvatarStack({ ids, max = 4 }: { ids: string[]; max?: number }) {
  const shown = ids.slice(0, max);
  return (
    <span className="avs">
      {shown.map((id) => (
        <Avatar key={id} id={id} size="sm" />
      ))}
      {ids.length > max ? <span className="av sm more">+{ids.length - max}</span> : null}
    </span>
  );
}
