"use client";

import { useAppSelector } from "@/store/hooks";
import { AppShell } from "@/components/layout/AppShell";
import { SessionBootstrap } from "@/components/layout/SessionBootstrap";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) {
    return (
      <>
        <SessionBootstrap />
        <div className="bg-background min-h-screen" />
      </>
    );
  }

  return <AppShell role={user.role}>{children}</AppShell>;
}
