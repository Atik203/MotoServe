"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Gauge,
  Plus,
  UserCheck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { RowsLoading } from "@/components/ui/loading";
import type { TaskStatus } from "@/types";

const IN_PROGRESS_STATUSES: TaskStatus[] = ["received", "inspecting", "repairing", "testing"];
const DONE_STATUSES: TaskStatus[] = ["ready", "completed"];

const STATUS_COLORS: Record<string, string> = {
  received: "bg-[rgba(0,82,204,0.08)] text-[#0052cc]",
  inspecting: "bg-[rgba(255,193,7,0.12)] text-[#8b5000]",
  repairing: "bg-[rgba(186,26,26,0.08)] text-[#ba1a1a]",
  testing: "bg-[rgba(76,175,80,0.1)] text-[#2e7d32]",
  ready: "bg-[rgba(76,175,80,0.15)] text-[#1b5e20]",
  completed: "bg-[rgba(100,116,139,0.1)] text-[#475569]",
};

const statusLabel: Record<string, string> = {
  received: "Received",
  inspecting: "Inspecting",
  repairing: "Repairing",
  testing: "Testing",
  ready: "Ready",
  completed: "Completed",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-[#191c1d]">{value}</p>
        <p className="text-xs text-[#64748b]">{label}</p>
      </div>
    </div>
  );
}

