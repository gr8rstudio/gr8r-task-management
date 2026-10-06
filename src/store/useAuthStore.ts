"use client";

import { create } from "zustand";
import { clearAuthCookies, getAccessToken, setAccessTokenCookie } from "@/lib/auth-cookies";
import type { AuthUser } from "@/types/auth";

const LOGGED_OUT = "gr8r.loggedOut";

export const DEMO_USER: AuthUser = {
  id: "m1",
  name: "Alex Morgan",
  email: "hello@gr8rstudio.com",
  role: "Owner",
};

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
  boot: () => void;
  login: (email: string, name?: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  user: null,
  boot: () => {
    if (get().ready) return;
    const loggedOut = localStorage.getItem(LOGGED_OUT) === "1";
    const token = getAccessToken();
    if (loggedOut) {
      set({ ready: true, user: null });
      return;
    }
    if (!token) setAccessTokenCookie("local-demo");
    set({ ready: true, user: DEMO_USER });
  },
  login: (email, name) => {
    localStorage.removeItem(LOGGED_OUT);
    setAccessTokenCookie("local-demo");
    set({
      user: {
        ...DEMO_USER,
        email: email.trim() || DEMO_USER.email,
        name: name?.trim() || DEMO_USER.name,
      },
    });
  },
  logout: () => {
    localStorage.setItem(LOGGED_OUT, "1");
    clearAuthCookies();
    set({ user: null });
  },
}));
