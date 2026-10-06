"use client";

import { create } from "zustand";

const SIDE_KEY = "gr8r.side";

type UiState = {
  collapsed: boolean;
  mobileNav: boolean;
  taskId: string | null;
  creating: boolean;
  hydrate: () => void;
  toggleSide: () => void;
  setMobileNav: (open: boolean) => void;
  openTask: (id: string) => void;
  closeTask: () => void;
  openCreate: () => void;
  closeCreate: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  collapsed: false,
  mobileNav: false,
  taskId: null,
  creating: false,
  hydrate: () => {
    if (localStorage.getItem(SIDE_KEY) === "1") set({ collapsed: true });
  },
  toggleSide: () => {
    const collapsed = !get().collapsed;
    localStorage.setItem(SIDE_KEY, collapsed ? "1" : "0");
    set({ collapsed });
  },
  setMobileNav: (mobileNav) => set({ mobileNav }),
  openTask: (taskId) => set({ taskId }),
  closeTask: () => set({ taskId: null }),
  openCreate: () => set({ creating: true }),
  closeCreate: () => set({ creating: false }),
}));
