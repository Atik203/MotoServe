import { AppShell } from "@/components/layout/AppShell";

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      role="mechanic"
      avatar="/images/avatars/alex-turner.png"
      topbarLinks={["Jobs", "Schedule", "Inventory", "Team"]}
      topbarShowChat
    >
      {children}
    </AppShell>
  );
}
