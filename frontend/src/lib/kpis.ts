import type {
  Appointment,
  ChatThread,
  Estimate,
  Invoice,
  JobCard,
  KpiCard,
  ReportsData,
  Vehicle,
} from "@/types";

export type KpiRole = "admin" | "advisor" | "mechanic" | "owner";

interface KpiContext {
  jobs?: JobCard[];
  vehicles?: Vehicle[];
  appointments?: Appointment[];
  estimates?: Estimate[];
  invoices?: Invoice[];
  threads?: ChatThread[];
  reports?: ReportsData | null;
  userId?: string | null;
}

const ACTIVE_STATUSES = ["received", "inspecting", "repairing", "testing"];

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMoneyCompact = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export function buildKpis(role: KpiRole, ctx: KpiContext): KpiCard[] {
  const jobs = ctx.jobs ?? [];
  const vehicles = ctx.vehicles ?? [];
  const appointments = ctx.appointments ?? [];
  const estimates = ctx.estimates ?? [];
  const invoices = ctx.invoices ?? [];
  const reports = ctx.reports;
  const userId = ctx.userId;

  const activeJobs = jobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
  const readyJobs = jobs.filter((j) => j.status === "ready");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const pendingEstimates = estimates.filter((e) => e.status === "pending");
  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);
  const upcomingAppointments = appointments.filter((a) => a.status !== "cancelled");
  const assignedJobs = userId ? jobs.filter((j) => j.mechanicId === userId) : jobs;

  const nextAppointment = upcomingAppointments[0];
  const nextAppointmentDate = nextAppointment
    ? `Next on ${new Date(nextAppointment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "None scheduled";

  switch (role) {
    case "owner":
      {
        const servicedMileage = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.mileage)) : 0;
        const lastServiced =
          jobs
            .filter((j) => j.status === "completed" || j.status === "ready")
            .map((j) => ({
              vehicle: vehicles.find((v) => v.id === j.vehicleId),
              at: j.progress[j.progress.length - 1]?.timestamp,
            }))
            .filter((x) => x.vehicle && x.at)
            .sort((a, b) => new Date(b.at as string).getTime() - new Date(a.at as string).getTime())[0];
        const reminderVehicle = lastServiced?.vehicle ?? (vehicles.length > 0 ? vehicles[0] : null);
        return [
          {
            id: "kpi-301",
            label: "Upcoming Appts",
            value: String(upcomingAppointments.length),
            delta: nextAppointmentDate,
            trend: "up",
            icon: "calendar",
          },
          {
            id: "kpi-302",
            label: "Active Services",
            value: String(activeJobs.length),
            delta: activeJobs.length > 0 ? "In progress" : "None right now",
            trend: "flat",
            icon: "wrench",
          },
          {
            id: "kpi-303",
            label: "Registered Vehicles",
            value: String(vehicles.length),
            delta: "All active",
            trend: "flat",
            icon: "car",
          },
          {
            id: "kpi-304",
            label: "Pending Payments",
            value: fmtMoney(unpaidTotal),
            delta: `${unpaidInvoices.length} invoice${unpaidInvoices.length === 1 ? "" : "s"} due`,
            trend: unpaidInvoices.length > 0 ? "down" : "flat",
            icon: "wallet",
          },
          {
            id: "kpi-305",
            label: "Next Reminder",
            value: reminderVehicle ? `${reminderVehicle.make} ${reminderVehicle.model}` : "No reminders",
            delta: reminderVehicle
              ? lastServiced?.at
                ? `Last serviced ${Math.max(1, Math.round((Date.now() - new Date(lastServiced.at as string).getTime()) / 86_400_000))}d ago`
                : `${servicedMileage.toLocaleString()} mi — due for first service`
              : "Register a vehicle to begin",
            trend: "flat",
            icon: "bell",
          },
        ];
      }

    case "mechanic":
      return [
        {
          id: "kpi-001",
          label: "Assigned Jobs",
          value: String(assignedJobs.length),
          delta: `${activeJobs.length} active`,
          trend: "up",
          icon: "clipboard-list",
        },
        {
          id: "kpi-002",
          label: "In Progress",
          value: String(assignedJobs.filter((j) => j.status === "repairing" || j.status === "testing").length),
          delta: `${assignedJobs.filter((j) => j.priority === "high").length} high priority`,
          trend: "flat",
          icon: "wrench",
        },
        {
          id: "kpi-003",
          label: "Awaiting Parts",
          value: String(assignedJobs.filter((j) => j.partsUsed.length > 0 && j.status !== "completed").length),
          delta: "Parts on order",
          trend: "flat",
          icon: "package",
        },
        {
          id: "kpi-004",
          label: "Completed Today",
          value: String(assignedJobs.filter((j) => j.status === "completed").length),
          delta: "On track",
          trend: "up",
          icon: "check-circle",
        },
      ];

    case "advisor":
      return [
        {
          id: "kpi-101",
          label: "Appointments",
          value: String(appointments.length),
          delta: "This week",
          trend: "up",
          icon: "calendar",
        },
        {
          id: "kpi-102",
          label: "Active Jobs",
          value: String(activeJobs.length).padStart(2, "0"),
          delta: `${jobs.filter((j) => !j.mechanicId).length} awaiting mechanic`,
          trend: "flat",
          icon: "wrench",
        },
        {
          id: "kpi-103",
          label: "Pending Approvals",
          value: String(pendingEstimates.length).padStart(2, "0"),
          delta: pendingEstimates.length > 0 ? "Awaiting approval" : "None pending",
          trend: "flat",
          icon: "file-check",
        },
        {
          id: "kpi-104",
          label: "Ready for Pickup",
          value: String(readyJobs.length).padStart(2, "0"),
          delta: readyJobs.length > 0 ? "Ready now" : "None ready",
          trend: "flat",
          icon: "car",
        },
        {
          id: "kpi-105",
          label: "Active Chats",
          value: String(ctx.threads?.length ?? 0),
          delta: `${(ctx.threads ?? []).reduce((sum, t) => sum + t.unread, 0)} unread`,
          trend: "flat",
          icon: "message-square",
        },
        {
          id: "kpi-106",
          label: "Completed Jobs",
          value: String(completedJobs.length),
          delta: "This week",
          trend: "up",
          icon: "check-circle",
        },
      ];

    case "admin":
    default: {
      const totalRevenue = reports?.totalRevenue ?? 0;
      const latestRevenue = reports?.revenueByMonth[reports.revenueByMonth.length - 1]?.revenue ?? 0;
      return [
        {
          id: "kpi-201",
          label: "Total Revenue",
          value: fmtMoneyCompact(totalRevenue),
          delta: "YTD",
          trend: "up",
          icon: "dollar-sign",
        },
        {
          id: "kpi-202",
          label: "Today's Income",
          value: fmtMoneyCompact(latestRevenue),
          delta: "Latest month",
          trend: "up",
          icon: "wallet",
        },
        {
          id: "kpi-203",
          label: "Vehicles Serviced",
          value: String(jobs.length),
          delta: `${completedJobs.length} completed`,
          trend: "down",
          icon: "car",
        },
        {
          id: "kpi-204",
          label: "Pending Payments",
          value: fmtMoneyCompact(unpaidTotal),
          delta: `${unpaidInvoices.length} invoices`,
          trend: "up",
          icon: "file-check",
        },
        {
          id: "kpi-205",
          label: "Registered Customers",
          value: String(reports?.registeredCustomers ?? 0),
          delta: "Total",
          trend: "up",
          icon: "users",
        },
        {
          id: "kpi-206",
          label: "Active Mechanics",
          value: String(reports?.activeEmployees ?? 0),
          delta: "Optimal",
          trend: "flat",
          icon: "wrench",
        },
      ];
    }
  }
}
