import { allTasks } from "@/lib/workspace";
import type { WorkspaceData } from "@/types/workspace";

export function listTasks(data: WorkspaceData) {
  return allTasks(data);
}
