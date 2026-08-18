"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Car, Mail, Phone, Plus, Send, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEstimates, createEstimate } from "@/store/slices/estimatesSlice";
import type { Customer, Estimate, EstimateItem, JobCard, Vehicle } from "@/types";

const card =
  "flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const fieldLabel = "text-xs font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "rounded-sm border border-[#e5e7eb] bg-[#f8f9fa] px-2 py-1.5 text-sm text-[#111827] outline-none";

interface LineItem {
  id: string;
  name: string;
  sub: string;
  category: EstimateItem["category"];
  qty: string;
  unit: string;
  labor: string;
}

const CATEGORY_META: Record<EstimateItem["category"], { sub: string; unit: "price" | "labor" }> = {
  service: { sub: "Service", unit: "price" },
  parts: { sub: "Part", unit: "price" },
  labor: { sub: "Labor", unit: "labor" },
};

function toNumber(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

let lineSeq = 0;
const newLineId = () => `est-new-${++lineSeq}`;

function lineFromEstimate(item: EstimateItem): LineItem {
  const cat = CATEGORY_META[item.category];
  return {
    id: item.id ?? newLineId(),
    name: item.description,
    sub: cat.sub,
    category: item.category,
    qty: "1",
    unit: cat.unit === "price" ? item.amount.toFixed(2) : "0",
    labor: cat.unit === "labor" ? item.amount.toFixed(2) : "0",
  };
}

interface EditorProps {
  job: JobCard;
  estimates: Estimate[];
}

function LineItemEditor({ job, estimates }: EditorProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [internalNotes, setInternalNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const initialItems = (() => {
    const estimate = estimates.find((e) => e.jobId === job.id || e.jobCardId === job.id);
    if (estimate) return estimate.items.map(lineFromEstimate);
    return job.services.map((s) =>
      lineFromEstimate({ id: newLineId(), description: s.name, category: "service" as const, amount: s.price }),
    );
  })();

  const [items, setItems] = useState<LineItem[]>(initialItems);

  const rows = items.map((it) => ({
    ...it,
    subtotal: toNumber(it.qty) * toNumber(it.unit) + toNumber(it.labor),
  }));

  const updateItem = (id: string, patch: Partial<Omit<LineItem, "id">>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addLineItem = (category: EstimateItem["category"]) => {
    setItems((prev) => [
      ...prev.map((it) => ({ ...it })),
      {
        id: newLineId(),
        name: "New Line Item",
        sub: CATEGORY_META[category].sub,
        category,
        qty: "1",
        unit: "0",
        labor: "0",
      },
    ]);
  };

  const partsTotal = rows.filter((r) => r.category !== "labor").reduce((sum, r) => sum + r.subtotal, 0);
  const laborTotal = rows.filter((r) => r.category === "labor").reduce((sum, r) => sum + r.subtotal, 0);
  const tax = (partsTotal + laborTotal) * 0.085;
  const total = partsTotal + laborTotal + tax;

  const sendEstimate = async () => {
    if (rows.length === 0) {
      toast.error("Add at least one line item before sending");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        createEstimate({
          jobId: job.id,
          summary: message.trim() || "Estimate ready for review",
          internalNotes: internalNotes.trim() || undefined,
          items: rows.map((r) => ({
            description: r.name,
            category: r.category,
            amount: Number(r.subtotal.toFixed(2)),
          })),
        }),
      ).unwrap();
      toast.success("Estimate sent to customer");
      router.push("/advisor");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send estimate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-12 items-start gap-6">
      <div className="col-span-8 flex flex-col gap-6">
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#111827]">Line Items</h2>
            <div className="flex items-center gap-1.5">
              {(Object.keys(CATEGORY_META) as EstimateItem["category"][]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => addLineItem(cat)}
                  className="flex items-center gap-1 rounded bg-primary/10 px-2.5 py-1.5 text-xs font-semibold capitalize text-primary"
                >
                  <Plus className="size-3" />
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(243,244,245,0.5)]">
                <th className="py-[9px] pr-3 text-left text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Service/Part Name
                </th>
                <th className="w-18 py-[9px] pr-3 text-left text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Qty/Hrs
                </th>
                <th className="py-[9px] pr-3 text-left text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Unit Price
                </th>
                <th className="py-[9px] pr-3 text-left text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Labor Cost
                </th>
                <th className="py-[9px] text-right text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#e5e7eb] last:border-0">
                  <td className="py-3 pr-3">
                    <p className="text-sm font-medium text-[#111827]">{row.name}</p>
                    <p className="text-xs text-[#64748b]">{row.sub}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      value={row.qty}
                      onChange={(e) => updateItem(row.id, { qty: e.target.value })}
                      className={`${inputBase} w-16 text-center`}
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-[#64748b]">
                        $
                      </span>
                      <input
                        value={row.unit}
                        onChange={(e) => updateItem(row.id, { unit: e.target.value })}
                        className={`${inputBase} w-24 pl-5`}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-[#64748b]">
                        $
                      </span>
                      <input
                        value={row.labor}
                        onChange={(e) => updateItem(row.id, { labor: e.target.value })}
                        className={`${inputBase} w-24 pl-5`}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-[#111827]">
                    ${row.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-[#9ca3af]">
              Line items load from the job&apos;s services — adjust quantities and prices as needed.
            </p>
          )}

          <button
            type="button"
            onClick={() => addLineItem("service")}
            className="flex items-center justify-center gap-2 rounded border-2 border-dashed border-[#e2e8f0] py-2.5 text-sm font-semibold text-primary"
          >
            <Plus className="size-4" />
            Add Line Item
          </button>
        </section>

        <div className="flex gap-6">
          <section className={`${card} flex-1`}>
            <label className={fieldLabel}>Advisor Notes (Internal)</label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add notes for technicians or other advisors..."
              className="h-24 w-full resize-none rounded border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
            />
          </section>
          <section className={`${card} flex-1`}>
            <label className={fieldLabel}>Customer Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="We've completed the inspection and here is the estimate..."
              className="h-24 w-full resize-none rounded border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
            />
          </section>
        </div>
      </div>

      <aside className="col-span-4 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <header className="bg-[#f8f9fa] px-[17px] py-3.5">
          <h2 className="text-base font-semibold text-[#111827]">Estimate Summary</h2>
        </header>
        <div className="flex flex-col gap-3.5 px-[17px] py-[17px]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6b7280]">Parts Subtotal</span>
            <span className="text-sm font-medium text-[#111827]">${partsTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6b7280]">Labor Subtotal</span>
            <span className="text-sm font-medium text-[#111827]">${laborTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6b7280]">Taxes (8.5%)</span>
            <span className="text-sm font-medium text-[#111827]">${tax.toFixed(2)}</span>
          </div>
          <div className="h-px w-full bg-[#e5e7eb]" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#111827]">Total</span>
            <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={() => void sendEstimate()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-[11px] text-[13px] font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-60"
          >
            <Send className="size-[15px]" />
            {submitting ? "Sending..." : "Send Estimate to Customer"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function SendEstimatePage() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const [jobId, setJobId] = useState(searchParams.get("job") ?? "");

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchEstimates());
  }, [dispatch]);

  const activeJobs = jobs.filter((j) => !["completed", "ready"].includes(j.status));
  const job: JobCard | null = jobId ? jobs.find((j) => j.id === jobId) ?? null : null;
  const vehicle: Vehicle | null = job?.vehicle ?? vehicles.find((v) => v.id === job?.vehicleId) ?? null;
  const customer: Customer | null =
    customers.find((c) => c.id === job?.customerId) ??
    (job?.customer
      ? {
          id: job.customer.id,
          name: job.customer.name,
          phone: "",
          email: "",
          nid: "",
          drivingLicense: "",
          status: "approved",
          verifiedAt: null,
        }
      : null);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.55px] text-[#64748b]">
            Estimate Builder
            <span className="mx-1.5 text-[#cbd5e1]">›</span>
            <span className="font-semibold normal-case text-[#111827]">Job Card #{job?.id ?? "—"}</span>
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#111827]">Repair Cost Estimate</h1>
              <select
                value={job?.id ?? ""}
                onChange={(e) => setJobId(e.target.value)}
                className="rounded border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-foreground outline-none"
              >
                <option value="">Select a job...</option>
                {activeJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} — {j.vehicle ? `${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}` : "Vehicle"} ({j.status})
                  </option>
                ))}
              </select>
            </div>
            <span className="rounded-xl border border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] px-[13px] py-[7px] text-xs font-semibold capitalize text-[#4caf50]">
              {job ? `${job.status.replace("_", " ")}` : "No job selected"}
            </span>
          </div>
        </header>

        <div className="flex gap-6">
          <section className={`${card} flex-1`}>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded bg-[#f3f4f5]">
                <Car className="size-5 text-[#6b7280]" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className={fieldLabel}>Vehicle Details</h2>
                <p className="text-base font-semibold text-[#111827]">
                  {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded border border-[#d5d6d8] bg-[#e7e8e9] px-2 py-0.5 font-mono text-xs font-medium text-[#111827]">
                {vehicle?.regNo ?? "—"}
              </span>
              {vehicle?.vin && (
                <span className="text-[13px] text-[#64748b]">VIN: {vehicle.vin}</span>
              )}
            </div>
          </section>

          <section className={`${card} flex-1`}>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded bg-[#f3f4f5]">
                <User className="size-5 text-[#6b7280]" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className={fieldLabel}>Customer</h2>
                <p className="text-base font-semibold text-[#111827]">{customer?.name ?? "—"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-sm text-[#64748b]">
                <Phone className="size-3.5 shrink-0" />
                {customer?.phone || "—"}
              </p>
              <p className="flex items-center gap-2 text-sm text-[#64748b]">
                <Mail className="size-3.5 shrink-0" />
                {customer?.email || "—"}
              </p>
            </div>
          </section>
        </div>

        {job ? <LineItemEditor key={job.id} job={job} estimates={estimates} /> : (
          <section className={`${card} items-center py-16 text-center`}>
            <p className="text-sm font-semibold text-foreground">Select a job card to build an estimate</p>
            <p className="text-sm text-[#727784]">Only jobs that are in progress can be estimated.</p>
          </section>
        )}
      </div>
    </div>
  );
}