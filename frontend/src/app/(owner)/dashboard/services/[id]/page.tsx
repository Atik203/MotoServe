"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Car,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Fuel,
  KeyRound,
  MessageSquare,
  Package,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTask, fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchRatings, rateTask } from "@/store/slices/ratingsSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import { DetailLoading } from "@/components/ui/loading";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaskStatus } from "@/types";

function Stars({
  rating,
  size = "size-5",
  onSelect,
}: {
  rating: number;
  size?: string;
  onSelect?: (value: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const star = (
          <Star
            className={cn(
              size,
              i <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
            )}
          />
        );
        if (onSelect) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              {star}
            </button>
          );
        }
        return (
          <span key={i} className="inline-flex">
            {star}
          </span>
        );
      })}
    </div>
  );
}

const STAGES: {
  key: TaskStatus;
  title: string;
  description: string;
}[] = [
  {
    key: "received",
    title: "Received",
    description: "Vehicle logged, mileage recorded, and keys received.",
  },
  {
    key: "inspecting",
    title: "Inspecting",
    description: "OBD system diagnostics and comprehensive multi-point check.",
  },
  {
    key: "repairing",
    title: "Repairing",
    description: "Technicians executing approved service lines and parts replacement.",
  },
  {
    key: "testing",
    title: "Testing",
    description: "Safety protocol checklist, system verification, and test drive.",
  },
  {
    key: "ready",
    title: "Ready",
    description: "Detailed, parked in dispatch bay, and ready for owner handover.",
  },
];

