"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Mail, Phone, Plus, Send, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEstimates, createEstimate } from "@/store/slices/estimatesSlice";
import type { Customer, EstimateItem, JobCard, Vehicle } from "@/types";

const card =
  "flex flex-col gap-[16px] rounded-[8px] border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const fieldLabel = "text-[12px] font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "rounded-[2px] border border-[#e5e7eb] bg-[#f8f9fa] px-[8px] py-[6px] text-[14px] text-[#111827] outline-none";

interface LineItem {
  id: string;
  name: string;
  sub: string;
  category: EstimateItem["category"];
  qty: string;
  unit: string;
  labor: string;
}

function toNumber(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function SendEstimatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchEstimates());
  }, [dispatch]);

  const job: JobCard | null = jobs.find((j) => j.id === "JC-1045") ?? jobs[0] ?? null;
  const vehicle: Vehicle | null = vehicles.find((v) => v.id === job?.vehicleId) ?? null;
  const customer: Customer | null = customers.find((c) => c.id === job?.customerId) ?? null;

  const prefilled = useMemo<LineItem[] | null>(() => {
    if (!job) return null;
    const estimate = estimates.find((e) => e.jobId === job.id);
    if (!estimate) return null;
    return estimate.items.map((item) => ({
      id: item.id,
      name: item.description,
      sub: item.category === "labor" ? "Labor" : item.category === "parts" ? "Part" : "Service",
      category: item.category,
      qty: item.description.includes("x2") ? "2" : "1",
      unit:
        item.category === "labor"
          ? "0"
          : item.description.includes("x2")
            ? (item.amount / 2).toFixed(2)
            : item.amount.toFixed(2),
      labor: item.category === "labor" ? item.amount.toFixed(2) : "0",
    }));
  }, [job, estimates]);

  const [items, setItems] = useState<LineItem[]>([]);
  const [userEdited, setUserEdited] = useState(false);

  const rows = (userEdited ? items : prefilled ?? items).map((it) => ({
    ...it,
    subtotal: toNumber(it.qty) * toNumber(it.unit) + toNumber(it.labor),
  }));

  const updateItem = (id: string, patch: Partial<Omit<LineItem, "id">>) => {
    setUserEdited(true);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addLineItem = () => {
    const base = rows.map(({ id, name, sub, category, qty, unit, labor }) => ({ id, name, sub, category, qty, unit, labor }));
    setUserEdited(true);
    setItems([
      ...base,
      { id: `est-new-${base.length + 1}`, name: "New Line Item", sub: "Part", category: "parts", qty: "1", unit: "0", labor: "0" },
    ]);
  };
  const partsTotal = rows.filter((r) => r.category !== "labor").reduce((sum, r) => sum + r.subtotal, 0);
  const laborTotal = rows.filter((r) => r.category === "labor").reduce((sum, r) => sum + r.subtotal, 0);
  const tax = (partsTotal + laborTotal) * 0.085;
  const total = partsTotal + laborTotal + tax;

  const sendEstimate = async () => {
    if (!job || rows.length === 0) {
      toast.error("Add at least one line item before sending");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        createEstimate({
          jobId: job.id,
          summary: message.trim() || "Estimate ready for review",
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
    <div className="min-h-screen bg-background p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <header className="flex flex-col gap-[8px]">
          <p className="text-[11px] uppercase tracking-[0.55px] text-[#64748b]">
            Estimate Builder
            <span className="mx-[6px] text-[#cbd5e1]">›</span>
            <span className="font-semibold normal-case text-[#111827]">Job Card #{job?.id ?? "JC-1045"}</span>
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-semibold text-[#111827]">Repair Cost Estimate</h1>
            <span className="rounded-[12px] border border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] px-[13px] py-[7px] text-[12px] font-semibold text-[#4caf50]">
              Inspection Complete
            </span>
          </div>
        </header>

        <div className="flex gap-[24px]">
          <section className={`${card} flex-1`}>
            <div className="flex items-start gap-[12px]">
              <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[4px] bg-[#f3f4f5]">
                <Car className="size-[20px] text-[#6b7280]" />
              </span>
              <div className="flex flex-col gap-[4px]">
                <h2 className={fieldLabel}>Vehicle Details</h2>
                <p className="text-[16px] font-semibold text-[#111827]">
                  {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "2023 Ford F-150"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="rounded-[4px] border border-[#d5d6d8] bg-[#e7e8e9] px-[8px] py-[2px] font-mono text-[12px] font-medium text-[#111827]">
                {vehicle?.regNo ?? "A9C-1234"}
              </span>
              <span className="text-[13px] text-[#64748b]">VIN: 1FTFW1ED4PFA...</span>
            </div>
          </section>

          <section className={`${card} flex-1`}>
            <div className="flex items-start gap-[12px]">
              <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[4px] bg-[#f3f4f5]">
                <User className="size-[20px] text-[#6b7280]" />
              </span>
              <div className="flex flex-col gap-[4px]">
                <h2 className={fieldLabel}>Customer</h2>
                <p className="text-[16px] font-semibold text-[#111827]">{customer?.name ?? "John Doe"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-[8px]">
              <p className="flex items-center gap-[8px] text-[14px] text-[#64748b]">
                <Phone className="size-[14px] shrink-0" />
                {customer?.phone ?? "+1 (555) 234-8876"}
              </p>
              <p className="flex items-center gap-[8px] text-[14px] text-[#64748b]">
                <Mail className="size-[14px] shrink-0" />
                {customer?.email ?? "john.doe@example.com"}
              </p>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className={card}>
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#111827]">Line Items</h2>
                <button
                  type="button"
                  className="rounded-[4px] bg-primary/10 px-[12px] py-[6px] text-[12px] font-semibold text-primary"
                >
                  Add Category
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(243,244,245,0.5)]">
                    <th className="py-[9px] pr-[12px] text-left text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                      Service/Part Name
                    </th>
                    <th className="w-[72px] py-[9px] pr-[12px] text-left text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                      Qty/Hrs
                    </th>
                    <th className="py-[9px] pr-[12px] text-left text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                      Unit Price
                    </th>
                    <th className="py-[9px] pr-[12px] text-left text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                      Labor Cost
                    </th>
                    <th className="py-[9px] text-right text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#e5e7eb] last:border-0">
                      <td className="py-[12px] pr-[12px]">
                        <p className="text-[14px] font-medium text-[#111827]">{row.name}</p>
                        <p className="text-[12px] text-[#64748b]">{row.sub}</p>
                      </td>
                      <td className="py-[12px] pr-[12px]">
                        <input
                          value={row.qty}
                          onChange={(e) => updateItem(row.id, { qty: e.target.value })}
                          className={`${inputBase} w-[64px] text-center`}
                        />
                      </td>
                      <td className="py-[12px] pr-[12px]">
                        <div className="relative">
                          <span className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-[13px] text-[#64748b]">
                            $
                          </span>
                          <input
                            value={row.unit}
                            onChange={(e) => updateItem(row.id, { unit: e.target.value })}
                            className={`${inputBase} w-[96px] pl-[20px]`}
                          />
                        </div>
                      </td>
                      <td className="py-[12px] pr-[12px]">
                        <div className="relative">
                          <span className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-[13px] text-[#64748b]">
                            $
                          </span>
                          <input
                            value={row.labor}
                            onChange={(e) => updateItem(row.id, { labor: e.target.value })}
                            className={`${inputBase} w-[96px] pl-[20px]`}
                          />
                        </div>
                      </td>
                      <td className="py-[12px] text-right text-[14px] font-medium text-[#111827]">
                        ${row.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center justify-center gap-[8px] rounded-[4px] border-2 border-dashed border-[#e2e8f0] py-[10px] text-[14px] font-semibold text-primary"
              >
                <Plus className="size-[16px]" />
                Add Line Item
              </button>
            </section>

            <div className="flex gap-[24px]">
              <section className={`${card} flex-1`}>
                <label className={fieldLabel}>Advisor Notes (Internal)</label>
                <textarea
                  placeholder="Add notes for technicians or other advisors..."
                  className="h-[96px] w-full resize-none rounded-[4px] border border-[#e5e7eb] bg-[#f8f9fa] px-[12px] py-[10px] text-[14px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                />
              </section>
              <section className={`${card} flex-1`}>
                <label className={fieldLabel}>Customer Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi John, we've completed the inspection and here is the estimate..."
                  className="h-[96px] w-full resize-none rounded-[4px] border border-[#e5e7eb] bg-[#f8f9fa] px-[12px] py-[10px] text-[14px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                />
              </section>
            </div>
          </div>

          <aside className="col-span-4 overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <header className="bg-[#f8f9fa] px-[17px] py-[14px]">
              <h2 className="text-[16px] font-semibold text-[#111827]">Estimate Summary</h2>
            </header>
            <div className="flex flex-col gap-[14px] px-[17px] py-[17px]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Parts Subtotal</span>
                <span className="text-[14px] font-medium text-[#111827]">${partsTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Labor Subtotal</span>
                <span className="text-[14px] font-medium text-[#111827]">${laborTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Taxes (8.5%)</span>
                <span className="text-[14px] font-medium text-[#111827]">${tax.toFixed(2)}</span>
              </div>
              <div className="h-px w-full bg-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#111827]">Total</span>
                <span className="text-[20px] font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => void sendEstimate()}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-[8px] rounded-[8px] bg-primary px-[16px] py-[11px] text-[13px] font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-60"
              >
                <Send className="size-[15px]" />
                {submitting ? "Sending..." : "Send Estimate to Customer"}
              </button>
              <button
                type="button"
                onClick={() => toast.info("Draft saved (demo)")}
                className="flex w-full items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white px-[16px] py-[11px] text-[13px] font-semibold text-[#111827]"
              >
                Save Draft
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