export default function ReceiveVehiclePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const employees = useAppSelector((s) => s.employees.items);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const inProgressTasks = useMemo(
    () => tasks.filter((t) => (IN_PROGRESS_STATUSES as string[]).includes(t.status)),
    [tasks],
  );
  const readyTasks = useMemo(
    () => tasks.filter((t) => t.status === "ready"),
    [tasks],
  );
  const awaitingAssignment = useMemo(
    () => inProgressTasks.filter((t) => !t.mechanicId && (!t.mechanicIds || t.mechanicIds.length === 0)),
    [inProgressTasks],
  );

  const today = new Date().toISOString().slice(0, 10);
  const completedToday = useMemo(
    () => tasks.filter((t) => t.status === "completed" && t.updatedAt?.slice(0, 10) === today),
    [tasks, today],
  );

  const loading = (tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-8">
        <div className="mx-auto w-full max-w-7xl">
          <RowsLoading label="Loading received vehicles" />
        </div>
      </div>
    );
  }

  const TaskRow = ({ task }: { task: (typeof tasks)[number] }) => {
    const vehicle = vehicles.find((v) => v.id === task.vehicleId);
    const customer = customers.find((c) => c.id === task.customerId);
    const taskServices = task.services ?? [];

    const assignedMechanics = (() => {
      const ids = task.mechanicIds && task.mechanicIds.length > 0
        ? task.mechanicIds
        : task.mechanicId
          ? [task.mechanicId]
          : [];
      return ids.map((id) => employees.find((e) => e.id === id)).filter(Boolean);
    })();

    return (
      <div className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {/* Vehicle image */}
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#eef1f4]">
          {vehicle ? (
            <VehicleImage
              src={vehicle.image}
              alt={vehicle.model}
              fill
              className="object-contain p-1"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Car className="size-6 text-[#9ca3af]" />
            </div>
          )}
        </div>

        {/* Vehicle + Customer info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#191c1d]">
              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
            </p>
            <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5 font-mono text-[10px] text-[#64748b]">
              {vehicle?.regNo ?? "—"}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", STATUS_COLORS[task.status] ?? "")}>
              {statusLabel[task.status] ?? task.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#64748b]">
            {customer?.name ?? "Unknown"} · {task.id}
          </p>
          {taskServices.length > 0 && (
            <p className="mt-1 truncate text-[11px] text-[#9ca3af]">
              {taskServices.map((s) => s.name).join(" • ")}
            </p>
          )}
        </div>

        {/* Mechanic */}
        <div className="hidden shrink-0 lg:flex flex-col items-end gap-1">
          {assignedMechanics.length > 0 ? (
            <>
              <p className="text-[10px] text-[#64748b]">Assigned to</p>
              <div className="flex flex-wrap justify-end gap-1">
                {assignedMechanics.slice(0, 2).map((m) => (
                  <span
                    key={m!.id}
                    className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {m!.name.split(" ")[0]}
                  </span>
                ))}
                {assignedMechanics.length > 2 && (
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] text-[#64748b]">
                    +{assignedMechanics.length - 2}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="rounded-full border border-dashed border-[#ffc107] bg-[rgba(255,193,7,0.08)] px-2 py-0.5 text-[10px] font-medium text-[#8b5000]">
              Unassigned
            </span>
          )}
        </div>

        {/* Expected */}
        {task.expectedDate && (
          <div className="hidden shrink-0 flex-col items-end gap-1 xl:flex">
            <p className="text-[10px] text-[#64748b]">Due</p>
            <p className="text-xs font-semibold text-[#191c1d]">
              {new Date(task.expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/advisor/task-cards/assign?task=${task.id}`}
            className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-semibold text-[#424753] hover:border-primary/40 hover:text-primary"
          >
            Assign
          </Link>
          <Link
            href={`/advisor/tasks/${task.id}`}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            View
            <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-[#64748b]">Dashboard › Received Vehicles</p>
            <h1 className="text-3xl font-bold tracking-[-0.5px] text-[#191c1d]">Received Vehicles</h1>
            <p className="pt-1 text-sm text-[#64748b]">Vehicles currently checked in for service.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/advisor/tasks/new")}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-[10px] text-sm font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Receive New Vehicle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="In Progress" value={inProgressTasks.length} color="bg-[#eff6ff] text-primary" />
          <StatCard icon={UserCheck} label="Awaiting Assignment" value={awaitingAssignment.length} color="bg-[rgba(255,193,7,0.12)] text-[#8b5000]" />
          <StatCard icon={CheckCircle2} label="Ready for Pickup" value={readyTasks.length} color="bg-[rgba(76,175,80,0.12)] text-[#2e7d32]" />
          <StatCard icon={Gauge} label="Completed Today" value={completedToday.length} color="bg-[rgba(100,116,139,0.1)] text-[#475569]" />
        </div>

        {/* In-progress vehicles */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-[#191c1d]">In Service</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {inProgressTasks.length}
            </span>
          </div>

          {inProgressTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#e5e7eb] bg-white py-16">
              <Car className="size-8 text-[#c2c6d5]" />
              <p className="text-sm text-[#64748b]">No vehicles currently in service.</p>
              <button
                type="button"
                onClick={() => router.push("/advisor/tasks/new")}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus className="size-3.5" />
                Receive a Vehicle
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {inProgressTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        {/* Ready for pickup */}
        {readyTasks.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#2e7d32]" />
              <h2 className="text-base font-semibold text-[#191c1d]">Ready for Pickup</h2>
              <span className="rounded-full bg-[rgba(76,175,80,0.1)] px-2 py-0.5 text-xs font-semibold text-[#2e7d32]">
                {readyTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {readyTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {/* Recently completed */}
        {completedToday.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#64748b]" />
              <h2 className="text-base font-semibold text-[#191c1d]">Completed Today</h2>
              <span className="rounded-full bg-[rgba(100,116,139,0.1)] px-2 py-0.5 text-xs font-semibold text-[#64748b]">
                {completedToday.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 opacity-80">
              {completedToday.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </section>
        )}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[#e5e7eb] bg-white py-24">
            <CalendarDays className="size-10 text-[#c2c6d5]" />
            <div className="text-center">
              <p className="text-base font-semibold text-[#424753]">No tasks yet</p>
              <p className="mt-1 text-sm text-[#64748b]">Receive a vehicle to get started.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/advisor/tasks/new")}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="size-4" />
              Receive New Vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}