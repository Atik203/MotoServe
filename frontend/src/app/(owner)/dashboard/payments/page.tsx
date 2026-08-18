"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Landmark, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createCheckoutSession, fetchInvoices, payInvoice } from "@/store/slices/invoicesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { downloadInvoicePdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/types";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit Card (Stripe)", icon: CreditCard },
  { id: "mobile", label: "Mobile Banking", icon: Wallet },
  { id: "cash", label: "Cash on Pickup", icon: Landmark },
];

type Tab = "unpaid" | "paid" | "all";

export default function PaymentInvoicePage() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((s) => s.invoices.items);
  const invoicesStatus = useAppSelector((s) => s.invoices.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);
  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);
  const [tab, setTab] = useState<Tab>("unpaid");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchVehicles());
    if (jobs.length === 0) dispatch(fetchJobs());
  }, [dispatch, jobs.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Payment successful — invoice marked as paid");
      dispatch(fetchInvoices());
      window.history.replaceState({}, "", "/dashboard/payments");
    } else if (status === "cancelled") {
      toast.info("Payment cancelled — no charge was made");
      window.history.replaceState({}, "", "/dashboard/payments");
    }
  }, [dispatch]);

  if (invoicesStatus === "loading" || invoicesStatus === "idle") {
    return <div className="bg-background min-h-screen p-8 text-muted-foreground">Loading invoices...</div>;
  }

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );
  const filtered = sorted.filter((i) => (tab === "all" ? true : i.status === tab));
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;
  const paidCount = invoices.length - unpaidCount;

  if (invoices.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div>
            <p className="text-sm font-medium tracking-[0.7px] text-[#444651]">
              Dashboard › Service Details › <span className="font-bold text-primary">Payment</span>
            </p>
            <h1 className="text-[32px] font-bold tracking-[-0.64px] text-foreground">Payment & Invoice</h1>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <ReceiptText className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No invoices yet</p>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Your invoice will appear here automatically once a vehicle service is completed.
            </p>
            <Link
              href="/dashboard/appointments/book"
              className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invoice: Invoice =
    (selectedId ? invoices.find((i) => i.id === selectedId) ?? null : null) ??
    (tab === "unpaid" ? (invoices.find((i) => i.status === "unpaid") ?? null) : null) ??
    sorted[0]!;

  const vehicle = vehicles.find((v) => v.id === invoice.vehicleId) ?? null;
  const job = jobs.find((j) => j.id === invoice.jobId) ?? null;
  const pickupBadge =
    job?.status === "ready"
      ? { label: "Ready for Pickup", className: "border-[rgba(0,74,49,0.2)] bg-[rgba(0,74,49,0.1)] text-[#004a31]" }
      : job?.status === "completed"
        ? { label: "Completed", className: "border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] text-[#4caf50]" }
        : { label: "In Service", className: "border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] text-[#8b5000]" };

  const handlePay = async () => {
    setPaying(true);
    try {
      if (method === "card") {
        const res = await dispatch(createCheckoutSession(invoice.id)).unwrap();
        window.location.href = res.url;
        return;
      }
      await dispatch(payInvoice({ id: invoice.id, method: method as "cash" | "mobile" })).unwrap();
      toast.success("Payment successful — invoice marked as paid");
      dispatch(fetchInvoices());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const serviceTotal = invoice.items
    .filter((i) => i.category === "service")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium tracking-[0.7px] text-[#444651]">
            Dashboard › Service Details › <span className="font-bold text-primary">Payment</span>
          </p>
          <h1 className="text-[32px] font-bold tracking-[-0.64px] text-foreground">Payment & Invoice</h1>
          <p className="pt-1 text-sm text-[#444651]">
            Review all invoices and settle outstanding balances.
          </p>
        </div>

        <div className="flex gap-6">
          <div className="flex w-[350px] shrink-0 flex-col gap-4">
            <div className="flex overflow-hidden rounded-lg border border-[#c5c5d3] bg-white">
              {([["unpaid", `Unpaid (${unpaidCount})`], ["paid", `Paid (${paidCount})`], ["all", "All"]] as [Tab, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTab(key);
                      setSelectedId(null);
                    }}
                    className={cn(
                      "flex-1 px-3 py-2.5 text-xs font-semibold tracking-[0.3px] uppercase",
                      tab === key
                        ? "bg-primary text-white"
                        : "bg-white text-[#444651] hover:bg-[#f3f4f6]",
                    )}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {filtered.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#c5c5d3] bg-white p-6 text-center">
                  <p className="text-sm text-[#444651]">No {tab === "all" ? "" : tab} invoices.</p>
                </div>
              )}
              {filtered.map((inv) => {
                const v = vehicles.find((x) => x.id === inv.vehicleId) ?? null;
                const active = invoice?.id === inv.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedId(inv.id)}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-lg border bg-white p-4 text-left transition-colors",
                      active ? "border-primary bg-[rgba(0,82,204,0.03)]" : "border-[#c5c5d3] hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{inv.id}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                          inv.status === "paid"
                            ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]"
                            : "bg-[rgba(255,193,7,0.1)] text-[#8b5000]",
                        )}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="truncate text-sm text-[#444651]">
                      {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"} · Job #{inv.jobId}
                    </p>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs text-[#727784]">
                        {new Date(inv.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-sm font-semibold text-foreground">${inv.total.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex items-start gap-6 rounded-lg border border-[#c5c5d3] bg-white p-[25px]">
              <div className="aspect-video w-[148px] shrink-0 overflow-hidden rounded bg-[#d3e4fe]">
                <Image src="/images/hero/hero-workshop.png" alt="MotoServe" width={200} height={112} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                    </p>
                    <p className="text-base text-[#444651]">
                      {vehicle ? `Plate: ${vehicle.regNo}` : "—"} • Job Card #{invoice.jobId}
                    </p>
                  </div>
                  <span className={cn("rounded-xl border px-[13px] py-[5px] text-xs font-semibold tracking-[0.6px]", pickupBadge.className)}>
                    {pickupBadge.label}
                  </span>
                </div>
                <p className="flex items-center gap-2 pt-4 text-sm text-[#444651]">
                  <CalendarDays className="size-[13.3px]" />
                  {invoice.status === "paid"
                    ? `Paid ${new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : `Issued ${new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#c5c5d3] bg-white">
              <div className="border-b border-[#c5c5d3] bg-[#f8f9ff] px-6 pt-4 pb-[17px]">
                <h2 className="text-lg text-foreground">Invoice Breakdown</h2>
              </div>
              <div className="flex bg-[#eff4ff]">
                <p className="flex-1 px-6 py-3 text-xs font-semibold tracking-[0.6px] text-[#444651] uppercase">Description</p>
                <p className="w-40 px-6 py-3 text-right text-xs font-semibold tracking-[0.6px] text-[#444651] uppercase">Amount</p>
              </div>
              {invoice.items.map((item, i) => (
                <div key={item.id} className={cn("flex", i > 0 && "border-t border-[rgba(197,197,211,0.5)]")}>
                  <p className="flex-1 px-6 py-4 text-sm text-foreground">
                    {item.description}
                    <span className="ml-2 rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[11px] font-medium text-[#727784] uppercase">
                      {item.category}
                    </span>
                  </p>
                  <p className="w-40 px-6 py-4 text-right text-sm text-foreground">${item.amount.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex border-t border-[rgba(197,197,211,0.5)]">
                <p className="flex-1 px-6 py-4 text-sm text-foreground">Labor Charge</p>
                <p className="w-40 px-6 py-4 text-right text-sm text-foreground">${invoice.laborTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-[rgba(0,82,204,0.2)] bg-[#eff4ff] p-[17px]">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Secure payments</p>
                <p className="text-sm text-[#444651]">
                  Card payments are processed securely via Stripe. Mobile and cash payments are confirmed on pickup.
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-[350px] shrink-0 flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-lg border border-[#c5c5d3] bg-white p-[25px]">
              <h2 className="text-lg text-foreground">Payment Method</h2>
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    disabled={invoice.status === "paid"}
                    className={cn(
                      "flex items-center rounded border p-[17px] text-left transition-colors",
                      invoice.status === "paid" ? "opacity-50" : "",
                      method === m.id
                        ? "border-primary bg-[rgba(0,82,204,0.05)]"
                        : "border-[#c5c5d3] hover:border-primary/50",
                    )}
                  >
                    <span className={cn("size-[18px] shrink-0 rounded-full border", method === m.id ? "border-primary bg-primary" : "border-[#757682] bg-white")} />
                    <span className="flex-1 pl-3 text-sm text-foreground">{m.label}</span>
                    <m.icon className="size-5 text-muted-foreground" />
                  </button>
                ))}
              </div>

              {method === "card" && invoice.status !== "paid" && (
                <div className="flex items-start gap-3 rounded-lg border border-[rgba(0,82,204,0.15)] bg-[rgba(0,82,204,0.05)] p-[17px]">
                  <ShieldCheck className="size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Secure card payment via Stripe</p>
                    <p className="text-sm text-[#444651]">
                      You&apos;ll be redirected to Stripe&apos;s hosted checkout — your card details never touch MotoServe.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-[#c5c5d3] bg-white p-[25px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]">
              <h2 className="border-b border-[#c5c5d3] pb-[13px] text-lg text-foreground">Order Summary</h2>
              <div className="flex flex-col gap-3 pb-2 text-sm">
                <div className="flex items-start justify-between">
                  <span className="text-[#444651]">Services</span>
                  <span className="text-foreground">${serviceTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-[#444651]">Parts</span>
                  <span className="text-foreground">${invoice.partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-[#444651]">Labor</span>
                  <span className="text-foreground">${invoice.laborTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-start justify-between border-t border-[rgba(197,197,211,0.5)] pt-[13px]">
                  <span className="text-[#444651]">Tax</span>
                  <span className="text-foreground">${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-lg font-semibold text-foreground">Total Due</span>
                  <span className="text-lg font-semibold text-primary">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={() => void handlePay()}
                disabled={paying || invoice.status === "paid"}
                className="gap-2 rounded py-3 text-sm font-semibold"
              >
                <CreditCard className="size-[18px]" />
                {paying ? "Processing..." : invoice.status === "paid" ? "Paid" : "Pay Now"}
              </Button>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  downloadInvoicePdf(invoice, vehicles.find((v) => v.id === invoice.vehicleId) ?? null);
                  toast.success("Invoice PDF downloaded");
                }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <ReceiptText className="size-4" />
                Download Invoice PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}