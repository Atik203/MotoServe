"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileCheck2,
  Fuel,
  Gauge,
  KeyRound,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTask, fetchTasks, updateTaskStatus } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { downloadTaskCardPdf } from "@/lib/pdf";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";
import { PriorityPill, StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { MechanicNotes } from "@/components/roles/mechanic/MechanicNotes";
import { PartsUsedTable } from "@/components/roles/mechanic/PartsUsedTable";
import { RepairPhotos } from "@/components/roles/mechanic/RepairPhotos";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DetailLoading } from "@/components/ui/loading";
import type { TaskPriority, TaskStatus } from "@/types";

const STATUS_ORDER: TaskStatus[] = [
  "received",
  "inspecting",
  "repairing",
  "testing",
  "ready",
  "completed",
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  received: "Received",
  inspecting: "Inspecting",
  repairing: "Repairing",
  testing: "Testing",
  ready: "Ready for Pickup",
  completed: "Completed",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AdvisorTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params?.id;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const employees = useAppSelector((s) => s.employees.items);
  const user = useAppSelector((s) => s.auth.user);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (taskId) {
      void dispatch(fetchTask(taskId));
    }
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchEmployees());
  }, [dispatch, taskId]);

  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

  const vehicle = useMemo(() => {
    if (!task) return null;
    return vehicles.find((v) => v.id === task.vehicleId) ?? task.vehicle ?? null;
  }, [task, vehicles]);

  const customer = useMemo(() => {
    if (!task) return null;
    const found = customers.find((c) => c.id === task.customerId);
    return found ? { ...task.customer, ...found } : task.customer;
  }, [task, customers]);

  const assignedMechanics = useMemo(() => {
    if (!task) return [];
    if (task.mechanics && task.mechanics.length > 0) {
      return task.mechanics.map((m) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        specialization: m.specialization ?? null,
        station: m.station ?? null,
      }));
    }
    if (task.mechanicIds && task.mechanicIds.length > 0) {
      return task.mechanicIds
        .map((id) => employees.find((e) => e.id === id))
        .filter(Boolean)
        .map((e) => ({
          id: e!.id,
          name: e!.name,
          avatar: e!.avatar,
          specialization: e!.specialization ?? null,
          station: e!.station ?? null,
        }));
    }
    if (task.mechanic) {
      const found = employees.find((e) => e.id === task.mechanic?.id);
      return [
        {
          id: task.mechanic.id,
          name: task.mechanic.name,
          avatar: task.mechanic.avatar,
          specialization: found?.specialization ?? null,
          station: found?.station ?? null,
        },
      ];
    }
    if (task.mechanicId) {
      const found = employees.find((e) => e.id === task.mechanicId);
      if (found) {
        return [
          {
            id: found.id,
            name: found.name,
            avatar: found.avatar,
            specialization: found.specialization ?? null,
            station: found.station ?? null,
          },
        ];
      }
    }
    return [];
  }, [task, employees]);

  if ((tasksStatus === "loading" || tasksStatus === "idle") && !task) {
    return <DetailLoading label={`Loading task #${taskId}`} />;
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb] p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Wrench className="size-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#191c1d]">Task Not Found</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Could not find task <span className="font-mono font-semibold text-foreground">#{taskId}</span>.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link href="/advisor/tasks">
            <Button variant="outline" className="rounded-lg">
              <ArrowLeft className="mr-2 size-4" />
              Back to Tasks
            </Button>
          </Link>
          <Link href="/advisor/receive">
            <Button className="rounded-lg">Received Vehicles</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleStatusChange = async (targetStatus: TaskStatus) => {
    if (targetStatus === task.status || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await dispatch(updateTaskStatus({ id: task.id, status: targetStatus })).unwrap();
      toast.success(`Task moved to ${STATUS_LABELS[targetStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const servicesTotal = (task.services ?? []).reduce((sum, s) => sum + (s.price ?? 0), 0);
  const partsTotal = (task.partsUsed ?? []).reduce((sum, p) => sum + (p.subtotal ?? 0), 0);
  const subtotal = servicesTotal + partsTotal;
  const estimatedTax = subtotal * 0.085;
  const grandTotal = subtotal + estimatedTax;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#727784]">
            <Link href="/advisor" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <Link href="/advisor/tasks" className="hover:text-foreground">
              Tasks
            </Link>
            <span>›</span>
            <span className="text-foreground">#{task.id}</span>
          </nav>

          {/* Header Row */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/advisor/tasks"
                className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#424753] hover:bg-[#f3f4f5]"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-[#191c1d]">Task #{task.id}</h1>
                  <StatusBadge status={task.status} />
                  <PriorityPill priority={task.priority} />
                </div>
                <p className="mt-0.5 text-xs text-[#64748b]">
                  Created {new Date(task.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {task.advisor?.name && ` · Created by Advisor ${task.advisor.name}`}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  downloadTaskCardPdf(task);
                  toast.success("Task card PDF downloaded");
                }}
                className="gap-2 rounded-lg border-[#e5e7eb] bg-white text-xs font-semibold text-[#191c1d] hover:bg-muted"
              >
                <Download className="size-3.5" />
                Download PDF
              </Button>

              <Link href={`/advisor/task-cards/assign?task=${task.id}`}>
                <Button
                  variant="outline"
                  className="gap-2 rounded-lg border-[#e5e7eb] bg-white text-xs font-semibold text-[#191c1d] hover:bg-muted"
                >
                  <Users className="size-3.5" />
                  Assign Mechanic
                </Button>
              </Link>

              <Link href={`/advisor/estimates/new?task=${task.id}`}>
                <Button
                  variant="outline"
                  className="gap-2 rounded-lg border-[#e5e7eb] bg-white text-xs font-semibold text-[#0052cc] hover:bg-[#eff6ff]"
                >
                  <FileCheck2 className="size-3.5" />
                  Create Estimate
                </Button>
              </Link>

              {nextStatus && task.status !== "completed" && (
                <Button
                  onClick={() => void handleStatusChange(nextStatus)}
                  disabled={updatingStatus}
                  className="gap-2 rounded-lg bg-primary text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary/90"
                >
                  <Sparkles className="size-3.5" />
                  Advance to {STATUS_LABELS[nextStatus]}
                </Button>
              )}

              {task.status === "ready" && (
                <Button
                  onClick={() => void handleStatusChange("completed")}
                  disabled={updatingStatus}
                  className="gap-2 rounded-lg bg-[#2e7d32] text-xs font-semibold text-white hover:bg-[#1b5e20]"
                >
                  <CheckCircle2 className="size-3.5" />
                  Complete Task
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Stepper Card */}
        <section className="flex flex-col gap-5 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#191c1d]">Service Progress</h2>
              <p className="text-xs text-[#64748b]">Current stage: <strong className="text-foreground capitalize">{STATUS_LABELS[task.status]}</strong></p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748b]">Move stage:</span>
              <select
                value={task.status}
                onChange={(e) => void handleStatusChange(e.target.value as TaskStatus)}
                disabled={updatingStatus}
                className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-xs font-semibold text-[#191c1d] focus:border-primary focus:outline-none"
              >
                {STATUS_ORDER.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 pb-1">
            <ProgressStepper steps={task.progress} />
          </div>
        </section>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column (8 cols) */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
            {/* Vehicle & Intake Information Card */}
            <section className="flex flex-col gap-5 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
                <div className="flex items-center gap-2">
                  <Car className="size-5 text-primary" />
                  <h2 className="text-base font-semibold text-[#191c1d]">Vehicle & Intake Details</h2>
                </div>
                {vehicle?.id && (
                  <Link
                    href={`/advisor/vehicles/${vehicle.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View Vehicle History
                    <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>

              {/* Vehicle Specs Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f8fafc]">
                  {vehicle ? (
                    <VehicleImage
                      src={vehicle.image}
                      alt={vehicle.model}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Car className="size-8 text-[#9ca3af]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-[#191c1d]">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Vehicle #${task.vehicleId}`}
                    </h3>
                    <span className="rounded-md border border-[#c2c6d5] bg-[#f8fafc] px-2.5 py-0.5 font-mono text-xs font-bold text-[#191c1d]">
                      {vehicle?.regNo ?? "NO PLATE"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                    {vehicle?.vin && (
                      <span>VIN: <strong className="font-mono text-foreground">{vehicle.vin}</strong></span>
                    )}
                    {vehicle?.fuelType && (
                      <span>Fuel: <strong className="capitalize text-foreground">{vehicle.fuelType}</strong></span>
                    )}
                    {vehicle?.transmission && (
                      <span>Transmission: <strong className="capitalize text-foreground">{vehicle.transmission}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Intake Specifications Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-1 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <Gauge className="size-3.5 text-primary" />
                    <span>Intake Mileage</span>
                  </div>
                  <span className="text-sm font-bold text-[#191c1d]">
                    {task.mileage ? `${task.mileage.toLocaleString()} mi` : vehicle?.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <Fuel className="size-3.5 text-primary" />
                    <span>Fuel Level</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#191c1d]">
                      {task.fuelLevel !== undefined && task.fuelLevel !== null ? `${task.fuelLevel}%` : "—"}
                    </span>
                    {task.fuelLevel !== undefined && task.fuelLevel !== null && (
                      <div className="h-2 w-12 overflow-hidden rounded-full bg-[#e5e7eb]">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            task.fuelLevel <= 20 ? "bg-[#ba1a1a]" : task.fuelLevel <= 50 ? "bg-[#ffc107]" : "bg-[#2e7d32]",
                          )}
                          style={{ width: `${Math.min(100, Math.max(0, task.fuelLevel))}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <KeyRound className="size-3.5 text-primary" />
                    <span>Keys Received</span>
                  </div>
                  <span className={cn("text-sm font-bold", task.keysReceived ? "text-[#2e7d32]" : "text-[#ba1a1a]")}>
                    {task.keysReceived ? "Yes (In Key Locker)" : "Not Received"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <Package className="size-3.5 text-primary" />
                    <span>Accessories / Belongings</span>
                  </div>
                  <span className="truncate text-xs font-semibold text-[#191c1d]" title={task.accessories ?? "None"}>
                    {task.accessories ? task.accessories : "None logged"}
                  </span>
                </div>
              </div>

              {/* Customer Reported Issues */}
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <ShieldAlert className="size-4 text-amber-600" />
                  <span>Reported Issues & Symptoms</span>
                </div>
                <p className="text-sm leading-relaxed text-amber-950">
                  {task.issues || "No specific customer issues logged."}
                </p>
              </div>
            </section>

            {/* Requested Services */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="size-5 text-primary" />
                  <h2 className="text-base font-semibold text-[#191c1d]">Requested Services</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {(task.services ?? []).length}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#191c1d]">
                  Total: ${servicesTotal.toFixed(2)}
                </span>
              </div>

              <div className="divide-y divide-[#f1f3f5]">
                {(task.services ?? []).map((service, index) => (
                  <div key={service.id || index} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#eff6ff] text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#191c1d]">{service.name}</p>
                        <p className="text-xs text-[#64748b]">Standard service package</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#191c1d]">
                      ${(service.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                {(!task.services || task.services.length === 0) && (
                  <div className="py-6 text-center text-sm text-[#64748b]">
                    No services specified on this task.
                  </div>
                )}
              </div>
            </section>

            {/* Parts Used Table */}
            <PartsUsedTable taskId={task.id} parts={task.partsUsed ?? []} />

            {/* Photos & Visual Documentation */}
            <RepairPhotos taskId={task.id} photos={task.photos ?? []} />

            {/* Advisor & Mechanic Notes */}
            <MechanicNotes
              taskId={task.id}
              notes={task.notes ?? []}
              author={user?.name ?? "Service Advisor"}
            />
          </div>

          {/* Right Column (4 cols) */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            {/* Customer Information Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-[#191c1d]">Customer Information</h3>
                </div>
                {customer?.id && (
                  <Link
                    href={`/advisor/customers?id=${customer.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Profile
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="size-12 border border-[#e5e7eb]">
                  {customer?.avatar && <AvatarImage src={customer.avatar} alt={customer.name} />}
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">
                    {customer?.name ? initials(customer.name) : "CU"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[#191c1d]">{customer?.name ?? "Customer"}</p>
                  <p className="text-xs text-[#64748b]">ID: {customer?.id ?? task.customerId}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1 text-xs">
                {customer?.phone ? (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 font-medium text-[#191c1d] hover:border-primary/50"
                  >
                    <Phone className="size-4 text-primary" />
                    <span>{customer.phone}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 text-[#64748b]">
                    <Phone className="size-4 text-[#9ca3af]" />
                    <span>No phone provided</span>
                  </div>
                )}

                {customer?.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 font-medium text-[#191c1d] hover:border-primary/50"
                  >
                    <Mail className="size-4 text-primary" />
                    <span className="truncate">{customer.email}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 text-[#64748b]">
                    <Mail className="size-4 text-[#9ca3af]" />
                    <span>No email provided</span>
                  </div>
                )}
              </div>

              <Link href="/advisor/chat" className="w-full">
                <Button variant="outline" className="w-full gap-2 rounded-lg border-primary/20 bg-[#eff6ff] text-xs font-semibold text-primary hover:bg-primary/10">
                  <MessageSquare className="size-3.5" />
                  Message Customer
                </Button>
              </Link>
            </section>

            {/* Assigned Mechanics & Workstation Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-[#191c1d]">Assigned Mechanics</h3>
                </div>
                <Link
                  href={`/advisor/task-cards/assign?task=${task.id}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Manage
                </Link>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#64748b]">Assigned Station / Bay</span>
                <span className="text-sm font-semibold text-[#191c1d]">
                  {task.station ?? "Main Workshop / Bay"}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {assignedMechanics.length > 0 ? (
                  assignedMechanics.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5"
                    >
                      <Avatar className="size-9 border border-[#e5e7eb]">
                        {m.avatar && <AvatarImage src={m.avatar} alt={m.name} />}
                        <AvatarFallback className="bg-[#eff6ff] text-xs font-bold text-primary">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#191c1d]">{m.name}</p>
                        <p className="truncate text-[11px] text-[#64748b]">
                          {m.specialization ?? "Mechanic Specialist"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-4 text-center">
                    <Users className="size-6 text-amber-500" />
                    <p className="text-xs font-medium text-amber-800">No mechanic assigned yet</p>
                    <Link href={`/advisor/task-cards/assign?task=${task.id}`} className="mt-1">
                      <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                        <Plus className="size-3" />
                        Assign Mechanic
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {task.assignmentNotes && (
                <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs">
                  <p className="font-semibold text-[#191c1d]">Advisor Instructions:</p>
                  <p className="mt-1 text-[#424753]">{task.assignmentNotes}</p>
                </div>
              )}
            </section>

            {/* Financial Summary Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <h3 className="text-sm font-semibold text-[#191c1d]">Financial Summary</h3>
                <span className="rounded bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                  Estimate
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Services Subtotal:</span>
                  <span className="font-semibold text-[#191c1d]">${servicesTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Parts & Materials:</span>
                  <span className="font-semibold text-[#191c1d]">${partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Estimated Tax (8.5%):</span>
                  <span className="font-semibold text-[#191c1d]">${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-[#f1f3f5] pt-2 text-sm font-bold text-[#191c1d]">
                  <span>Total Amount:</span>
                  <span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link href={`/advisor/estimates/new?task=${task.id}`} className="w-full">
                <Button className="w-full gap-2 rounded-lg text-xs font-semibold">
                  <FileCheck2 className="size-3.5" />
                  Generate / Update Estimate
                </Button>
              </Link>
            </section>

            {/* Schedule & Metadata Card */}
            <section className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)] text-xs">
              <h3 className="border-b border-[#f1f3f5] pb-2 font-semibold text-[#191c1d]">Intake Schedule</h3>

              <div className="flex items-center justify-between text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Expected Completion</span>
                </div>
                <span className="font-semibold text-[#191c1d]">
                  {task.expectedDate
                    ? new Date(task.expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Not specified"}
                </span>
              </div>

              {task.appointmentId && (
                <div className="flex items-center justify-between text-[#64748b]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    <span>Appointment Origin</span>
                  </div>
                  <Link
                    href={`/advisor/appointments`}
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    #{task.appointmentId}
                  </Link>
                </div>
              )}

              {task.updatedAt && (
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Last Updated</span>
                  <span>
                    {new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
