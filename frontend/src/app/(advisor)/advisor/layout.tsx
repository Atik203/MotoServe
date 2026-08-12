import { AppShell } from "@/components/layout/AppShell";

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="advisor" searchPlaceholder="Search plates, customers, jobs...">
      {children}
    </AppShell>
  );
}
