import { AppShell } from "@/components/layout/AppShell";

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="owner">
      {children}
    </AppShell>
  );
}
