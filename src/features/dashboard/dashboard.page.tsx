"use client";

import { useEffectiveViewMode } from "@/hooks/useEffectiveViewMode";
import { CompanyDashboardPage, PersonalDashboardPage } from "./dashboard-views";

export default function DashboardPage() {
  const mode = useEffectiveViewMode();
  if (mode === "personal") return <PersonalDashboardPage />;
  return <CompanyDashboardPage />;
}
