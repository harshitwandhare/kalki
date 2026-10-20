"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { KalkiSidebar } from "@/components/layout/kalki-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <KalkiSidebar />
      <main className="flex-1 flex flex-col min-h-screen bg-black overflow-hidden">
        <div className="flex items-center h-12 px-4 border-b border-zinc-800">
          <SidebarTrigger className="text-zinc-400 hover:text-white" />
          <div className="ml-4 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Kalki" width={20} height={20} />
            <span className="text-sm font-medium text-white">Kalki Studio</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
