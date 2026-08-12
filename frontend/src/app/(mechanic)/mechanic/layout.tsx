import { AppShell } from "@/components/layout/AppShell";

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="mechanic" topbarLinks={["Jobs", "Schedule", "Inventory", "Team"]}>
      {children}
    </AppShell>
  );
}
