"use client";

import { useEffect } from "react";
import { usePrefs } from "@/store/workspace-store";

export default function AppearanceSync() {
  const prefs = usePrefs();

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", prefs.theme);
    if (prefs.accent === "indigo") root.removeAttribute("data-accent");
    else root.setAttribute("data-accent", prefs.accent);
    root.setAttribute("data-side", prefs.side);
    root.setAttribute("data-density", prefs.density);
  }, [prefs]);

  return null;
}
