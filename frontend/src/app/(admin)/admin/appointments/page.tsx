"use client";

import { AppointmentManager } from "@/components/roles/shared/AppointmentManager";

export default function AdminAppointmentsPage() {
  return (
    <AppointmentManager
      title="All Appointments"
      subtitle="Full overview of every customer booking across the workshop."
      detailsBase="/admin/appointments"
    />
  );
}