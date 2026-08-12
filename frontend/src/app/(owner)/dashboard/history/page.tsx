"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ChevronDown, Download, Search, Star, UserRound, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { cn } from "@/lib/utils";
import { downloadInvoicePdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Invoice, Vehicle } from "@/types";

interface HistoryEntry {
  id: string;
  vehicle: Vehicle;
  invoice: Invoice;
  title: string;
  advisor: string;
  date: string;
  rated: boolean;
  rating?: number;
  ratedAt?: string;
}

function Stars({ rating, size = "h-[19px] w-5" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(size, i <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : i - rating >= 1 ? "text-[#e1e3e4]" : "fill-amber-400/50 text-amber-400")}
        />
      ))}
    </div>
  );
}

export default function ServiceHistoryPage() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((s) => s.invoices.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const entries = useMemo<HistoryEntry[]>(() => {
    return invoices.slice(0, 2).map((invoice, idx) => {
      const vehicle = vehicles.find((v) => v.id === invoice.vehicleId) ?? vehicles[idx];
      if (!vehicle) return null;
      return {
        id: invoice.id,
        vehicle,
        invoice,
        title: (invoice.items[0] as { description?: string } | undefined)?.description ?? `Service ${invoice.id}`,
        advisor: "Sarah Jenkins",
        date: new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        rated: invoice.status === "paid",
        rating: invoice.status === "paid" ? 4 : undefined,
        ratedAt: invoice.payment?.paidAt ? new Date(invoice.payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
      } as HistoryEntry;
    }).filter((e): e is HistoryEntry => e !== null);
  }, [invoices, vehicles]);

  const filtered = entries.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.invoice.id.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicle.regNo.toLowerCase().includes(search.toLowerCase());
    const matchVehicle = vehicleFilter === "All" || `${e.vehicle.make} ${e.vehicle.model}` === vehicleFilter;
    return matchSearch && matchVehicle;
  });

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-[#424753]">
            Dashboard › <span className="font-medium text-foreground">Service History</span>
          </p>
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Service History</h1>
              <p className="text-base text-[#424753]">Review past services, invoices, and provide feedback.</p>
            </div>
            <Link href="/dashboard/appointments/book" className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Wrench className="size-3.5" />
              Book New Service
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="relative w-96">
            <Search className="absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vehicle, Invoice, or Service..."
              className="h-[38px] rounded-xl border-[#c2c6d5] bg-[#f8f9fa] pl-[41px]"
            />
          </div>
          {["Status: All", "Year: 2026", vehicleFilter === "All" ? "Vehicle: All" : `Vehicle: ${vehicleFilter}`].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (i === 2) setVehicleFilter((v) => (v === "All" ? "2023 Ford F-150" : "All"));
              }}
              className="relative h-[38px] rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[41px] text-left text-sm text-foreground"
            >
              {label}
              <ChevronDown className="absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="flex w-[912px] flex-col gap-12 border-l-2 border-[#e2e8f0] pl-[42px] pt-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[51px] top-0 flex size-8 items-center justify-center rounded-xl border-2 bg-background p-0.5 shadow-[0_0_0_4px_white]",
                  entry.rated ? "border-[#e2e8f0]" : "border-primary",
                )}
              >
                <Wrench className={cn("size-[15px]", entry.rated ? "text-[#424753]" : "text-primary")} />
              </span>

              <div className="flex h-[220px] items-start overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                <div className="relative h-full w-48 shrink-0 bg-secondary p-4">
                  <Image src={entry.vehicle.image} alt={entry.vehicle.model} fill className="object-cover opacity-80 mix-blend-multiply" />
                  <span className="absolute top-2 right-2 rounded-xl border border-[#e2e8f0] bg-white/80 px-[9px] py-[5px] text-[11px] font-medium text-foreground backdrop-blur-[2px]">
                    {entry.vehicle.make} {entry.vehicle.model}
                  </span>
                </div>

                <div className="flex h-full flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{entry.title}</h2>
                        <p className="text-sm text-[#424753]">
                          Reg: <span className="font-medium text-foreground">{entry.vehicle.regNo}</span> • Inv:{" "}
                          <span className="font-medium text-foreground">{entry.invoice.id}</span>
                        </p>
                      </div>
                      <span className="flex items-center gap-1 rounded-xl border border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] px-[9px] py-[5px] text-[11px] font-medium text-[#4caf50]">
                        Paid
                      </span>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <span className="flex items-center gap-2 text-sm text-[#424753]">
                        <CalendarDays className="size-[13.5px]" />
                        {entry.date}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-[#424753]">
                        <UserRound className="size-[16.4px]" />
                        {entry.advisor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[rgba(243,244,245,0.5)] px-6 pt-[25px] pb-6 -mx-6 -mb-6">
                    {entry.rated ? (
                      <>
                        <div>
                          <Stars rating={entry.rating ?? 4} />
                          <p className="pt-1 text-[11px] font-medium text-[#424753]">Submitted on {entry.ratedAt}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { downloadInvoicePdf(entry.invoice, entry.vehicle); toast.success("Invoice PDF downloaded"); }} className="gap-2 rounded-xl px-[17px] py-[9px] text-xs font-semibold">
                            <Download className="size-3" />
                            Invoice
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toast.info("Edit review (demo)")} className="rounded-xl px-4 py-[9.5px] text-xs font-semibold text-primary">
                            Edit Review
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-semibold tracking-[0.24px] text-[#424753]">How was your service?</p>
                          <div className="pt-1">
                            <Stars rating={0} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Details (demo)")} className="rounded-xl px-[17px] py-[9px] text-xs font-semibold">
                            View Details
                          </Button>
                          <Button size="sm" onClick={() => toast.success("Thanks for rating!")} className="rounded-xl bg-[#8b5000] px-4 py-[8.5px] text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                            Rate Service
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
