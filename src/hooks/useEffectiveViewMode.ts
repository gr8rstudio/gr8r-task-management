"use client";

import { useViewModeStore } from "@/store/view-mode-store";
import type { ViewMode } from "@/types/workspace";

export function useEffectiveViewMode(): ViewMode {
  return useViewModeStore((state) => state.mode);
}
