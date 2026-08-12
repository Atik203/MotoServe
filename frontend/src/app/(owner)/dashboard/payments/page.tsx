"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Info, Landmark, ReceiptText, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInvoices, payInvoice } from "@/store/slices/invoicesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { downloadInvoicePdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit Card (Dummy)", icon: CreditCard },
  { id: "mobile", label: "Mobile Banking", icon: Wallet },
  { id: "cash", label: "Cash on Pickup", icon: Landmark },
];

export default function PaymentInvoicePage() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((s) => s.invoices.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const invoice = invoices.find((i) => i.jobId === "JC-1045") ?? invoices[0] ?? null;

  if (!invoice) {
    return <div className="bg-background min-h-screen p-8 text-muted-foreground">Loading invoice...</div>;
  }

  const handlePay = async () => {
    setPaying(true);
    try {
      await dispatch(payInvoice({ id: invoice.id, method: method as "card" | "cash" | "mobile" })).unwrap();
      toast.success("Payment successful — invoice marked as paid");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div>
          <p className="text-sm font-medium tracking-[0.7px] text-[#444651]">
            Dashboard › Service Details › <span className="font-bold text-primary">Payment</span>
          </p>
          <h1 className="text-[32px] font-bold tracking-[-0.64px] text-foreground">Payment & Invoice</h1>
        </div>

        <div className="flex items-start gap-6">
          <div className="flex w-[774px] shrink-0 flex-col gap-6">
            <div className="flex items-start gap-6 rounded-lg border border-[#c5c5d3] bg-white p-[25px]">
              <div className="aspect-video w-[148px] shrink-0 overflow-hidden rounded bg-[#d3e4fe]">
                <Image src="/images/hero/hero-workshop.png" alt="MotoServe" width={200} height={112} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">2023 Ford F-150</p>
                    <p className="text-base text-[#444651]">Plate: A9C-1234 • Job Card #JC-1045</p>
                  </div>
                  <span className="rounded-xl border border-[rgba(0,74,49,0.2)] bg-[rgba(0,74,49,0.1)] px-[13px] py-[5px] text-xs font-semibold tracking-[0.6px] text-[#004a31]">
                    Ready for Pickup
                  </span>
                </div>
                <p className="flex items-center gap-2 pt-4 text-sm text-[#444651]">
                  <CalendarDays className="size-[13.3px]" />
                  Completed Aug 13, 2026
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#c5c5d3] bg-white">
              <div className="border-b border-[#c5c5d3] bg-[#f8f9ff] px-6 pt-4 pb-[17px]">
                <h2 className="text-lg text-foreground">Invoice Breakdown</h2>
              </div>
              <div className="flex bg-[#eff4ff]">
                <p className="w-[263px] px-6 py-3 text-xs font-semibold tracking-[0.6px] text-[#444651] uppercase">Description</p>
                <p className="w-[174px] px-6 py-3 text-right text-xs font-semibold tracking-[0.6px] text-[#444651] uppercase">Qty / Hrs</p>
                <p className="w-[176px] px-6 py-3 text-right text-xs font-semibold tracking-[0.6px] text-[#444651] uppercase">Rate</p>
                <p className="flex-1 px-6 py-3 text-right text-xs font-semibold tracking-[0.6px] text-[#444651] uppercase">Amount</p>
              </div>
              {invoice.items.map((item, i) => (
                <div key={item.id} className={cn("flex", i > 0 && "border-t border-[rgba(197,197,211,0.5)]")}>
                  <p className="w-[263px] px-6 py-4 text-sm text-foreground">{item.description}</p>
                  <p className="w-[174px] px-6 py-4 text-right text-sm text-foreground">
                    {item.category === "parts" ? 2 : 1}
                  </p>
                  <p className="w-[176px] px-6 py-4 text-right text-sm text-foreground">
                    ${(item.amount / (item.category === "parts" ? 2 : 1)).toFixed(2)}
                  </p>
                  <p className="flex-1 px-6 py-4 text-right text-sm text-foreground">${item.amount.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex border-t border-[rgba(197,197,211,0.5)]">
                <p className="w-[263px] px-6 py-4 text-sm text-foreground">Labor Charge</p>
                <p className="w-[174px] px-6 py-4 text-right text-sm text-foreground">3.5 hrs</p>
                <p className="w-[176px] px-6 py-4 text-right text-sm text-foreground">$60.00/hr</p>
                <p className="flex-1 px-6 py-4 text-right text-sm text-foreground">${invoice.laborTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-[rgba(197,197,211,0.5)] bg-[#eff4ff] p-[17px]">
              <Info className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm text-foreground">Academic project dummy gateway</p>
                <p className="text-sm text-[#444651]">Secure simulation environment. Est time to complete: 2 mins.</p>
              </div>
            </div>
          </div>

          <div className="flex w-[417px] flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-lg border border-[#c5c5d3] bg-white p-[25px]">
              <h2 className="text-lg text-foreground">Payment Method</h2>
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center rounded border p-[17px] text-left transition-colors",
                      method === m.id
                        ? "border-primary bg-[rgba(0,82,204,0.05)]"
                        : "border-[#c5c5d3] hover:border-primary/50",
                    )}
                  >
                    <span className={cn("size-[18px] shrink-0 rounded-full border", method === m.id ? "border-primary bg-primary" : "border-[#757682] bg-white")} />
                    <span className="flex-1 pl-3 text-base text-foreground">{m.label}</span>
                    <m.icon className="size-5 text-muted-foreground" />
                  </button>
                ))}
              </div>

              {method === "card" && (
                <div className="flex flex-col gap-4 pt-2">
                  <div>
                    <Label className="text-xs font-semibold tracking-[0.6px] text-[#444651]">Cardholder Name</Label>
                    <Input defaultValue="John Doe" className="mt-1 rounded border-[#c5c5d3] bg-[#f8f9ff]" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold tracking-[0.6px] text-[#444651]">Card Number</Label>
                    <Input defaultValue="4111 1111 1111 1111" className="mt-1 rounded border-[#c5c5d3] bg-[#f8f9ff]" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-xs font-semibold tracking-[0.6px] text-[#444651]">Expiry Date</Label>
                      <Input defaultValue="12/26" className="mt-1 rounded border-[#c5c5d3] bg-[#f8f9ff]" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs font-semibold tracking-[0.6px] text-[#444651]">CVV</Label>
                      <Input defaultValue="123" className="mt-1 rounded border-[#c5c5d3] bg-[#f8f9ff]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-[#c5c5d3] bg-white p-[25px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]">
              <h2 className="border-b border-[#c5c5d3] pb-[13px] text-lg text-foreground">Order Summary</h2>
              <div className="flex flex-col gap-3 pb-2 text-base">
                <div className="flex items-start justify-between">
                  <span className="text-[#444651]">Services ({invoice.items.filter((i) => i.category === "service").length})</span>
                  <span className="text-foreground">
                    ${invoice.items.filter((i) => i.category === "service").reduce((s, i) => s + i.amount, 0).toFixed(2)}
                  </span>
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
                  <span className="text-xl font-semibold text-foreground">Total Due</span>
                  <span className="text-xl font-semibold text-primary">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={() => void handlePay()}
                disabled={paying || invoice.status === "paid"}
                className="gap-2 rounded py-3 text-base font-semibold"
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
