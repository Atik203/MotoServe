import { ActivityManager } from "@/components/roles/shared/ActivityManager";

export const metadata = {
  title: "Advisor Activity & Notifications | MotoServe",
  description: "Advisor activity feed, vehicle intake notifications, and appointment alerts.",
};

export default function AdvisorActivityPage() {
  return <ActivityManager role="advisor" title="Advisor Activity & Alerts" />;
}
