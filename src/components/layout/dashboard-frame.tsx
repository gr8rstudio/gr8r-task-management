"use client";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import BottomNav from "@/components/layout/bottom-nav";
import { NewTaskModal } from "@/features/tasks/components/new-task-modal";
import { TaskDrawer } from "@/features/tasks/components/task-drawer";
import { useUiStore } from "@/store/ui-store";

export default function DashboardFrame({ children }: { children: React.ReactNode }) {
  const collapsed = useUiStore((state) => state.collapsed);
  const mobileNav = useUiStore((state) => state.mobileNav);
  const setMobileNav = useUiStore((state) => state.setMobileNav);

  return (
    <div className={`shell ${collapsed ? "collapsed" : ""} ${mobileNav ? "mnav" : ""}`}>
      <Sidebar />
      {mobileNav ? <button className="side-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} /> : null}
      <main className="main" id="main">
        <Topbar />
        <div className="content" id="main-content">
          {children}
        </div>
      </main>
      <BottomNav />
      <TaskDrawer />
      <NewTaskModal />
    </div>
  );
}
