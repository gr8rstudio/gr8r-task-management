"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { usePrefs, useWorkspaceData, useWorkspaceStore } from "@/store/workspace-store";
import type { ThemePref } from "@/types/workspace";

const NAV = [
  ["General", [["workspace", "Workspace", "building-2"], ["appearance", "Appearance", "palette"]]],
  ["Personal", [["profile", "Profile", "user"]]],
] as const;

const ACCENTS = [
  ["indigo", "#4B5BD6"],
  ["blue", "#2F6CD4"],
  ["violet", "#7348CC"],
  ["teal", "#1A7F7A"],
  ["rose", "#B93D68"],
  ["graphite", "#34332F"],
] as const;

export default function SettingsPage() {
  const data = useWorkspaceData();
  const prefs = usePrefs();
  const setPrefs = useWorkspaceStore((state) => state.setPrefs);
  const saveWorkspace = useWorkspaceStore((state) => state.saveWorkspace);
  const saveProfile = useWorkspaceStore((state) => state.saveProfile);
  const [section, setSection] = useState<"workspace" | "appearance" | "profile">("appearance");
  const [wsName, setWsName] = useState(data.ws.name);
  const [wsUrl, setWsUrl] = useState(data.ws.url);
  const [name, setName] = useState(prefs.name);
  const [title, setTitle] = useState(prefs.title);
  const [saved, setSaved] = useState("");

  return (
    <div className="set">
      <nav className="set-nav" aria-label="Settings">
        {NAV.map(([group, items]) => (
          <div key={group}>
            <div className="gh">{group}</div>
            {items.map(([id, label, icon]) => (
              <button key={id} className={`sitem ${section === id ? "on" : ""}`} onClick={() => setSection(id)}>
                <Icon name={icon} size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="set-body">
        <div className="set-in">
          {section === "appearance" ? (
            <>
              <h1>Appearance</h1>
              <p className="lead">Customize how Gr8r looks on this device.</p>
              <div className="sblock" style={{ marginTop: 0 }}>
                <h2>Theme</h2>
                <div className="seg" style={{ marginTop: 12 }}>
                  {(["light", "dark", "system"] as ThemePref[]).map((theme) => (
                    <button key={theme} className={prefs.theme === theme ? "on" : ""} onClick={() => setPrefs({ theme })}>{theme[0].toUpperCase() + theme.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div className="sblock">
                <h2>Accent color</h2>
                <div className="swatches" style={{ marginTop: 12 }}>
                  {ACCENTS.map(([id, color]) => (
                    <button key={id} className={`sw ${prefs.accent === id ? "on" : ""}`} style={{ ["--c" as string]: color, width: 22, height: 22 }} aria-label={id} onClick={() => setPrefs({ accent: id })} />
                  ))}
                </div>
              </div>
              <div className="sblock">
                <h2>Density</h2>
                <div className="srow">
                  <div><div className="t">Sidebar density</div><div className="d">Compact fits more projects on screen.</div></div>
                  <div className="seg">
                    {(["comfortable", "compact"] as const).map((side) => (
                      <button key={side} className={prefs.side === side ? "on" : ""} onClick={() => setPrefs({ side })}>{side[0].toUpperCase() + side.slice(1)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {section === "workspace" ? (
            <>
              <h1>Workspace</h1>
              <p className="lead">Your workspace name and address.</p>
              <form className="col" style={{ gap: 14, maxWidth: 440 }} onSubmit={(event) => { event.preventDefault(); saveWorkspace(wsName, wsUrl); setSaved("Workspace saved"); }}>
                <div className="field"><label className="label" htmlFor="ws-name">Workspace name</label><input id="ws-name" className="input" value={wsName} onChange={(event) => setWsName(event.target.value)} /></div>
                <div className="field"><label className="label" htmlFor="ws-url">Workspace URL</label><input id="ws-url" className="input" value={wsUrl} onChange={(event) => setWsUrl(event.target.value)} /></div>
                <div><button className="btn btn-primary" type="submit">Save changes</button></div>
                {saved ? <span className="hint">{saved}</span> : null}
              </form>
            </>
          ) : null}
          {section === "profile" ? (
            <>
              <h1>Profile</h1>
              <p className="lead">How you appear to the rest of the workspace.</p>
              <form className="col" style={{ gap: 14, maxWidth: 440 }} onSubmit={(event) => { event.preventDefault(); saveProfile(name, title); setSaved("Profile saved"); }}>
                <div className="field"><label className="label" htmlFor="pf-name">Full name</label><input id="pf-name" className="input" value={name} onChange={(event) => setName(event.target.value)} /></div>
                <div className="field"><label className="label" htmlFor="pf-title">Title</label><input id="pf-title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
                <div className="field"><label className="label" htmlFor="pf-email">Email</label><input id="pf-email" className="input" value={data.members.find((member) => member.id === data.me)?.email || ""} disabled /></div>
                <div><button className="btn btn-primary" type="submit">Save profile</button></div>
                {saved ? <span className="hint">{saved}</span> : null}
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
