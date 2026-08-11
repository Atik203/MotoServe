import { AppShell } from "@/components/layout/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="admin" avatar="/images/avatars/admin-user.png" searchPlaceholder="Search resources...">
      {children}
    </AppShell>
  );
}
