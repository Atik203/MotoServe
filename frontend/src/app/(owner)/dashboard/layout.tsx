import { AppShell } from "@/components/layout/AppShell";

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="owner" avatar="/images/avatars/john-doe.png">
      {children}
    </AppShell>
  );
}
