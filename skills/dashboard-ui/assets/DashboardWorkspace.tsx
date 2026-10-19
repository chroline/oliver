"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface DashboardWorkspaceProps {
  navigationLabel: string;
  renderNavigation: (controls: { closeNavigation: () => void }) => ReactNode;
  children: ReactNode;
  /** Changes remount the detail subtree, not navigation or its state owner. */
  contentKey?: string;
  sidebarWidth?: string;
}

function WorkspacePanes({
  navigationLabel,
  renderNavigation,
  children,
  contentKey,
}: DashboardWorkspaceProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <Sidebar>
        {renderNavigation({ closeNavigation: () => setOpenMobile(false) })}
      </Sidebar>
      <SidebarInset className="h-dvh min-w-0 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2 md:hidden">
          <SidebarTrigger aria-label={`Show ${navigationLabel}`} />
          <span className="text-sm">{navigationLabel}</span>
        </div>
        <div
          key={contentKey}
          className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4"
        >
          {children}
        </div>
      </SidebarInset>
    </>
  );
}

/**
 * Optional full-viewport shell for a record-oriented dashboard.
 * Keep filters and selection in the caller; mobile Sheet content unmounts.
 * Adapt heights when embedding below an existing application's header.
 */
export function DashboardWorkspace({
  sidebarWidth = "22rem",
  ...props
}: DashboardWorkspaceProps) {
  return (
    <TooltipProvider>
      <SidebarProvider
        open
        className="h-dvh min-h-0 overflow-hidden"
        style={{ "--sidebar-width": sidebarWidth } as CSSProperties}
      >
        <WorkspacePanes {...props} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
