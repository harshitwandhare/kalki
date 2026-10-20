"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Tv2,
  Users,
  Globe,
  Library,
  Settings,
  Zap,
  Bot,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    group: "Studio",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/generate", label: "Generate Reel", icon: Zap, highlight: true },
      { href: "/library", label: "Reel Library", icon: Library },
    ],
  },
  {
    group: "Setup",
    items: [
      { href: "/channels", label: "Channels", icon: Tv2 },
      { href: "/characters", label: "Characters", icon: Users },
      { href: "/worlds", label: "Worlds", icon: Globe },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/agents", label: "Agent Monitor", icon: Bot },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/admin/users", label: "User Management", icon: Users },
    ],
  },
];

export function KalkiSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";

  return (
    <Sidebar className="bg-zinc-950 border-r border-zinc-800">
      <SidebarHeader className="px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Kalki" width={32} height={32} />
          <div>
            <div className="text-sm font-semibold text-white">Kalki</div>
            <div className="text-xs text-zinc-500">AI Video Studio</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-xs text-zinc-600 uppercase tracking-widest px-4 py-2">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) =>
                    item.href.startsWith("/admin") ? isOwner : true,
                  )
                  .map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800 data-[active=true]:text-white data-[active=true]:bg-zinc-800"
                        >
                          <Link href={item.href}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            {item.highlight && (
                              <Badge className="ml-auto text-xs bg-orange-500 text-white border-0 py-0">
                                NEW
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 shrink-0">
            {(session?.user?.name ??
              session?.user?.email ??
              "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">
              {session?.user?.name ?? session?.user?.email ?? "User"}
            </div>
            <div className="text-xs text-zinc-500 capitalize">
              {(session?.user?.role ?? "viewer").toLowerCase()}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            title="Sign out"
            className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-800 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
