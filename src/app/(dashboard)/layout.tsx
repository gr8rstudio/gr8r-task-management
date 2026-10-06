import type { ReactNode } from "react";
import AuthProvider, { WorkspaceProvider } from "@/components/providers/auth-provider";
import AppearanceSync from "@/components/providers/appearance-sync";
import DashboardFrame from "@/components/layout/dashboard-frame";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <AppearanceSync />
        <DashboardFrame>{children}</DashboardFrame>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
