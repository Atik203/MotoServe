"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  Stethoscope,
  X,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { decideEstimate, fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import { DetailLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EstimateDetailsAndApprovalPage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const estimates = useAppSelector((s) => s.estimates.items);
  const estimatesStatus = useAppSelector((s) => s.estimates.status);
  const employees = useAppSelector((s) => s.employees.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [deciding, setDeciding] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (estimatesStatus === "idle" || estimates.length === 0) dispatch(fetchEstimates());
    if (employees.length === 0) dispatch(fetchEmployees());
    if (tasks.length === 0) dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, estimatesStatus, estimates.length, employees.length, tasks.length, vehicles.length]);

  const estimate = estimates.find((e) => e.id === params.id) ?? null;

  const task = useMemo(() => {
    if (!estimate) return null;
    return tasks.find((t) => t.id === estimate.taskId) ?? null;
  }, [estimate, tasks]);

  const resolvedVehicle = useMemo(() => {
    if (!estimate) return null;
    if (task?.vehicle) return task.vehicle;
    if (task?.vehicleId) {
      const v = vehicles.find((veh) => veh.id === task.vehicleId);
      if (v) return v;
    }
    if (estimate.taskCard?.vehicle) return estimate.taskCard.vehicle;
    return null;
  }, [estimate, task, vehicles]);

  const advisor = useMemo(() => {
    if (!estimate) return null;
    if (task?.advisor) return task.advisor;
    return employees.find((emp) => emp.id === estimate.advisorId) ?? null;
  }, [estimate, task, employees]);

  const advisorInitials = useMemo(() => {
    return (advisor?.name ?? "Service Advisor")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [advisor]);

  const estimatedCompletion = useMemo(() => {
    if (!task?.expectedDate) return "Standard Turnaround (24-48 hrs)";
    try {
      return new Date(task.expectedDate.replace(" ", "T")).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return task.expectedDate;
    }
  }, [task]);

  const breakdown = useMemo(() => {
    if (!estimate) return { partsTotal: 0, laborTotal: 0, subtotal: 0, tax: 0, total: 0 };
    const partsTotal = estimate.items
      .filter((i) => i.category === "parts")
      .reduce((sum, i) => sum + i.amount, 0);
    const laborTotal = estimate.items
      .filter((i) => i.category !== "parts")
      .reduce((sum, i) => sum + i.amount, 0);
    const subtotal = partsTotal + laborTotal > 0 ? partsTotal + laborTotal : estimate.total / 1.085;
    const tax = estimate.total - subtotal > 0 ? estimate.total - subtotal : subtotal * 0.085;
    return {
      partsTotal,
      laborTotal,
      subtotal,
      tax,
      total: estimate.total,
    };
  }, [estimate]);

  const handleDecide = async (decision: "approved" | "rejected") => {
    if (!estimate) return;
    setDeciding(true);
    try {
      await dispatch(decideEstimate({ id: estimate.id, decision })).unwrap();
      toast.success(
        decision === "approved"
          ? "Estimate approved! Workshop technicians have been notified to proceed."
          : "Estimate declined. Workshop team has paused work on these items.",
      );
      dispatch(fetchEstimates());
      if (decision === "rejected") setRejectModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record your decision");
    } finally {
      setDeciding(false);
    }
  };

  if ((estimatesStatus === "idle" || estimatesStatus === "loading") && !estimate) {
    return <DetailLoading label="Loading estimate details..." />;
  }

  if (!estimate) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Receipt className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Estimate #{params.id} Not Found</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              We couldn&apos;t find this estimate or it may have been cancelled.
            </p>
          </div>
          <Link
            href="/dashboard/estimates"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
          >
            <ArrowLeft className="size-3.5" />
            Back to Estimates
          </Link>
        </div>
      </div>
    );
  }

  const isPending = estimate.status === "pending";
  const isApproved = estimate.status === "approved";
  const isRejected = estimate.status === "rejected";

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <Link href="/dashboard/estimates" className="hover:text-foreground">
              Estimates
            </Link>
            <span>›</span>
            <span className="font-mono text-foreground">#{estimate.id}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Estimate #{estimate.id}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                    isApproved
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isRejected
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-amber-200 bg-amber-50 text-amber-800",
                  )}
                >
                  {isApproved ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : isRejected ? (
                    <XCircle className="size-3.5" />
                  ) : (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-600 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-600" />
                    </span>
                  )}
                  {isPending ? "Awaiting Your Decision" : estimate.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generated for Task Card{" "}
                <Link
                  href={`/dashboard/services/${estimate.taskId}`}
                  className="font-mono font-bold text-primary hover:underline"
                >
                  #{estimate.taskId}
                </Link>{" "}
                • Issued on{" "}
                {new Date(estimate.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {task && (
                <Link
                  href={`/dashboard/services/${task.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary"
                >
                  <Clock className="size-3.5 text-primary" />
                  View Service Tracking
                </Link>
              )}
              <Link
                href="/dashboard/estimates"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-secondary"
              >
                <ArrowLeft className="size-3.5" />
                All Estimates
              </Link>
            </div>
          </div>
        </div>

        {/* Top Status Banner */}
        {isApproved && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 shadow-xs">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="font-bold">Estimate Approved by You</p>
              <p className="text-emerald-800 mt-0.5">
                Our technicians are authorized to proceed with these repairs. You can track real-time progress on the service tracking page.
              </p>
            </div>
            {task && (
              <Link
                href={`/dashboard/services/${task.id}`}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800"
              >
                Track Progress
                <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>
        )}

        {isRejected && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-900 shadow-xs">
            <XCircle className="size-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-bold">Estimate Declined</p>
              <p className="text-red-800 mt-0.5">
                You declined this estimate. No additional charges will be incurred for these items. Work has been paused until further instruction.
              </p>
            </div>
            <Link
              href="/dashboard/chat"
              className="inline-flex items-center gap-1 rounded-xl bg-red-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-red-800"
            >
              Message Advisor
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Vehicle Card, Inspection Findings, Cost Breakdown */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* Vehicle Header Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
              <div className="relative h-40 sm:h-32 sm:w-48 shrink-0 bg-secondary border-b sm:border-b-0 sm:border-r border-border">
                {resolvedVehicle?.image ? (
                  <VehicleImage
                    src={resolvedVehicle.image}
                    alt={resolvedVehicle.model}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Car className="size-10" />
                  </div>
                )}
                {resolvedVehicle?.regNo && (
                  <span className="absolute bottom-2.5 left-2.5 rounded-md border border-[#c2c6d5] bg-[#edf0f8] px-2 py-0.5 font-mono text-[11px] font-bold text-[#2a3042] tracking-wider shadow-2xs">
                    {resolvedVehicle.regNo}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center gap-1.5 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {resolvedVehicle
                        ? `${resolvedVehicle.year} ${resolvedVehicle.make} ${resolvedVehicle.model}`
                        : `Task #${estimate.taskId}`}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {resolvedVehicle?.fuelType ? `${resolvedVehicle.fuelType.toUpperCase()} • ` : ""}
                      {resolvedVehicle?.transmission ?? "Automatic"}
                    </p>
                  </div>
                  {task?.mileage && (
                    <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                      {task.mileage.toLocaleString()} mi
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-1">
                  Intake diagnosis: {task?.issues || "Diagnostic inspection"}
                </p>
              </div>
            </div>

            {/* Diagnostic Findings & Inspection Summary */}
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <Stethoscope className="size-4.5 text-amber-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Diagnostic Findings & Recommendation
                </h2>
              </div>
              <div className="rounded-xl border border-amber-200/80 bg-white p-4">
                <p className="text-xs text-foreground leading-relaxed italic">
                  &ldquo;{estimate.summary || "Inspection revealed necessary repair work to ensure vehicle safety and performance. Please review the detailed cost breakdown below."}&rdquo;
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
                  <span>Inspection by {advisor?.name ?? "Certified Technician"}</span>
                  <span className="font-semibold text-amber-800">Quality Priority: High</span>
                </div>
              </div>
            </div>

            {/* Detailed Itemized Cost Breakdown Table */}
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
              <div className="border-b border-border bg-[#f8f9fa] px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Detailed Cost Breakdown</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {estimate.items.length} item{estimate.items.length === 1 ? "" : "s"} quoted
                </span>
              </div>

              <Table>
                <TableHeader className="bg-[#f8f9fa]/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-muted-foreground">ITEM / SERVICE DESCRIPTION</TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">CATEGORY</TableHead>
                    <TableHead className="text-center text-xs font-bold text-muted-foreground">QTY / HRS</TableHead>
                    <TableHead className="text-right text-xs font-bold text-muted-foreground">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimate.items.map((item) => (
                    <TableRow key={item.id} className="border-border hover:bg-[#f8f9fa]/50">
                      <TableCell className="align-middle">
                        <p className="text-xs font-bold text-foreground">{item.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.category === "parts"
                            ? "Genuine OEM or certified replacement component"
                            : "Certified technician labor & installation"}
                        </p>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize",
                            item.category === "parts"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-blue-200 bg-blue-50 text-blue-700",
                          )}
                        >
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle text-center font-mono text-xs text-foreground">
                        1
                      </TableCell>
                      <TableCell className="align-middle text-right font-mono text-xs font-bold text-foreground">
                        ${item.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Financial Calculation Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#f8f9fa] p-5 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>All parts and labor backed by MotoServe 12-Month / 12,000-Mile Warranty.</span>
                </div>

                <div className="flex w-full sm:w-72 flex-col gap-2 text-xs">
                  {breakdown.partsTotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Parts Subtotal</span>
                      <span className="font-mono font-medium text-foreground">${breakdown.partsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {breakdown.laborTotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Labor / Service Subtotal</span>
                      <span className="font-mono font-medium text-foreground">${breakdown.laborTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net Subtotal</span>
                    <span className="font-mono font-medium text-foreground">${breakdown.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground border-b border-border pb-2">
                    <span>Estimated Sales Tax (8.5%)</span>
                    <span className="font-mono font-medium text-foreground">${breakdown.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-foreground">Grand Total</span>
                    <span className="font-mono text-xl font-bold text-primary">${breakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Advisor Card, Decisions, Help */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Advisor Card */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Your Service Advisor
              </h2>

              <div className="flex items-center gap-3.5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft font-bold text-primary text-sm shadow-2xs">
                  {advisorInitials}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{advisor?.name ?? "Service Advisor"}</p>
                  <p className="text-xs text-muted-foreground">Dedicated Service Advisor</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-[#f8f9fa] p-3.5 text-xs text-muted-foreground leading-relaxed">
                &ldquo;Our technicians completed the diagnostic evaluation. Please review this estimate and choose whether to proceed. You may also contact me directly if you have questions.&rdquo;
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs">
                <Clock className="size-4.5 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Estimated Completion</p>
                  <p className="font-bold text-foreground">{estimatedCompletion}</p>
                </div>
              </div>

              <Link
                href="/dashboard/chat"
                className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-white py-2 text-xs font-semibold text-primary shadow-2xs hover:bg-primary/5 transition-colors"
              >
                <MessageSquare className="size-4" />
                Chat with {advisor?.name?.split(" ")[0] ?? "Advisor"}
              </Link>
            </div>

            {/* Decision Action Card */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {isPending ? "Take Action on this Estimate" : "Decision Status"}
              </h2>

              {isPending ? (
                <div className="flex flex-col gap-2.5 pt-1">
                  <Button
                    onClick={() => void handleDecide("approved")}
                    disabled={deciding}
                    className="h-11 gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-2xs hover:bg-primary/90 cursor-pointer"
                  >
                    <Check className="size-4" />
                    {deciding ? "Processing..." : `Approve Estimate ($${estimate.total.toFixed(2)})`}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={deciding}
                    className="h-10 gap-2 rounded-xl border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                  >
                    <X className="size-4" />
                    Decline / Reject Estimate
                  </Button>

                  <p className="text-center text-[11px] text-muted-foreground pt-1">
                    Approving authorizes MotoServe technicians to order required parts and begin repairs.
                  </p>
                </div>
              ) : isApproved ? (
                <div className="flex flex-col gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="size-4" />
                    Approved on {new Date(estimate.createdAt).toLocaleDateString()}
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    This estimate has been authorized. You can monitor milestone updates via the service tracking dashboard.
                  </p>
                  {task && (
                    <Link
                      href={`/dashboard/services/${task.id}`}
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
                    >
                      Track Active Service
                      <ChevronRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <XCircle className="size-4" />
                    Declined
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    This estimate was declined. If you change your mind, message your advisor to request a revised proposal.
                  </p>
                  <Link
                    href="/dashboard/chat"
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
                  >
                    Discuss with Advisor
                    <MessageSquare className="size-3.5 text-primary" />
                  </Link>
                </div>
              )}
            </div>

            {/* Need Clarification Card */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <HelpCircle className="size-5 shrink-0 text-primary mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-foreground">Need Clarification?</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  Have doubts about the quoted items or timeline? You can chat live with your advisor before deciding.
                </p>
                <Link
                  href="/dashboard/chat"
                  className="mt-2 inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                >
                  Open Live Chat
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
              <AlertTriangle className="size-5" />
              Decline Estimate #{estimate.id}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Declining this estimate will pause work on the quoted repair lines. Your advisor will be notified immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to decline this estimate for <strong>${estimate.total.toFixed(2)}</strong>?
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDecide("rejected")}
              disabled={deciding}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              {deciding ? "Declining..." : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
