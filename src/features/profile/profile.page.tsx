"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/chrome";
import { me } from "@/lib/workspace";
import { usePrefs, useWorkspaceData } from "@/store/workspace-store";

export default function ProfilePage() {
  const data = useWorkspaceData();
  const prefs = usePrefs();
  const person = me(data);
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <PageHeader title="Profile" text="Your account in this workspace.">
        <Link href="/settings" className="btn btn-secondary">Edit in settings</Link>
      </PageHeader>
      <section className="panel">
        <div className="panel-b" style={{ paddingTop: 16 }}>
          <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
            <Avatar id={person.id} size="xl" presence />
            <div>
              <h2 style={{ margin: 0 }}>{prefs.name}</h2>
              <p className="muted" style={{ margin: "4px 0 0" }}>{prefs.title}</p>
              <p className="faint" style={{ margin: "8px 0 0" }}>{person.email}</p>
              <p className="faint">{person.role} · {data.ws.name}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
