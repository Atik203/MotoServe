"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Fuel,
  Gauge,
  Layers,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Printer,
  ShieldAlert,
  ShieldCheck,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEstimate, fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { DetailLoading } from "@/components/ui/loading";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { ResolvedAvatar } from "@/components/roles/shared/ResolvedAvatar";
import { Button } from "@/components/ui/button";

const CATEGORY_STYLES: Record<
  string,
  { label: string; badge: string; icon: typeof Wrench }
> = {
  service: {
    label: "Service Package",
    badge: "bg-[#eff6ff] text-[#0052cc] border-[#bfdbfe]",
    icon: Wrench,
  },
  parts: {
    label: "Replacement Part",
    badge: "bg-[#fdf4ff] text-[#9333ea] border-[#f5d0fe]",
    icon: Package,
  },
  labor: {
    label: "Bay Labor",
    badge: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]",
    icon: Layers,
  },
};

export default function AdvisorEstimateDetailPage() {
  const params = useParams<{ id: string }>();
  const estimateId = params?.id;
  const dispatch = useAppDispatch();

  const estimates = useAppSelector((s) => s.estimates.items);
  const estimatesStatus = useAppSelector((s) => s.estimates.status);
  const tasks = useAppSelector((s) => s.tasks.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);

  useEffect(() => {
    if (estimateId) {
      void dispatch(fetchEstimate(estimateId));
    }
    dispatch(fetchEstimates());
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
  }, [dispatch, estimateId]);

  const estimate = useMemo(() => {
    return estimates.find((e) => e.id === estimateId) ?? null;
  }, [estimates, estimateId]);

  const task = useMemo(() => {
    if (!estimate) return null;
    const targetTaskId = estimate.taskId || estimate.taskCardId;
    return tasks.find((t) => t.id === targetTaskId) ?? null;
  }, [estimate, tasks]);

  const vehicle = useMemo(() => {
    if (task?.vehicle) return task.vehicle;
    if (task?.vehicleId) {
      const v = vehicles.find((item) => item.id === task.vehicleId);
      if (v) return v;
    }
    if (estimate?.taskCard?.vehicle) return estimate.taskCard.vehicle;
    return null;
  }, [task, vehicles, estimate]);

  const customer = useMemo(() => {
    if (task?.customer) return task.customer;
    if (estimate?.customerId) {
      const c = customers.find((item) => item.id === estimate.customerId);
      if (c) return c;
    }
    if (estimate?.taskCard?.customer) return estimate.taskCard.customer;
    return null;
  }, [task, customers, estimate]);

  if ((estimatesStatus === "loading" || estimatesStatus === "idle") && !estimate) {
    return <DetailLoading label={`Loading estimate proposal #${estimateId}...`} />;
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb] p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileCheck2 className="size-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#191c1d]">Estimate Not Found</h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Could not locate cost estimate proposal <span className="font-mono font-semibold text-foreground">#{estimateId}</span>.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link href="/advisor/estimates">
            <Button variant="outline" className="rounded-lg">
              <ArrowLeft className="mr-2 size-4" />
              All Estimates
            </Button>
          </Link>
          <Link href="/advisor/estimates/new">
            <Button className="rounded-lg">Create New Estimate</Button>
          </Link>
        </div>
      </div>
    );
  }

  const normalizedStatus = (estimate.status || "pending").toLowerCase();

  const servicesTotal = (estimate.items ?? [])
    .filter((i) => i.category?.toLowerCase() === "service")
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  const partsTotal = (estimate.items ?? [])
    .filter((i) => i.category?.toLowerCase() === "parts")
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  const laborTotal = (estimate.items ?? [])
    .filter((i) => i.category?.toLowerCase() === "labor")
    .reduce((sum, i) => sum + (i.amount ?? 0), 0);

  const subtotal = servicesTotal + partsTotal + laborTotal || estimate.total || 0;
  const tax = subtotal * 0.085;
  const totalWithTax = subtotal + tax;

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
            <Link href="/advisor/estimates" className="hover:text-foreground">
              Estimates
            </Link>
            <span>›</span>
            <span className="text-foreground">#{estimate.id}</span>
          </nav>

          {/* Header Row */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/advisor/estimates"
                className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#424753] hover:bg-[#f3f4f5]"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-[#191c1d]">
                    Estimate #{estimate.id}
                  </h1>
                  {normalizedStatus === "approved" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="size-3.5" />
                      Approved by Customer
                    </span>
                  )}
                  {normalizedStatus === "pending" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      <Clock className="size-3.5" />
                      Awaiting Customer Approval
                    </span>
                  )}
                  {normalizedStatus === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                      <XCircle className="size-3.5" />
                      Declined by Customer
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#64748b]">
                  Created {new Date(estimate.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {task?.id && ` · Linked to Task #${task.id}`}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
                className="gap-2 rounded-lg border-[#e5e7eb] bg-white text-xs font-semibold text-[#191c1d] hover:bg-muted"
              >
                <Printer className="size-3.5" />
                Print / PDF
              </Button>

              {task?.id && (
                <Link href={`/advisor/tasks/${task.id}`}>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-lg border-[#e5e7eb] bg-white text-xs font-semibold text-[#0052cc] hover:bg-[#eff6ff]"
                  >
                    <Wrench className="size-3.5" />
                    View Task Card #{task.id}
                  </Button>
                </Link>
              )}

              {customer?.id && (
                <Link href={`/advisor/chat?customer=${customer.id}`}>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-lg border-[#e5e7eb] bg-white text-xs font-semibold text-[#191c1d] hover:bg-muted"
                  >
                    <MessageSquare className="size-3.5" />
                    Chat with Owner
                  </Button>
                </Link>
              )}

              <Link href={`/advisor/estimates/new?task=${estimate.taskCardId || estimate.taskId}`}>
                <Button className="gap-2 rounded-lg bg-primary text-xs font-semibold text-white shadow-xs hover:bg-primary/90">
                  <Plus className="size-3.5" />
                  New / Revised Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column (8 cols): Vehicle Context, Line Items, Customer Message */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
            {/* Vehicle & Target Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <div className="flex items-center gap-2">
                  <Car className="size-5 text-primary" />
                  <h2 className="text-base font-semibold text-[#191c1d]">Target Vehicle & Intake Record</h2>
                </div>
                {vehicle?.id && (
                  <Link
                    href={`/advisor/vehicles/${vehicle.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Vehicle Profile</span>
                    <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f8fafc]">
                  <VehicleImage
                    src={vehicle?.image || "/images/cars/car-1.png"}
                    alt={vehicle?.model || "Vehicle"}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#191c1d]">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle in Workshop"}
                    </h3>
                    <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-[#1e293b] shadow-xs">
                      {vehicle?.regNo || "NO PLATE"}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                    {vehicle?.vin && (
                      <span>VIN: <strong className="font-mono text-[#191c1d]">{vehicle.vin}</strong></span>
                    )}
                    {task?.mileage && (
                      <span className="flex items-center gap-1">
                        <Gauge className="size-3 text-primary" />
                        Odometer: <strong className="text-[#191c1d]">{task.mileage.toLocaleString()} mi</strong>
                      </span>
                    )}
                    {task?.fuelLevel !== undefined && task?.fuelLevel !== null && (
                      <span className="flex items-center gap-1">
                        <Fuel className="size-3 text-primary" />
                        Fuel: <strong className="text-[#191c1d]">{task.fuelLevel}%</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {task?.issues && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-950">
                  <ShieldAlert className="size-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-bold">Customer Symptoms Logged: </span>
                    <span>{task.issues}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Line Items Table Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#191c1d]">Itemized Cost Breakdown</h2>
                  <p className="text-xs text-[#64748b]">
                    All approved services, certified replacement parts, and technician bay labor.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {(estimate.items ?? []).length} items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f8fafc] text-[#424753]">
                      <th className="py-2.5 pr-3 pl-3 font-semibold">Item Category</th>
                      <th className="py-2.5 pr-3 font-semibold">Description</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Price / Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f3f5]">
                    {(estimate.items ?? []).map((item, idx) => {
                      const cat = (item.category || "service").toLowerCase();
                      const meta = CATEGORY_STYLES[cat] || CATEGORY_STYLES.service;
                      const Icon = meta.icon;
                      return (
                        <tr key={item.id || idx} className="hover:bg-[#fcfdfd]">
                          <td className="py-3 pr-3 pl-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase",
                                meta.badge
                              )}
                            >
                              <Icon className="size-3" />
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="text-xs font-bold text-[#191c1d]">{item.description}</p>
                            <p className="text-[11px] text-[#64748b]">OEM Certified Spec</p>
                          </td>
                          <td className="py-3 pr-3 text-right font-mono text-xs font-bold text-[#191c1d]">
                            ${(item.amount ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {(!estimate.items || estimate.items.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-xs text-[#64748b]">
                          No individual line items recorded. Total flat quote: ${(estimate.total || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subtotals footer */}
              <div className="mt-2 flex flex-wrap items-center justify-between border-t border-[#f1f3f5] pt-4 text-xs">
                <div className="flex items-center gap-4 text-[#64748b]">
                  <span>Services: <strong className="text-[#191c1d]">${servicesTotal.toFixed(2)}</strong></span>
                  <span>Parts: <strong className="text-[#191c1d]">${partsTotal.toFixed(2)}</strong></span>
                  <span>Labor: <strong className="text-[#191c1d]">${laborTotal.toFixed(2)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#64748b]">Net Subtotal:</span>
                  <span className="font-mono text-sm font-bold text-[#191c1d]">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Customer Message & Internal Notes */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-[#191c1d]">Customer Cover Message</h3>
                </div>
                <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs leading-relaxed text-[#191c1d]">
                  {estimate.summary || "No specific customer summary message attached."}
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-[#191c1d]">Advisor Notes (Confidential)</h3>
                </div>
                <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs leading-relaxed text-[#424753]">
                  {estimate.internalNotes || "No internal staff annotations."}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column (4 cols): Customer Profile & Sticky Financial Breakdown */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            {/* Customer Profile Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-[#191c1d]">Client Information</h3>
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
                <ResolvedAvatar
                  src={customer?.avatar}
                  name={customer?.name ?? "CU"}
                  className="size-12 border border-[#e5e7eb]"
                  fallbackClassName="bg-primary/10 font-bold text-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[#191c1d]">{customer?.name ?? "Customer"}</p>
                  <p className="text-xs text-[#64748b]">ID: {customer?.id ?? estimate.customerId}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 text-xs">
                {customer?.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 font-medium text-[#191c1d] hover:border-primary/50"
                  >
                    <Phone className="size-4 text-primary" />
                    <span>{customer.phone}</span>
                  </a>
                )}
                {customer?.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2.5 font-medium text-[#191c1d] hover:border-primary/50"
                  >
                    <Mail className="size-4 text-primary" />
                    <span className="truncate">{customer.email}</span>
                  </a>
                )}
              </div>

              <Link href={`/advisor/chat?customer=${customer?.id || ""}`} className="w-full">
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-lg border-primary/20 bg-[#eff6ff] text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  <MessageSquare className="size-3.5" />
                  Message Customer
                </Button>
              </Link>
            </section>

            {/* Financial Summary Card */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <h3 className="text-sm font-semibold text-[#191c1d]">Financial Summary</h3>
                <span className="rounded bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Official Quote
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Services Subtotal:</span>
                  <span className="font-semibold text-[#191c1d]">${servicesTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Parts & Components:</span>
                  <span className="font-semibold text-[#191c1d]">${partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Technician Labor:</span>
                  <span className="font-semibold text-[#191c1d]">${laborTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Estimated Tax (8.5%):</span>
                  <span className="font-semibold text-[#191c1d]">${tax.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between rounded-lg bg-[#eff6ff] p-3 text-sm font-bold text-[#191c1d]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-xl font-black text-primary">${totalWithTax.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Audit & Timeline Card */}
            <section className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 text-xs shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <h3 className="border-b border-[#f1f3f5] pb-2 font-semibold text-[#191c1d]">Quote History</h3>
              <div className="flex items-center justify-between text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  <span>Date Created:</span>
                </div>
                <span className="font-semibold text-[#191c1d]">
                  {new Date(estimate.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Decision Status:</span>
                </div>
                <span className="font-semibold capitalize text-[#191c1d]">
                  {normalizedStatus}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  <span>Proposal ID:</span>
                </div>
                <span className="font-mono font-semibold text-[#191c1d]">{estimate.id}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
