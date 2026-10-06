"use client";

import { create } from "zustand";
import type { ViewMode } from "@/types/workspace";

const KEY = "gr8r.viewMode";

type ViewModeState = {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  hydrate: () => void;
};

export const useViewModeStore = create<ViewModeState>((set) => ({
  mode: "company",
  setMode: (mode) => {
    localStorage.setItem(KEY, mode);
    set({ mode });
  },
  hydrate: () => {
    const saved = localStorage.getItem(KEY);
    if (saved === "company" || saved === "personal") set({ mode: saved });
  },
}));
