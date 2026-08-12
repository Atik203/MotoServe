"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, ClipboardList, MessageSquare, Package, Stethoscope } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ServiceDetailsPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    if (jobs.length === 0) dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, jobs.length, vehicles.length]);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {jobs.map((job) => {
          const vehicle = vehicles.find((v) => v.id === job.vehicleId);
          if (!vehicle) return null;
          return (
            <div key={job.id} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Link href="/dashboard/history" className="flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-[#424753] hover:text-primary">
                  <ArrowLeft className="size-[10.7px]" />
                  Back to Service History
                </Link>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Service Details: #{job.id}</h1>
                  <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] px-[13px] py-[5px] text-xs font-semibold tracking-[0.24px] text-[#8b5000]">
                    <span className="size-1.5 rounded-full bg-warning" />
                    In Progress - {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 items-start gap-6">
                <div className="col-span-8 flex flex-col gap-6">
                  <div className="flex h-[140px] items-start overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="relative h-full w-48 shrink-0 bg-secondary">
                      <Image src={vehicle.image} alt={vehicle.model} fill className="object-cover" />
                      <span className="absolute bottom-2 left-2 rounded-sm border border-[rgba(114,119,132,0.3)] bg-[#191c1d] px-[9px] py-0.75 text-[11px] font-medium text-white">
                        {vehicle.regNo}
                      </span>
                    </div>
                    <div className="flex h-full flex-col gap-1 p-4">
                      <p className="text-xl font-semibold text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-[#424753]">Enterprise Fleet Unit #442</p>
                      <div className="flex gap-4 pt-3">
                        <div>
                          <p className="text-[11px] font-medium text-[#727784]">VIN</p>
                          <p className="text-sm font-medium text-foreground">1FTFW1E84NFBXXXXX</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-[#727784]">MILEAGE</p>
                          <p className="text-sm font-medium text-foreground">{vehicle.mileage.toLocaleString()} mi</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <Stethoscope className="size-[15px]" />
                      Problem & Inspection
                    </h2>
                    <div className="flex gap-4">
                      <div className="flex-1 rounded border border-border bg-secondary p-[9px] pt-[9px] pb-[29px]">
                        <p className="text-[11px] font-medium tracking-[0.55px] text-[#727784] uppercase">Problem Description</p>
                        <p className="pt-1 text-sm leading-5 text-foreground">{job.issues}</p>
                      </div>
                      <div className="flex-1 rounded border border-border bg-secondary p-[9px]">
                        <p className="text-[11px] font-medium tracking-[0.55px] text-[#727784] uppercase">Inspection Notes</p>
                        <p className="pt-1 text-sm leading-5 text-foreground">
                          Scanned codes, found P0300 (Random Misfire). Inspected spark plugs and ignition coils. Coil
                          pack on cylinder 3 shows signs of arcing.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="border-b border-border px-4 pt-4 pb-[17px]">
                      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Package className="size-[15px]" />
                        Services & Parts
                      </h2>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border bg-secondary hover:bg-secondary">
                          <TableHead className="px-4 py-3 text-[11px] font-medium text-[#727784] uppercase">Item Description</TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-medium text-[#727784] uppercase">Qty</TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-medium text-[#727784] uppercase">Unit Price</TableHead>
                          <TableHead className="px-4 py-3 text-right text-[11px] font-medium text-[#727784] uppercase">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "Diagnostic Fee", qty: 1, unit: 120.0 },
                          { name: "Replace Ignition Coils", qty: 4, unit: 65.0 },
                          { name: "Spark Plugs (Set)", qty: 1, unit: 45.0 },
                        ].map((item) => (
                          <TableRow key={item.name} className="border-border">
                            <TableCell className="px-4 py-3 text-sm font-medium text-foreground">{item.name}</TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm text-[#424753]">{item.qty}</TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm text-[#424753]">${item.unit.toFixed(2)}</TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm font-medium text-foreground">${(item.qty * item.unit).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        {job.partsUsed.map((p) => (
                          <TableRow key={p.id} className="border-border">
                            <TableCell className="px-4 py-3 text-sm font-medium text-foreground">{p.name}</TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm text-[#424753]">{p.qty}</TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm text-[#424753]">${p.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="px-4 py-3 text-right text-sm font-medium text-foreground">${p.subtotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                </div>

                <div className="col-span-4 flex flex-col gap-6">
                  <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <h2 className="text-sm font-semibold text-foreground">Assigned Staff</h2>
                    <div className="flex flex-col gap-4">
                      {[
                        { label: "Service Advisor", name: "Sarah Jenkins" },
                        { label: "Lead Mechanic", name: "Mike Ross" },
                      ].map((m) => (
                        <div key={m.name} className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-secondary text-xs font-semibold text-muted-foreground">
                            {m.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                          <div>
                            <p className="text-[11px] text-[#727784]">{m.label}</p>
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <Link
                      href="/dashboard/estimates/ES-3301"
                      className="flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-xs font-semibold tracking-[0.24px] text-white"
                    >
                      <ClipboardList className="size-[15px]" />
                      Approve Estimate
                    </Link>
                    <Link
                      href="/dashboard/chat"
                      className="flex items-center justify-center gap-2 rounded border border-primary bg-white py-[11px] text-xs font-semibold tracking-[0.24px] text-primary"
                    >
                      <MessageSquare className="size-[15px]" />
                      Chat with Advisor
                    </Link>
                  </section>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
