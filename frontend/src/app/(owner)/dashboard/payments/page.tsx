"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Landmark,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createCheckoutSession, fetchInvoices, payInvoice } from "@/store/slices/invoicesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { downloadInvoicePdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Invoice } from "@/types";

type Tab = "all" | "unpaid" | "paid";

export default function PaymentInvoicePage() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((s) => s.invoices.items);
  const invoicesStatus = useAppSelector((s) => s.invoices.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const tasks = useAppSelector((s) => s.tasks.items);

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  // Pay Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<"card" | "mobile" | "cash">("card");
  const [paying, setPaying] = useState(false);

  // View Details Modal State
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchVehicles());
    if (tasks.length === 0) dispatch(fetchTasks());
  }, [dispatch, tasks.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const invoiceId = params.get("invoice_id");
    if (status === "success") {
      toast.success("Payment completed successfully via Stripe! Invoice marked as paid.");
      if (invoiceId) {
        dispatch(payInvoice({ id: invoiceId, method: "card" }));
      }
      dispatch(fetchInvoices());
      window.history.replaceState({}, "", "/dashboard/payments");
    } else if (status === "cancelled") {
      toast.info("Stripe checkout cancelled — no charge was made.");
      window.history.replaceState({}, "", "/dashboard/payments");
    }
  }, [dispatch]);

  const refreshAll = () => {
    dispatch(fetchInvoices());
    dispatch(fetchVehicles());
    toast.success("Invoices refreshed");
  };

  const vehicleById = useCallback(
    (id: string) => vehicles.find((v) => v.id === id),
    [vehicles]
  );

  // Metrics
  const metrics = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === "unpaid");
    const paid = invoices.filter((i) => i.status === "paid");
    const unpaidTotal = unpaid.reduce((sum, i) => sum + i.total, 0);
    const paidTotal = paid.reduce((sum, i) => sum + i.total, 0);

    return {
      totalCount: invoices.length,
      unpaidCount: unpaid.length,
      unpaidTotal,
      paidCount: paid.length,
      paidTotal,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const v = vehicleById(inv.vehicleId);
        const q = search.trim().toLowerCase();

        const matchesSearch =
          !q ||
          inv.id.toLowerCase().includes(q) ||
          inv.taskId.toLowerCase().includes(q) ||
          (v && (v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.regNo.toLowerCase().includes(q)));

        if (!matchesSearch) return false;

        if (tab !== "all" && inv.status !== tab) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }, [invoices, vehicleById, search, tab]);

  const openPayModal = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPayMethod("card");
  };

  const handleExecutePayment = async () => {
    if (!payingInvoice) return;
    setPaying(true);
    try {
      if (payMethod === "card") {
        toast.info("Connecting to Stripe Checkout...");
        const res = await dispatch(createCheckoutSession(payingInvoice.id)).unwrap();
        if (res.url) {
          window.location.href = res.url;
          return;
        }
      }
      await dispatch(
        payInvoice({
          id: payingInvoice.id,
          method: payMethod,
        }),
      ).unwrap();

      toast.success(`Payment of $${payingInvoice.total.toFixed(2)} recorded successfully!`);
      dispatch(fetchInvoices());
      setPayingInvoice(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment processing failed");
    } finally {
      setPaying(false);
    }
  };

  if ((invoicesStatus === "idle" || invoicesStatus === "loading") && invoices.length === 0) {
    return <TableLoading label="Loading invoices" />;
  }

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
            <span className="text-foreground">Payments & Invoices</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments & Invoices</h1>
              <p className="pt-1 text-sm text-muted-foreground">
                Review billing history, download official PDF invoices, and settle balances.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-xs hover:bg-secondary cursor-pointer"
              >
                <RefreshCw className="size-3.5 text-primary" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200 bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Outstanding Balance</p>
              <p className="text-2xl font-bold text-foreground">
                ${metrics.unpaidTotal.toFixed(2)}
              </p>
              <p className="text-[11px] font-semibold text-amber-700 mt-0.5">
                {metrics.unpaidCount} unpaid invoice{metrics.unpaidCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total Paid</p>
              <p className="text-2xl font-bold text-foreground">${metrics.paidTotal.toFixed(2)}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                {metrics.paidCount} settled invoice{metrics.paidCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <ReceiptText className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total Invoiced</p>
              <p className="text-2xl font-bold text-foreground">
                ${(metrics.unpaidTotal + metrics.paidTotal).toFixed(2)}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                {metrics.totalCount} invoices total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <ShieldCheck className="size-5 text-primary" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Payment Gateway</p>
              <p className="text-sm font-bold text-foreground">Stripe Verified</p>
              <p className="text-[11px] font-medium text-emerald-600 mt-0.5">Instant Reconciliation</p>
            </div>
          </div>
        </div>

        {/* Toolbar with Search and Tab Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice ID, task, or vehicle..."
              className="h-9 rounded-xl border-border bg-[#f8f9fa] pl-9 text-xs focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                tab === "all"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              All ({metrics.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("unpaid")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                tab === "unpaid"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              Unpaid ({metrics.unpaidCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("paid")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                tab === "paid"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              Paid ({metrics.paidCount})
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <ReceiptText className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No invoices found</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {search
                ? "Try adjusting your search query."
                : "Invoices will be automatically generated upon completion of workshop jobs."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[140px] text-xs font-bold text-muted-foreground">INVOICE</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">DATE ISSUED</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">VEHICLE</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">BREAKDOWN</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">TOTAL AMOUNT</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const vehicle = vehicleById(inv.vehicleId);
                  const isPaid = inv.status === "paid";

                  return (
                    <TableRow key={inv.id} className="border-border hover:bg-[#f8f9fa]/60 transition-colors">
                      {/* Invoice ID & Job */}
                      <TableCell className="align-middle">
                        <span className="font-mono text-xs font-bold text-primary">{inv.id}</span>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Task #{inv.taskId}</p>
                      </TableCell>

                      {/* Date Issued */}
                      <TableCell className="align-middle">
                        <p className="text-xs font-medium text-foreground">
                          {new Date(inv.issuedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isPaid ? "Paid in full" : "Payment pending"}
                        </p>
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                            {vehicle && (
                              <VehicleImage
                                src={vehicle.image}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                            </p>
                            <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider mt-0.5">
                              {vehicle?.regNo ?? "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Breakdown */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-0.5 max-w-xs text-xs">
                          <span className="font-medium text-foreground line-clamp-1">
                            {inv.items.map((i) => i.description).join(", ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Parts: ${inv.partsTotal.toFixed(2)} • Labor: ${inv.laborTotal.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="align-middle">
                        <p className="text-sm font-bold text-foreground">${inv.total.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Tax: ${inv.tax.toFixed(2)}</p>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200",
                          )}
                        >
                          {isPaid ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          {inv.status}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid ? (
                            <Button
                              size="sm"
                              onClick={() => openPayModal(inv)}
                              className="h-8 gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 cursor-pointer"
                            >
                              <CreditCard className="size-3.5" />
                              Pay Now
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                downloadInvoicePdf(inv, vehicle);
                                toast.success("Invoice PDF downloaded");
                              }}
                              className="h-8 gap-1.5 rounded-xl border-border px-3 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary cursor-pointer"
                            >
                              <Download className="size-3.5 text-primary" />
                              PDF
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingInvoice(inv)}
                            className="h-8 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View Invoice Breakdown"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Seamless Demo Quick-Pay Modal */}
      <Dialog open={payingInvoice !== null} onOpenChange={(open) => !open && setPayingInvoice(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                Pay Invoice #{payingInvoice?.id}
              </DialogTitle>
              <span className="font-mono text-lg font-bold text-primary">
                ${payingInvoice?.total.toFixed(2)}
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {payingInvoice ? (
                <>
                  Task Card #{payingInvoice.taskId} •{" "}
                  {vehicleById(payingInvoice.vehicleId)?.make} {vehicleById(payingInvoice.vehicleId)?.model} (
                  {vehicleById(payingInvoice.vehicleId)?.regNo})
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod("card")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                  payMethod === "card"
                    ? "border-primary bg-primary/5 text-primary shadow-2xs"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <CreditCard className="size-4" />
                Stripe Card
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("mobile")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                  payMethod === "mobile"
                    ? "border-primary bg-primary/5 text-primary shadow-2xs"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <Wallet className="size-4" />
                Mobile Pay
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("cash")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                  payMethod === "cash"
                    ? "border-primary bg-primary/5 text-primary shadow-2xs"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <Landmark className="size-4" />
                Pay on Pickup
              </button>
            </div>

            {payMethod === "card" ? (
              <div className="flex flex-col gap-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
                      <CreditCard className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Stripe Hosted Checkout</p>
                      <p className="text-[11px] text-muted-foreground">Official secure external payment page</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="size-3" />
                    256-bit Encrypted
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-white p-3 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border">
                    <span>Payable Amount</span>
                    <span className="font-mono text-base font-bold text-foreground">
                      ${payingInvoice?.total.toFixed(2)}
                    </span>
                  </div>
                  <p className="pt-2 text-[11px] text-muted-foreground leading-relaxed">
                    You will be redirected to the secure Stripe Checkout page to complete your payment with Credit/Debit Card, Apple Pay, or Google Pay. You will return automatically upon payment.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
                  <span>Supported methods:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="rounded bg-white px-1.5 py-0.5 border border-border text-[10px]">VISA</span>
                    <span className="rounded bg-white px-1.5 py-0.5 border border-border text-[10px]">Mastercard</span>
                    <span className="rounded bg-white px-1.5 py-0.5 border border-border text-[10px]">AMEX</span>
                    <span className="rounded bg-white px-1.5 py-0.5 border border-border text-[10px]">Apple Pay</span>
                  </div>
                </div>
              </div>
            ) : payMethod === "mobile" ? (
              <div className="rounded-2xl border border-border bg-[#f8f9fa] p-4 text-center text-xs text-muted-foreground">
                <Wallet className="mx-auto size-6 text-primary mb-2" />
                <p className="font-semibold text-foreground">Instant Mobile Payment</p>
                <p className="text-[11px] mt-1">
                  Clicking pay will immediately record your mobile payment and settle invoice #{payingInvoice?.id}.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-[#f8f9fa] p-4 text-center text-xs text-muted-foreground">
                <Landmark className="mx-auto size-6 text-primary mb-2" />
                <p className="font-semibold text-foreground">Pay on Pickup</p>
                <p className="text-[11px] mt-1">
                  Pay in cash or card at the service counter when picking up your vehicle from the bay.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setPayingInvoice(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecutePayment}
              disabled={paying}
              className="rounded-xl bg-primary px-6 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 cursor-pointer"
            >
              {paying ? (
                "Connecting..."
              ) : payMethod === "card" ? (
                <span className="flex items-center gap-1.5">
                  Proceed to Stripe Checkout (${payingInvoice?.total.toFixed(2)})
                  <ArrowUpRight className="size-4" />
                </span>
              ) : (
                `Confirm Payment ($${payingInvoice?.total.toFixed(2)})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Breakdown Details Modal */}
      <Dialog open={viewingInvoice !== null} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                Invoice #{viewingInvoice?.id}
              </DialogTitle>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  viewingInvoice?.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200",
                )}
              >
                {viewingInvoice?.status}
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Issued on{" "}
              {viewingInvoice
                ? new Date(viewingInvoice.issuedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}{" "}
              • Task #{viewingInvoice?.taskId}
            </DialogDescription>
          </DialogHeader>

          {viewingInvoice && (
            <div className="flex flex-col gap-4 py-2 text-xs">
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="bg-[#f8f9fa] px-4 py-2 font-bold text-muted-foreground border-b border-border flex justify-between">
                  <span>ITEM DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>
                <div className="divide-y divide-border">
                  {viewingInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between px-4 py-2.5">
                      <div>
                        <span className="font-semibold text-foreground">{item.description}</span>
                        <span className="ml-2 rounded bg-secondary px-1.5 py-0.2 text-[10px] text-muted-foreground uppercase">
                          {item.category}
                        </span>
                      </div>
                      <span className="font-mono font-semibold">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="font-semibold text-foreground">Workshop Labor Total</span>
                    <span className="font-mono font-semibold">${viewingInvoice.laborTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="font-semibold text-foreground">Estimated Tax (8.5%)</span>
                    <span className="font-mono font-semibold">${viewingInvoice.tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between bg-blue-50/60 px-4 py-3 border-t border-border">
                  <span className="text-sm font-bold text-foreground">Total Invoiced</span>
                  <span className="text-base font-bold text-primary font-mono">
                    ${viewingInvoice.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {viewingInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadInvoicePdf(viewingInvoice, vehicleById(viewingInvoice.vehicleId));
                  toast.success("Invoice PDF downloaded");
                }}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <Download className="size-3.5" />
                Download PDF
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setViewingInvoice(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}