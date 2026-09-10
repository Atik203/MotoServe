import { AppShell } from "@/components/layout/AppShell";

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="mechanic" topbarLinks={["Tasks", "Schedule", "Inventory", "Team"]}>
      {children}
    </AppShell>
  );
}
