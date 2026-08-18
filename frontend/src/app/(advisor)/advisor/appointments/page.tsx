"use client";

import { useRouter } from "next/navigation";
import { AppointmentManager } from "@/components/roles/shared/AppointmentManager";

export default function AdvisorAppointmentsPage() {
  const router = useRouter();
  return (
    <AppointmentManager
      title="Appointments"
      subtitle="Bookings from customers — confirm each one before receiving the vehicle."
      detailsBase="/advisor/appointments"
      onIntake={(a) => router.push(`/advisor/receive?appointment=${encodeURIComponent(a.id)}`)}
    />
  );
}