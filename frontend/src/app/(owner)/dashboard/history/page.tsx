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

function Stars({ rating, size = "h-[19px] w-[20px]" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-[4px]">
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
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div>
          <p className="text-[14px] text-[#424753]">
            Dashboard › <span className="font-medium text-foreground">Service History</span>
          </p>
          <div className="flex items-center justify-between pb-[8px]">
            <div>
              <h1 className="text-[36px] font-bold tracking-[-0.72px] text-foreground">Service History</h1>
              <p className="text-[16px] text-[#424753]">Review past services, invoices, and provide feedback.</p>
            </div>
            <Link href="/dashboard/appointments/book" className="flex items-center gap-[8px] rounded-[12px] bg-primary px-[24px] py-[8px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Wrench className="size-[14px]" />
              Book New Service
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="relative w-[384px]">
            <Search className="absolute top-1/2 left-[12px] size-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vehicle, Invoice, or Service..."
              className="h-[38px] rounded-[12px] border-[#c2c6d5] bg-[#f8f9fa] pl-[41px]"
            />
          </div>
          {["Status: All", "Year: 2026", vehicleFilter === "All" ? "Vehicle: All" : `Vehicle: ${vehicleFilter}`].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (i === 2) setVehicleFilter((v) => (v === "All" ? "2023 Ford F-150" : "All"));
              }}
              className="relative h-[38px] rounded-[12px] border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[41px] text-left text-[14px] text-foreground"
            >
              {label}
              <ChevronDown className="absolute top-1/2 right-[12px] size-[12px] -translate-y-1/2 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="flex w-[912px] flex-col gap-[48px] border-l-2 border-[#e2e8f0] pl-[42px] pt-[8px]">
          {filtered.map((entry) => (
            <div key={entry.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[51px] top-0 flex size-[32px] items-center justify-center rounded-[12px] border-2 bg-background p-[2px] shadow-[0_0_0_4px_white]",
                  entry.rated ? "border-[#e2e8f0]" : "border-primary",
                )}
              >
                <Wrench className={cn("size-[15px]", entry.rated ? "text-[#424753]" : "text-primary")} />
              </span>

              <div className="flex h-[220px] items-start overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                <div className="relative h-full w-[192px] shrink-0 bg-secondary p-[16px]">
                  <Image src={entry.vehicle.image} alt={entry.vehicle.model} fill className="object-cover opacity-80 mix-blend-multiply" />
                  <span className="absolute top-[8px] right-[8px] rounded-[12px] border border-[#e2e8f0] bg-white/80 px-[9px] py-[5px] text-[11px] font-medium text-foreground backdrop-blur-[2px]">
                    {entry.vehicle.make} {entry.vehicle.model}
                  </span>
                </div>

                <div className="flex h-full flex-1 flex-col justify-between p-[24px]">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-[20px] font-semibold text-foreground">{entry.title}</h2>
                        <p className="text-[14px] text-[#424753]">
                          Reg: <span className="font-medium text-foreground">{entry.vehicle.regNo}</span> • Inv:{" "}
                          <span className="font-medium text-foreground">{entry.invoice.id}</span>
                        </p>
                      </div>
                      <span className="flex items-center gap-[4px] rounded-[12px] border border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] px-[9px] py-[5px] text-[11px] font-medium text-[#4caf50]">
                        Paid
                      </span>
                    </div>
                    <div className="flex gap-[16px] pt-[8px]">
                      <span className="flex items-center gap-[8px] text-[14px] text-[#424753]">
                        <CalendarDays className="size-[13.5px]" />
                        {entry.date}
                      </span>
                      <span className="flex items-center gap-[8px] text-[14px] text-[#424753]">
                        <UserRound className="size-[16.4px]" />
                        {entry.advisor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[rgba(243,244,245,0.5)] px-[24px] pt-[25px] pb-[24px] -mx-[24px] -mb-[24px]">
                    {entry.rated ? (
                      <>
                        <div>
                          <Stars rating={entry.rating ?? 4} />
                          <p className="pt-[4px] text-[11px] font-medium text-[#424753]">Submitted on {entry.ratedAt}</p>
                        </div>
                        <div className="flex gap-[8px]">
                          <Button variant="outline" size="sm" onClick={() => { downloadInvoicePdf(entry.invoice, entry.vehicle); toast.success("Invoice PDF downloaded"); }} className="gap-[8px] rounded-[12px] px-[17px] py-[9px] text-[12px] font-semibold">
                            <Download className="size-[12px]" />
                            Invoice
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toast.info("Edit review (demo)")} className="rounded-[12px] px-[16px] py-[9.5px] text-[12px] font-semibold text-primary">
                            Edit Review
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-[12px] font-semibold tracking-[0.24px] text-[#424753]">How was your service?</p>
                          <div className="pt-[4px]">
                            <Stars rating={0} />
                          </div>
                        </div>
                        <div className="flex gap-[8px]">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Details (demo)")} className="rounded-[12px] px-[17px] py-[9px] text-[12px] font-semibold">
                            View Details
                          </Button>
                          <Button size="sm" onClick={() => toast.success("Thanks for rating!")} className="rounded-[12px] bg-[#8b5000] px-[16px] py-[8.5px] text-[12px] font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
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
