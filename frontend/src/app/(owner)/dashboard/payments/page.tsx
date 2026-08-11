"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CreditCard, Info, Landmark, ReceiptText, Wallet } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInvoices, payInvoice } from "@/store/slices/invoicesSlice";
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
  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const invoice = invoices.find((i) => i.jobId === "JC-1045") ?? invoices[0] ?? null;

  if (!invoice) {
    return <div className="bg-background min-h-screen p-[32px] text-muted-foreground">Loading invoice...</div>;
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
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[32px]">
        <div>
          <p className="text-[14px] font-medium tracking-[0.7px] text-[#444651]">
            Dashboard › Service Details › <span className="font-bold text-primary">Payment</span>
          </p>
          <h1 className="text-[32px] font-bold tracking-[-0.64px] text-foreground">Payment & Invoice</h1>
        </div>

        <div className="flex items-start gap-[24px]">
          <div className="flex w-[774px] shrink-0 flex-col gap-[24px]">
            <div className="flex items-start gap-[24px] rounded-[8px] border border-[#c5c5d3] bg-white p-[25px]">
              <div className="aspect-video w-[148px] shrink-0 overflow-hidden rounded-[4px] bg-[#d3e4fe]">
                <Image src="/images/hero/hero-workshop.png" alt="MotoServe" width={200} height={112} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[24px] font-semibold text-foreground">2023 Ford F-150</p>
                    <p className="text-[16px] text-[#444651]">Plate: A9C-1234 • Job Card #JC-1045</p>
                  </div>
                  <span className="rounded-[12px] border border-[rgba(0,74,49,0.2)] bg-[rgba(0,74,49,0.1)] px-[13px] py-[5px] text-[12px] font-semibold tracking-[0.6px] text-[#004a31]">
                    Ready for Pickup
                  </span>
                </div>
                <p className="flex items-center gap-[8px] pt-[16px] text-[14px] text-[#444651]">
                  <CalendarDays className="size-[13.3px]" />
                  Completed Aug 13, 2026
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[8px] border border-[#c5c5d3] bg-white">
              <div className="border-b border-[#c5c5d3] bg-[#f8f9ff] px-[24px] pt-[16px] pb-[17px]">
                <h2 className="text-[18px] text-foreground">Invoice Breakdown</h2>
              </div>
              <div className="flex bg-[#eff4ff]">
                <p className="w-[263px] px-[24px] py-[12px] text-[12px] font-semibold tracking-[0.6px] text-[#444651] uppercase">Description</p>
                <p className="w-[174px] px-[24px] py-[12px] text-right text-[12px] font-semibold tracking-[0.6px] text-[#444651] uppercase">Qty / Hrs</p>
                <p className="w-[176px] px-[24px] py-[12px] text-right text-[12px] font-semibold tracking-[0.6px] text-[#444651] uppercase">Rate</p>
                <p className="flex-1 px-[24px] py-[12px] text-right text-[12px] font-semibold tracking-[0.6px] text-[#444651] uppercase">Amount</p>
              </div>
              {invoice.items.map((item, i) => (
                <div key={item.id} className={cn("flex", i > 0 && "border-t border-[rgba(197,197,211,0.5)]")}>
                  <p className="w-[263px] px-[24px] py-[16px] text-[14px] text-foreground">{item.description}</p>
                  <p className="w-[174px] px-[24px] py-[16px] text-right text-[14px] text-foreground">
                    {item.category === "parts" ? 2 : 1}
                  </p>
                  <p className="w-[176px] px-[24px] py-[16px] text-right text-[14px] text-foreground">
                    ${(item.amount / (item.category === "parts" ? 2 : 1)).toFixed(2)}
                  </p>
                  <p className="flex-1 px-[24px] py-[16px] text-right text-[14px] text-foreground">${item.amount.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex border-t border-[rgba(197,197,211,0.5)]">
                <p className="w-[263px] px-[24px] py-[16px] text-[14px] text-foreground">Labor Charge</p>
                <p className="w-[174px] px-[24px] py-[16px] text-right text-[14px] text-foreground">3.5 hrs</p>
                <p className="w-[176px] px-[24px] py-[16px] text-right text-[14px] text-foreground">$60.00/hr</p>
                <p className="flex-1 px-[24px] py-[16px] text-right text-[14px] text-foreground">${invoice.laborTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-start gap-[16px] rounded-[8px] border border-[rgba(197,197,211,0.5)] bg-[#eff4ff] p-[17px]">
              <Info className="size-[20px] shrink-0 text-primary" />
              <div>
                <p className="text-[14px] text-foreground">Academic project dummy gateway</p>
                <p className="text-[14px] text-[#444651]">Secure simulation environment. Est time to complete: 2 mins.</p>
              </div>
            </div>
          </div>

          <div className="flex w-[417px] flex-col gap-[24px]">
            <div className="flex flex-col gap-[16px] rounded-[8px] border border-[#c5c5d3] bg-white p-[25px]">
              <h2 className="text-[18px] text-foreground">Payment Method</h2>
              <div className="flex flex-col gap-[12px]">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center rounded-[4px] border p-[17px] text-left transition-colors",
                      method === m.id
                        ? "border-primary bg-[rgba(0,82,204,0.05)]"
                        : "border-[#c5c5d3] hover:border-primary/50",
                    )}
                  >
                    <span className={cn("size-[18px] shrink-0 rounded-full border", method === m.id ? "border-primary bg-primary" : "border-[#757682] bg-white")} />
                    <span className="flex-1 pl-[12px] text-[16px] text-foreground">{m.label}</span>
                    <m.icon className="size-[20px] text-muted-foreground" />
                  </button>
                ))}
              </div>

              {method === "card" && (
                <div className="flex flex-col gap-[16px] pt-[8px]">
                  <div>
                    <Label className="text-[12px] font-semibold tracking-[0.6px] text-[#444651]">Cardholder Name</Label>
                    <Input defaultValue="John Doe" className="mt-[4px] rounded-[4px] border-[#c5c5d3] bg-[#f8f9ff]" />
                  </div>
                  <div>
                    <Label className="text-[12px] font-semibold tracking-[0.6px] text-[#444651]">Card Number</Label>
                    <Input defaultValue="4111 1111 1111 1111" className="mt-[4px] rounded-[4px] border-[#c5c5d3] bg-[#f8f9ff]" />
                  </div>
                  <div className="flex gap-[16px]">
                    <div className="flex-1">
                      <Label className="text-[12px] font-semibold tracking-[0.6px] text-[#444651]">Expiry Date</Label>
                      <Input defaultValue="12/26" className="mt-[4px] rounded-[4px] border-[#c5c5d3] bg-[#f8f9ff]" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[12px] font-semibold tracking-[0.6px] text-[#444651]">CVV</Label>
                      <Input defaultValue="123" className="mt-[4px] rounded-[4px] border-[#c5c5d3] bg-[#f8f9ff]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-[16px] rounded-[8px] border border-[#c5c5d3] bg-white p-[25px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)]">
              <h2 className="border-b border-[#c5c5d3] pb-[13px] text-[18px] text-foreground">Order Summary</h2>
              <div className="flex flex-col gap-[12px] pb-[8px] text-[16px]">
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
                  <span className="text-[20px] font-semibold text-foreground">Total Due</span>
                  <span className="text-[20px] font-semibold text-primary">${invoice.total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={() => void handlePay()}
                disabled={paying || invoice.status === "paid"}
                className="gap-[8px] rounded-[4px] py-[12px] text-[16px] font-semibold"
              >
                <CreditCard className="size-[18px]" />
                {paying ? "Processing..." : invoice.status === "paid" ? "Paid" : "Pay Now"}
              </Button>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Invoice PDF download (demo)");
                }}
                className="flex items-center justify-center gap-[8px] text-[14px] font-semibold text-primary hover:underline"
              >
                <ReceiptText className="size-[16px]" />
                Download Invoice PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
