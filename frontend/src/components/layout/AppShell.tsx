import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { SessionBootstrap } from "./SessionBootstrap";
import type { Role } from "@/lib/nav";

interface AppShellProps {
  role: Role;
  children: ReactNode;
  searchPlaceholder?: string;
  topbarLinks?: string[];
}

export function AppShell({
  role,
  children,
  searchPlaceholder,
  topbarLinks,
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <SessionBootstrap requiredRole={role} />
      <AppSidebar role={role} />
      <AppTopbar searchPlaceholder={searchPlaceholder} links={topbarLinks} />
      <main className="ml-64 pt-16">{children}</main>
    </div>
  );
}
