import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { SessionBootstrap } from "./SessionBootstrap";
import type { Role } from "@/lib/nav";

interface AppShellProps {
  role: Role;
  children: ReactNode;
  searchPlaceholder?: string;
  avatar?: string;
  topbarLinks?: string[];
  topbarShowChat?: boolean;
}

export function AppShell({
  role,
  children,
  searchPlaceholder,
  avatar,
  topbarLinks,
  topbarShowChat,
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <SessionBootstrap />
      <AppSidebar role={role} />
      <AppTopbar
        searchPlaceholder={searchPlaceholder}
        avatar={avatar}
        links={topbarLinks}
        showChat={topbarShowChat}
      />
      <main className="ml-64 pt-16">{children}</main>
    </div>
  );
}
