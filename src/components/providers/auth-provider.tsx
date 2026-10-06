"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useViewModeStore } from "@/store/view-mode-store";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useAuthStore((state) => state.ready);
  const user = useAuthStore((state) => state.user);
  const boot = useAuthStore((state) => state.boot);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <div className="shell" aria-busy="true" />;
  return children;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const ready = useWorkspaceStore((state) => state.ready);
  const boot = useWorkspaceStore((state) => state.boot);
  const hydrateView = useViewModeStore((state) => state.hydrate);
  const hydrateUi = useUiStore((state) => state.hydrate);

  useEffect(() => {
    boot();
    hydrateView();
    hydrateUi();
  }, [boot, hydrateView, hydrateUi]);

  if (!ready) return <div className="shell" aria-busy="true" />;
  return children;
}
