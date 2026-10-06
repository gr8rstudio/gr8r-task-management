"use client";

import { useMemo } from "react";
import { listTasks } from "@/features/tasks/tasks.service";
import { useWorkspaceData } from "@/store/workspace-store";

export function useTasks() {
  const data = useWorkspaceData();
  return useMemo(() => listTasks(data), [data]);
}
