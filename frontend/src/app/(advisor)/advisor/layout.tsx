import { AppShell } from "@/components/layout/AppShell";

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="advisor" avatar="/images/avatars/admin-user.png" searchPlaceholder="Search plates, customers, jobs...">
      {children}
    </AppShell>
  );
}
