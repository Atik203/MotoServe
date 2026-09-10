import { ActivityManager } from "@/components/roles/shared/ActivityManager";

export const metadata = {
  title: "Admin Activity & Audit Log | MotoServe",
  description: "Workshop management activity feed, operational alerts, and notices.",
};

export default function AdminActivityPage() {
  return <ActivityManager role="admin" title="Operations & Workshop Activity" />;
}
