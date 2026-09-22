"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  ExternalLink,
  FileCheck2,
  Fuel,
  Gauge,
  Layers,
  Mail,
  Package,
  Phone,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEstimates, createEstimate } from "@/store/slices/estimatesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { FormLoading } from "@/components/ui/loading";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { ResolvedAvatar } from "@/components/roles/shared/ResolvedAvatar";
import { Button } from "@/components/ui/button";

interface LineItem {
  id: string;
  name: string;
  category: "service" | "parts" | "labor";
  qty: number;
  unitPrice: number;
  laborRate: number;
}

const CATEGORY_STYLES: Record<
  "service" | "parts" | "labor",
  { label: string; badge: string; icon: typeof Wrench }
> = {
  service: {
    label: "Scheduled Service",
    badge: "bg-[#eff6ff] text-[#0052cc] border-[#bfdbfe]",
    icon: Wrench,
  },
  parts: {
    label: "Parts & Materials",
    badge: "bg-[#fdf4ff] text-[#9333ea] border-[#f5d0fe]",
    icon: Package,
  },
  labor: {
    label: "Mechanical Labor",
    badge: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]",
    icon: Layers,
  },
};

let lineSeq = 0;
const nextId = () => `line-${Date.now()}-${++lineSeq}`;

function SendEstimateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const estimates = useAppSelector((s) => s.estimates.items);

  const initialTaskId = searchParams.get("task") || "";
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId);
  const [customerMessage, setCustomerMessage] = useState(
    "Following our comprehensive mechanical inspection, here is the detailed breakdown of recommended servicing, replacement parts, and labor for your approval."
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("1 - 2 business days");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchEstimates());
    dispatch(fetchServices());
  }, [dispatch]);

  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed");
  }, [tasks]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) ?? null;
  }, [tasks, selectedTaskId]);

  const selectedVehicle = useMemo(() => {
    if (!selectedTask) return null;
    return (
      vehicles.find((v) => v.id === selectedTask.vehicleId) ??
      selectedTask.vehicle ??
      null
    );
  }, [selectedTask, vehicles]);

  const selectedCustomer = useMemo(() => {
    if (!selectedTask) return null;
    const found = customers.find((c) => c.id === selectedTask.customerId);
    return found ? { ...selectedTask.customer, ...found } : selectedTask.customer;
  }, [selectedTask, customers]);

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedTask) {
        setLineItems([]);
        return;
      }

      const existingEstimate = estimates.find(
        (e) => e.taskId === selectedTask.id || e.taskCardId === selectedTask.id
      );

      if (existingEstimate && existingEstimate.items?.length > 0) {
        setLineItems(
          existingEstimate.items.map((it) => ({
            id: it.id || nextId(),
            name: it.description,
            category: (it.category?.toLowerCase() as LineItem["category"]) || "service",
            qty: 1,
            unitPrice: it.category?.toLowerCase() === "labor" ? 0 : it.amount,
            laborRate: it.category?.toLowerCase() === "labor" ? it.amount : 0,
          }))
        );
        if (existingEstimate.summary) setCustomerMessage(existingEstimate.summary);
        if (existingEstimate.internalNotes) setInternalNotes(existingEstimate.internalNotes);
        return;
      }

      const initial: LineItem[] = [];

      if (selectedTask.services && selectedTask.services.length > 0) {
        selectedTask.services.forEach((srv) => {
          initial.push({
            id: nextId(),
            name: srv.name,
            category: "service",
            qty: 1,
            unitPrice: srv.price ?? 59.99,
            laborRate: 0,
          });
        });
      }

      if (selectedTask.partsUsed && selectedTask.partsUsed.length > 0) {
        selectedTask.partsUsed.forEach((pu) => {
          initial.push({
            id: nextId(),
            name: pu.name,
            category: "parts",
            qty: pu.qty || 1,
            unitPrice: pu.unitPrice || pu.subtotal || 35.0,
            laborRate: 0,
          });
        });
      }

      if (initial.length === 0) {
        initial.push({
          id: nextId(),
          name: "Standard Diagnostic & Mechanical Inspection",
          category: "service",
          qty: 1,
          unitPrice: 89.99,
          laborRate: 0,
        });
        initial.push({
          id: nextId(),
          name: "Technician Bay Labor",
          category: "labor",
          qty: 1,
          unitPrice: 0,
          laborRate: 65.0,
        });
      }

      setLineItems(initial);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedTask, estimates]);

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = (category: LineItem["category"]) => {
    const newItem: LineItem = {
      id: nextId(),
      name:
        category === "service"
          ? "General Maintenance Service"
          : category === "parts"
          ? "OEM Replacement Component"
          : "Standard Workshop Labor",
      category,
      qty: 1,
      unitPrice: category === "labor" ? 0 : 45.0,
      laborRate: category === "labor" ? 60.0 : 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const preloadFromServices = () => {
    if (!selectedTask) return;
    const itemsToAdd: LineItem[] = [];
    (selectedTask.services ?? []).forEach((srv) => {
      itemsToAdd.push({
        id: nextId(),
        name: srv.name,
        category: "service",
        qty: 1,
        unitPrice: srv.price ?? 50.0,
        laborRate: 0,
      });
    });
    (selectedTask.partsUsed ?? []).forEach((pu) => {
      itemsToAdd.push({
        id: nextId(),
        name: pu.name,
        category: "parts",
        qty: pu.qty || 1,
        unitPrice: pu.unitPrice || 25.0,
        laborRate: 0,
      });
    });
    if (itemsToAdd.length > 0) {
      setLineItems((prev) => [...prev, ...itemsToAdd]);
      toast.success(`Appended ${itemsToAdd.length} items from task card`);
    } else {
      toast.info("No recorded services or parts on this task card");
    }
  };

  const computedRows = useMemo(() => {
    return lineItems.map((item) => {
      const lineSubtotal =
        item.category === "labor"
          ? item.qty * item.laborRate
          : item.qty * item.unitPrice;
      return {
        ...item,
        subtotal: lineSubtotal,
      };
    });
  }, [lineItems]);

  const servicesTotal = useMemo(() => {
    return computedRows
      .filter((r) => r.category === "service")
      .reduce((sum, r) => sum + r.subtotal, 0);
  }, [computedRows]);

  const partsTotal = useMemo(() => {
    return computedRows
      .filter((r) => r.category === "parts")
      .reduce((sum, r) => sum + r.subtotal, 0);
  }, [computedRows]);

  const laborTotal = useMemo(() => {
    return computedRows
      .filter((r) => r.category === "labor")
      .reduce((sum, r) => sum + r.subtotal, 0);
  }, [computedRows]);

  const netSubtotal = servicesTotal + partsTotal + laborTotal;
  const taxRate = 0.085;
  const estimatedTax = netSubtotal * taxRate;
  const grandTotal = netSubtotal + estimatedTax;

  const handleSendEstimate = async () => {
    if (!selectedTask) {
      toast.error("Please select an active task card");
      return;
    }
    if (computedRows.length === 0) {
      toast.error("Please add at least one line item to the estimate");
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(
        createEstimate({
          taskId: selectedTask.id,
          summary:
            customerMessage.trim() ||
            `Repair cost estimate for ${selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : "vehicle"}`,
          internalNotes: internalNotes.trim() || undefined,
          items: computedRows.map((r) => ({
            description: r.name,
            category: r.category,
            amount: Number(r.subtotal.toFixed(2)),
          })),
        })
      ).unwrap();

      toast.success("Estimate successfully dispatched to customer!");
      if (res?.id) {
        router.push(`/advisor/estimates/${res.id}`);
      } else {
        router.push("/advisor/estimates");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create and dispatch estimate"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if ((tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0) {
    return <FormLoading label="Loading estimate builder..." />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Navigation & Breadcrumbs */}
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
            <span className="text-foreground">New Cost Estimate</span>
          </nav>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/advisor/estimates"
                className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#424753] hover:bg-[#f3f4f5]"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#191c1d]">
                  Send Repair Estimate
                </h1>
                <p className="mt-0.5 text-xs text-[#64748b]">
                  Assemble line items, calculate parts and technician labor, and dispatch
                  formal quote for customer sign-off.
                </p>
              </div>
            </div>

            {/* Task Card Selector */}
            <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-1.5 shadow-xs">
              <span className="pl-2 text-xs font-bold text-[#424753]">Active Task:</span>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="h-8 rounded-lg border-0 bg-[#f8fafc] px-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose active task card --</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} · {t.vehicle ? `${t.vehicle.make} ${t.vehicle.model} (${t.vehicle.regNo})` : "Vehicle"} · {t.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Task Overview Banner */}
        {selectedTask && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Vehicle Card (7 cols) */}
            <div className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)] lg:col-span-7">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#424753]">
                  <Car className="size-4 text-primary" />
                  <span>TARGET VEHICLE SPECIFICATION</span>
                </div>
                <Link
                  href={`/advisor/tasks/${selectedTask.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Task #{selectedTask.id}</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f8fafc]">
                  <VehicleImage
                    src={selectedVehicle?.image || "/images/cars/car-1.png"}
                    alt={selectedVehicle?.model || "Vehicle"}
                    fill
                    className="object-contain p-1.5"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#191c1d]">
                      {selectedVehicle
                        ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                        : "Vehicle in Service"}
                    </h3>
                    <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-[#1e293b] shadow-xs">
                      {selectedVehicle?.regNo || "NO PLATE"}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                    {selectedVehicle?.vin && (
                      <span>
                        VIN: <strong className="font-mono text-[#191c1d]">{selectedVehicle.vin}</strong>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3 text-primary" />
                      Odometer: <strong className="text-[#191c1d]">{selectedTask.mileage ? `${selectedTask.mileage.toLocaleString()} mi` : "—"}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="size-3 text-primary" />
                      Fuel: <strong className="text-[#191c1d]">{selectedTask.fuelLevel !== undefined ? `${selectedTask.fuelLevel}%` : "—"}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {selectedTask.issues && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                  <ShieldAlert className="size-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-bold">Customer Reported Issue: </span>
                    <span>{selectedTask.issues}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Card (5 cols) */}
            <div className="flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)] lg:col-span-5">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#424753]">
                  <User className="size-4 text-primary" />
                  <span>CLIENT CONTACT</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Registered Owner
                </span>
              </div>

              <div className="flex items-center gap-3 py-1">
                <ResolvedAvatar
                  src={selectedCustomer?.avatar}
                  name={selectedCustomer?.name ?? "CL"}
                  className="size-11 border border-[#e5e7eb]"
                  fallbackClassName="bg-primary/10 font-bold text-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#191c1d]">
                    {selectedCustomer?.name || "Client"}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    Account #{selectedCustomer?.id || selectedTask.customerId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2 text-[#191c1d]">
                  <Phone className="size-3.5 text-primary" />
                  <span className="truncate">{selectedCustomer?.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2 text-[#191c1d]">
                  <Mail className="size-3.5 text-primary" />
                  <span className="truncate">{selectedCustomer?.email || "No email"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedTask && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d1d5db] bg-white p-12 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-primary">
              <FileCheck2 className="size-7" />
            </div>
            <h2 className="text-lg font-bold text-[#191c1d]">No Active Task Selected</h2>
            <p className="max-w-md text-xs text-[#64748b]">
              Please pick a task from the dropdown in the header to populate the vehicle,
              client information, and load pre-existing diagnostic checklist items.
            </p>
          </div>
        )}

        {/* Estimate Builder Workspace */}
        {selectedTask && (
          <div className="grid grid-cols-12 items-start gap-6">
            {/* Left Column (8 cols): Line Items + Notes */}
            <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
              {/* Line Items Card */}
              <section className="flex flex-col gap-5 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f3f5] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#191c1d]">Estimate Line Items</h2>
                    <p className="text-xs text-[#64748b]">
                      Define parts, scheduled operations, and billable technician labor hours.
                    </p>
                  </div>

                  {/* Add Line Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={preloadFromServices}
                      className="gap-1.5 rounded-lg border-[#e5e7eb] text-xs font-semibold text-[#424753] hover:bg-[#f3f4f5]"
                    >
                      <Sparkles className="size-3 text-amber-500" />
                      Sync Task Lines
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem("service")}
                      className="gap-1 rounded-lg bg-[#eff6ff] text-xs font-bold text-[#0052cc] hover:bg-[#dbeafe]"
                    >
                      <Plus className="size-3" />
                      + Service
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem("parts")}
                      className="gap-1 rounded-lg bg-[#fdf4ff] text-xs font-bold text-[#9333ea] hover:bg-[#fae8ff]"
                    >
                      <Plus className="size-3" />
                      + Part
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem("labor")}
                      className="gap-1 rounded-lg bg-[#f0fdf4] text-xs font-bold text-[#16a34a] hover:bg-[#dcfce7]"
                    >
                      <Plus className="size-3" />
                      + Labor
                    </Button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] bg-[#f8fafc] text-[#424753]">
                        <th className="py-2.5 pr-3 pl-3 font-semibold">Category</th>
                        <th className="py-2.5 pr-3 font-semibold">Description / Part Details</th>
                        <th className="w-20 py-2.5 pr-3 text-center font-semibold">Qty / Hrs</th>
                        <th className="w-28 py-2.5 pr-3 font-semibold">Rate / Price</th>
                        <th className="w-28 py-2.5 pr-3 text-right font-semibold">Subtotal</th>
                        <th className="w-10 py-2.5 pr-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f3f5]">
                      {computedRows.map((row) => {
                        const style = CATEGORY_STYLES[row.category];
                        const Icon = style.icon;
                        return (
                          <tr key={row.id} className="hover:bg-[#fcfdfd]">
                            {/* Category Pill */}
                            <td className="py-3 pr-3 pl-3 align-top">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase",
                                  style.badge
                                )}
                              >
                                <Icon className="size-3" />
                                {row.category}
                              </span>
                            </td>

                            {/* Description Input */}
                            <td className="py-3 pr-3 align-top">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => updateItem(row.id, { name: e.target.value })}
                                placeholder="Service description or part SKU..."
                                className="h-8 w-full rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-2.5 text-xs font-medium text-[#191c1d] focus:border-primary focus:bg-white focus:outline-none"
                              />
                            </td>

                            {/* Qty Input */}
                            <td className="py-3 pr-3 align-top">
                              <input
                                type="number"
                                min="0.25"
                                step="0.25"
                                value={row.qty}
                                onChange={(e) =>
                                  updateItem(row.id, { qty: Math.max(0, parseFloat(e.target.value) || 0) })
                                }
                                className="h-8 w-full rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-2 text-center text-xs font-bold text-[#191c1d] focus:border-primary focus:bg-white focus:outline-none"
                              />
                            </td>

                            {/* Rate / Price Input */}
                            <td className="py-3 pr-3 align-top">
                              <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-xs font-semibold text-[#64748b]">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.category === "labor" ? row.laborRate : row.unitPrice}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    if (row.category === "labor") {
                                      updateItem(row.id, { laborRate: val });
                                    } else {
                                      updateItem(row.id, { unitPrice: val });
                                    }
                                  }}
                                  className="h-8 w-full rounded-md border border-[#e5e7eb] bg-[#f8fafc] pr-2 pl-5 text-xs font-bold text-[#191c1d] focus:border-primary focus:bg-white focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* Line Subtotal */}
                            <td className="py-3 pr-3 text-right font-mono text-xs font-bold text-[#191c1d] align-middle">
                              ${row.subtotal.toFixed(2)}
                            </td>

                            {/* Delete Button */}
                            <td className="py-3 pr-2 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => removeItem(row.id)}
                                className="inline-flex size-7 items-center justify-center rounded text-[#9ca3af] hover:bg-rose-50 hover:text-rose-600"
                                title="Remove Line"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {computedRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#64748b]">
                            No line items added yet. Click &quot;+ Service&quot;, &quot;+ Part&quot;, or &quot;+ Labor&quot; above to assemble this estimate.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Line Quick Action Bar */}
                <div className="flex items-center justify-between border-t border-[#f1f3f5] pt-3 text-xs text-[#64748b]">
                  <span>{computedRows.length} active items in proposal</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addItem("service")}
                      className="font-semibold text-primary hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </section>

              {/* Communication & Notes Card */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Customer Cover Message */}
                <section className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-[#191c1d]">Customer Cover Message</h3>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    This summary is visible to the customer on their approval portal & email notification.
                  </p>
                  <textarea
                    rows={4}
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder="We've completed the preliminary inspection..."
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs leading-relaxed text-[#191c1d] focus:border-primary focus:bg-white focus:outline-none"
                  />
                </section>

                {/* Advisor Internal Notes */}
                <section className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <h3 className="text-sm font-bold text-[#191c1d]">Advisor Notes (Staff Only)</h3>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    Confidential internal annotations, parts supplier references, or mechanic instructions.
                  </p>
                  <textarea
                    rows={4}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g. Special parts discount applied via NAPA auto supplier #4491..."
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs leading-relaxed text-[#191c1d] focus:border-primary focus:bg-white focus:outline-none"
                  />
                </section>
              </div>
            </div>

            {/* Right Column (4 cols): Sticky Financial Summary & Dispatch */}
            <div className="col-span-12 flex flex-col gap-6 lg:sticky lg:top-8 lg:col-span-4">
              {/* Financial Calculation Card */}
              <section className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                  <h3 className="text-base font-bold text-[#191c1d]">Estimate Summary</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    PROPOSAL
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Scheduled Services:</span>
                    <span className="font-mono font-semibold text-[#191c1d]">
                      ${servicesTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Parts & Materials:</span>
                    <span className="font-mono font-semibold text-[#191c1d]">
                      ${partsTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Mechanic Labor Hours:</span>
                    <span className="font-mono font-semibold text-[#191c1d]">
                      ${laborTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="h-px w-full bg-[#f1f3f5]" />

                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Pre-Tax Subtotal:</span>
                    <span className="font-mono font-bold text-[#191c1d]">
                      ${netSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Sales Tax (8.5%):</span>
                    <span className="font-mono font-semibold text-[#191c1d]">
                      ${estimatedTax.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between rounded-lg bg-[#eff6ff] p-3">
                    <span className="text-sm font-bold text-[#191c1d]">Grand Total</span>
                    <span className="font-mono text-2xl font-black text-primary">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Estimate Terms & Timeline */}
                <div className="flex flex-col gap-2 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs">
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-primary" />
                      Estimated Completion:
                    </span>
                    <input
                      type="text"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      className="h-6 w-32 rounded border border-[#e5e7eb] bg-white px-2 text-right font-semibold text-[#191c1d] focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-primary" />
                      Quote Validity:
                    </span>
                    <span className="font-semibold text-[#191c1d]">30 Days</span>
                  </div>
                </div>

                {/* Dispatch Action */}
                <Button
                  type="button"
                  onClick={() => void handleSendEstimate()}
                  disabled={submitting || computedRows.length === 0}
                  className="h-11 w-full gap-2 rounded-lg bg-primary text-sm font-bold text-white shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  {submitting ? "Transmitting Quote..." : "Send Estimate to Customer"}
                </Button>

                <p className="text-center text-[11px] text-[#9ca3af]">
                  Once sent, the customer will receive an SMS & Email notification to review
                  and approve or decline each recommendation.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdvisorNewEstimatePage() {
  return (
    <Suspense fallback={<FormLoading label="Loading estimate builder..." />}>
      <SendEstimateContent />
    </Suspense>
  );
}