const statusMeta: Record<string, { label: string; badgeClass: string }> = {
  received: {
    label: "Received",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  inspecting: {
    label: "Inspecting",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  repairing: {
    label: "Repairing",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  testing: {
    label: "Testing",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
  },
  ready: {
    label: "Ready",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  completed: {
    label: "Service Completed",
    badgeClass: "border-gray-200 bg-gray-100 text-gray-700",
  },
};

export default function ServiceTrackingDetailsPage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const ratings = useAppSelector((s) => s.ratings.items);

  const [score, setScore] = useState(5);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (tasks.length === 0) dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
    if (estimates.length === 0) dispatch(fetchEstimates());
    if (invoices.length === 0) dispatch(fetchInvoices());
    dispatch(fetchRatings());
  }, [dispatch, tasks.length, vehicles.length, services.length, estimates.length, invoices.length]);

  const task = tasks.find((t) => t.id === params.id);

  useEffect(() => {
    if (!task && params?.id) {
      dispatch(fetchTask(params.id));
    }
  }, [dispatch, task, params?.id]);

  const vehicle = task ? vehicles.find((v) => v.id === task.vehicleId) ?? task.vehicle : null;
  const estimate = task ? estimates.find((e) => e.taskId === task.id) ?? null : null;
  const invoice = task ? invoices.find((inv) => inv.taskId === task.id) ?? null : null;
  const existingRating = task ? ratings.find((r) => r.taskId === task.id) ?? null : null;

  const currentStageIndex = !task
    ? 0
    : task.status === "completed"
      ? 4
      : Math.max(0, STAGES.findIndex((s) => s.key === task.status));

  const progressPercent = !task
    ? 0
    : task.status === "completed" || task.status === "ready"
      ? 100
      : Math.round((currentStageIndex / (STAGES.length - 1)) * 100);

  const submitRating = async () => {
    if (!task) return;
    setSubmittingRating(true);
    try {
      await dispatch(
        rateTask({
          taskId: task.id,
          score,
          review: review.trim(),
          serviceName: task.services[0]?.name ?? "Vehicle Service",
        }),
      ).unwrap();
      toast.success(existingRating ? "Review updated!" : "Thank you for rating your service!");
      await dispatch(fetchRatings());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if ((tasksStatus === "idle" || tasksStatus === "loading") && !task) {
    return <DetailLoading label="Loading real-time service tracking..." />;
  }

  if (!task) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Wrench className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Service #{params.id} Not Found</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              This service record could not be found or you may not have permission to view it.
            </p>
          </div>
          <Link
            href="/dashboard/services"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
          >
            <ArrowLeft className="size-3.5" />
            Back to Service Tracking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <Link href="/dashboard/services" className="hover:text-foreground">
              Service Tracking
            </Link>
            <span>›</span>
            <span className="font-mono text-foreground">#{task.id}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Service Tracking #{task.id}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                    statusMeta[task.status]?.badgeClass ?? "border-border bg-secondary text-foreground",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {statusMeta[task.status]?.label ?? task.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Intake logged on{" "}
                {new Date(task.createdAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                • {task.station ?? "Main Workshop Bay"}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dispatch(fetchTasks());
                  toast.success("Tracking refreshed");
                }}
                className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-xs hover:bg-secondary cursor-pointer"
              >
                <RefreshCw className="size-3.5 text-primary" />
                Refresh Status
              </Button>
              <Link
                href="/dashboard/services"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary"
              >
                <ArrowLeft className="size-3.5" />
                All Services
              </Link>
            </div>
          </div>
        </div>

        {/* Live Milestone Stepper Card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Live Workshop Progress
              </p>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                {task.status === "completed"
                  ? "Service Completed & Quality Checked"
                  : task.status === "ready"
                    ? "Ready for Customer Collection"
                    : `Active Stage ${currentStageIndex + 1} of 5: ${STAGES[currentStageIndex]?.title}`}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">Progress</span>
              <span className="font-mono text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
          </div>

          {/* Stepper Timeline Visualizer */}
          <div className="relative pt-8 pb-4">
            {/* Background connecting bar */}
            <div className="absolute top-12 left-8 right-8 h-1 bg-border -translate-y-1/2 hidden md:block" />
            <div
              className="absolute top-12 left-8 h-1 bg-primary -translate-y-1/2 transition-all duration-500 hidden md:block"
              style={{ width: `calc((100% - 4rem) * ${progressPercent / 100})` }}
            />

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-5">
              {STAGES.map((stage, idx) => {
                const isCompleted =
                  task.status === "completed" ||
                  (task.status === "ready" && idx <= 4) ||
                  idx < currentStageIndex;
                const isCurrent =
                  (task.status !== "completed" && idx === currentStageIndex) ||
                  (task.status === "ready" && idx === 4);

                const progressItem = task.progress?.find((p) => p.step === stage.key);
                let stepTimestamp: string | null = null;
                if (progressItem?.timestamp && (isCompleted || isCurrent)) {
                  const parsed = new Date(progressItem.timestamp.replace(" ", "T"));
                  if (!isNaN(parsed.getTime())) {
                    stepTimestamp = parsed.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }
                }

                return (
                  <div key={stage.key} className="flex flex-row md:flex-col items-start md:items-center gap-3 md:gap-2">
                    {/* Circle Node */}
                    <div
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                        isCompleted
                          ? "border-primary bg-primary text-white shadow-2xs"
                          : isCurrent
                            ? "border-primary bg-white text-primary ring-4 ring-primary/20"
                            : "border-border bg-white text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}

                      {/* Live pulse dot for active stage */}
                      {isCurrent && task.status !== "completed" && (
                        <span className="absolute -top-1 -right-1 flex size-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex size-3 rounded-full bg-primary" />
                        </span>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex flex-col md:text-center">
                      <p
                        className={cn(
                          "text-xs font-bold",
                          isCurrent
                            ? "text-primary"
                            : isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {stage.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 max-w-[180px]">
                        {stage.description}
                      </p>
                      {stepTimestamp && (
                        <span className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-600 md:justify-center">
                          <Clock className="size-3" />
                          {stepTimestamp}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Status Alert */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-foreground">
                  {task.status === "ready"
                    ? "Vehicle Ready for Customer Pickup"
                    : task.status === "completed"
                      ? "Service Completed and Closed"
                      : `Currently Underway: ${STAGES[currentStageIndex]?.title}`}
                </p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  {task.status === "ready"
                    ? "All maintenance inspections, parts installations, and quality safety checks have passed. You may pick up your vehicle from the dispatch bay at your earliest convenience."
                    : task.status === "completed"
                      ? "This job card is marked as completed and handed over. Check below for your invoice receipt."
                      : `Your vehicle is currently in ${task.station ?? "Main Workshop Bay"}. Our team adheres to strict multi-point safety standards. You will be notified immediately if additional recommendations arise.`}
                </p>
              </div>

              {task.expectedDate && (
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Estimated Completion</span>
                  <span className="font-semibold text-foreground">
                    {new Date(task.expectedDate.replace(" ", "T")).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Details Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Main Left Column: Vehicle Info, Problem, Services & Parts */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* Vehicle Overview Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
              <div className="relative h-44 sm:h-36 sm:w-56 shrink-0 bg-secondary border-b sm:border-b-0 sm:border-r border-border">
                {vehicle?.image ? (
                  <VehicleImage
                    src={vehicle.image}
                    alt={vehicle.model}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Car className="size-10" />
                  </div>
                )}
                {vehicle?.regNo && (
                  <span className="absolute bottom-2.5 left-2.5 rounded-md border border-[#c2c6d5] bg-[#edf0f8] px-2 py-0.5 font-mono text-[11px] font-bold text-[#2a3042] tracking-wider shadow-2xs">
                    {vehicle.regNo}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Task #${task.id}`}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {vehicle?.fuelType ? `${vehicle.fuelType.toUpperCase()} • ` : ""}
                      {vehicle?.transmission ?? "Automatic"}
                    </p>
                  </div>
                  <span className="rounded-lg bg-secondary px-2 py-1 text-[11px] font-medium text-foreground">
                    Priority: <strong className="capitalize">{task.priority}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-xs">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Mileage In</p>
                    <p className="font-semibold text-foreground">
                      {task.mileage ? `${task.mileage.toLocaleString()} mi` : vehicle?.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Fuel Level</p>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Fuel className="size-3 text-muted-foreground" />
                      {task.fuelLevel ? `${task.fuelLevel}%` : "Recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Keys Received</p>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <KeyRound className="size-3 text-emerald-600" />
                      {task.keysReceived ? "Yes (In Keybox)" : "Yes"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem & Inspection Notes Section */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Stethoscope className="size-4 text-primary" />
                Problem Diagnosis & Inspection Findings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reported Issue */}
                <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-[#f8f9fa] p-3.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Customer Reported Concern
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">
                    {task.issues || "Routine scheduled maintenance and vehicle inspection."}
                  </p>
                </div>

                {/* Intake & Inspection Notes */}
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-[#f8f9fa] p-3.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Technician Diagnostic Notes
                  </p>
                  {(task.notes ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Inspection notes will appear here once entered by the workshop mechanic.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {(task.notes ?? []).map((note) => (
                        <div key={note.id} className="rounded-lg border border-border/80 bg-white p-2.5 text-xs">
                          <p className="text-foreground leading-relaxed">{note.text}</p>
                          <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                            Logged by {note.author} • {new Date(note.time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Photos taken during service (if any) */}
              {(task.photos ?? []).length > 0 && (
                <div className="mt-2 flex flex-col gap-2 pt-3 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Inspection & Repair Photos ({(task.photos ?? []).length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {task.photos.map((photo, i) => (
                      <div
                        key={i}
                        className="relative size-20 overflow-hidden rounded-xl border border-border bg-secondary"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`Service inspection photo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Services & Parts Itemized Breakdown Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
              <div className="border-b border-border bg-[#f8f9fa] px-5 py-3.5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Package className="size-4 text-primary" />
                  Services & Parts Breakdown
                </h2>
                <span className="text-xs text-muted-foreground">
                  {(task.services ?? []).length} services • {(task.partsUsed ?? []).length} parts
                </span>
              </div>

              <Table>
                <TableHeader className="bg-[#f8f9fa]/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-muted-foreground">ITEM DESCRIPTION</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">CATEGORY</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">QTY</TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">UNIT PRICE</TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(task.services ?? []).length === 0 && (task.partsUsed ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        No services or parts recorded for this job card yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Services Lines */}
                      {(task.services ?? []).map((srv, idx) => {
                        const matched = services.find((s) => s.name === srv.name || s.id === srv.id);
                        const price = typeof srv.price === "number" ? srv.price : (matched?.basePrice ?? 0);
                        return (
                          <TableRow key={`srv-${srv.id ?? idx}`} className="border-border">
                            <TableCell className="align-middle">
                              <p className="text-xs font-bold text-foreground">{srv.name}</p>
                              <p className="text-[10px] text-muted-foreground">Standard workshop service line</p>
                            </TableCell>
                            <TableCell className="align-middle">
                              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                Labor / Service
                              </span>
                            </TableCell>
                            <TableCell className="align-middle text-center text-xs text-foreground">1</TableCell>
                            <TableCell className="align-middle text-right font-mono text-xs text-foreground">
                              ${price.toFixed(2)}
                            </TableCell>
                            <TableCell className="align-middle text-right font-mono text-xs font-bold text-foreground">
                              ${price.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Parts Lines */}
                      {(task.partsUsed ?? []).map((part) => {
                        const qty = part.qty ?? 1;
                        const unitPrice = typeof part.unitPrice === "number" ? part.unitPrice : 0;
                        const subtotal = typeof part.subtotal === "number" ? part.subtotal : unitPrice * qty;
                        return (
                          <TableRow key={`part-${part.id}`} className="border-border">
                            <TableCell className="align-middle">
                              <p className="text-xs font-bold text-foreground">{part.name}</p>
                              <p className="text-[10px] text-muted-foreground">Supplier: {part.supplier ?? "OEM / Certified"}</p>
                            </TableCell>
                            <TableCell className="align-middle">
                              <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                Replacement Part
                              </span>
                            </TableCell>
                            <TableCell className="align-middle text-center text-xs text-foreground">{qty}</TableCell>
                            <TableCell className="align-middle text-right font-mono text-xs text-foreground">
                              ${unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="align-middle text-right font-mono text-xs font-bold text-foreground">
                              ${subtotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right Sidebar Column: Assigned Staff, Quick Actions, Estimate Link, Feedback */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Assigned Workshop Team Card */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Assigned Workshop Team
              </h2>

              <div className="flex flex-col gap-3">
                {/* Advisor */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-[#f8f9fa] p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-primary text-xs">
                      {task.advisor?.name
                        ? task.advisor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                        : "SA"}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{task.advisor?.name ?? "Service Advisor"}</p>
                      <p className="text-[10px] text-muted-foreground">Dedicated Service Advisor</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/chat"
                    className="flex size-8 items-center justify-center rounded-lg border border-border bg-white text-primary shadow-2xs hover:bg-secondary cursor-pointer"
                    title="Send message to advisor"
                  >
                    <MessageSquare className="size-4" />
                  </Link>
                </div>

                {/* Mechanic / Technician */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-[#f8f9fa] p-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700 text-xs">
                    {task.mechanic?.name
                      ? task.mechanic.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                      : "TC"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{task.mechanic?.name ?? "Certified Technician"}</p>
                    <p className="text-[10px] text-muted-foreground">{task.station ?? "Main Workshop Bay"}</p>
                  </div>
                </div>
              </div>

              {/* Chat with Advisor Action Button */}
              <Link
                href="/dashboard/chat"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 transition-colors"
              >
                <MessageSquare className="size-4" />
                Chat with Service Advisor
              </Link>
            </div>

            {/* Linked Estimate Callout (if available) */}
            {estimate && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-amber-700" />
                    <h3 className="text-xs font-bold text-foreground">Estimate #{estimate.id}</h3>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                      estimate.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : estimate.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {estimate.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {estimate.summary || "Additional recommended repairs awaiting review."}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Estimated Cost</p>
                    <p className="font-mono text-sm font-bold text-foreground">${estimate.total.toFixed(2)}</p>
                  </div>
                  <Link
                    href={`/dashboard/estimates/${estimate.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700"
                  >
                    {estimate.status === "pending" ? "Review & Decide" : "View Breakdown"}
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Linked Invoice Callout (if available) */}
            {invoice && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">Invoice #{invoice.id}</h3>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                      invoice.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200",
                    )}
                  >
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Amount</p>
                    <p className="font-mono text-sm font-bold text-foreground">${invoice.total.toFixed(2)}</p>
                  </div>
                  <Link
                    href="/dashboard/payments"
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
                  >
                    {invoice.status === "paid" ? "View Receipt" : "Settle Balance"}
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Completed Service Review Card */}
            {task.status === "completed" && (
              <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {existingRating ? "Your Service Feedback" : "Rate Your Experience"}
                  </h3>
                  <Sparkles className="size-4 text-amber-500" />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center py-1">
                    <Stars rating={score} size="size-7" onSelect={setScore} />
                  </div>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with our technicians and service advisors..."
                    className="min-h-20 resize-none rounded-xl border-border bg-[#f8f9fa] text-xs"
                  />
                  <Button
                    onClick={() => void submitRating()}
                    disabled={submittingRating}
                    className="rounded-xl bg-primary text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 cursor-pointer"
                  >
                    {submittingRating ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
