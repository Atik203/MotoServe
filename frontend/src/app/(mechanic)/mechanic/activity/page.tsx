import { ActivityManager } from "@/components/roles/shared/ActivityManager";

export const metadata = {
  title: "Mechanic Activity & Work Orders | MotoServe",
  description: "Station task assignments, priority updates, and mechanic activity feed.",
};

export default function MechanicActivityPage() {
  return <ActivityManager role="mechanic" title="Station Activity & Task Alerts" />;
}
