"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons/icon";

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state sm">
      <div className="glyph">
        <Icon name={icon} size={20} />
      </div>
      <h2 className="es-h">{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="ph">
      <div>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
      {children ? <div className="acts">{children}</div> : null}
    </div>
  );
}
