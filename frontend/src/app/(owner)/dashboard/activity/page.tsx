import { ActivityManager } from "@/components/roles/shared/ActivityManager";

export const metadata = {
  title: "Activity & Notifications | MotoServe",
  description: "Review real-time vehicle servicing updates, estimates, payments, and notifications.",
};

export default function OwnerActivityPage() {
  return <ActivityManager role="owner" />;
}
