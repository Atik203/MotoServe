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
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        {jobs.map((job) => {
          const vehicle = vehicles.find((v) => v.id === job.vehicleId);
          if (!vehicle) return null;
          return (
            <div key={job.id} className="flex flex-col gap-[24px]">
              <div className="flex flex-col gap-[8px]">
                <Link href="/dashboard/history" className="flex items-center gap-[4px] text-[12px] font-semibold tracking-[0.24px] text-[#424753] hover:text-primary">
                  <ArrowLeft className="size-[10.7px]" />
                  Back to Service History
                </Link>
                <div className="flex items-center justify-between">
                  <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Service Details: #{job.id}</h1>
                  <span className="flex items-center gap-[6px] rounded-[12px] border border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] px-[13px] py-[5px] text-[12px] font-semibold tracking-[0.24px] text-[#8b5000]">
                    <span className="size-[6px] rounded-full bg-warning" />
                    In Progress - {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 items-start gap-[24px]">
                <div className="col-span-8 flex flex-col gap-[24px]">
                  <div className="flex h-[140px] items-start overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="relative h-full w-[192px] shrink-0 bg-secondary">
                      <Image src={vehicle.image} alt={vehicle.model} fill className="object-cover" />
                      <span className="absolute bottom-[8px] left-[8px] rounded-[2px] border border-[rgba(114,119,132,0.3)] bg-[#191c1d] px-[9px] py-[3px] text-[11px] font-medium text-white">
                        {vehicle.regNo}
                      </span>
                    </div>
                    <div className="flex h-full flex-col gap-[4px] p-[16px]">
                      <p className="text-[20px] font-semibold text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-[14px] text-[#424753]">Enterprise Fleet Unit #442</p>
                      <div className="flex gap-[16px] pt-[12px]">
                        <div>
                          <p className="text-[11px] font-medium text-[#727784]">VIN</p>
                          <p className="text-[14px] font-medium text-foreground">1FTFW1E84NFBXXXXX</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-[#727784]">MILEAGE</p>
                          <p className="text-[14px] font-medium text-foreground">{vehicle.mileage.toLocaleString()} mi</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="flex flex-col gap-[16px] rounded-[12px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <h2 className="flex items-center gap-[8px] text-[16px] font-semibold text-foreground">
                      <Stethoscope className="size-[15px]" />
                      Problem & Inspection
                    </h2>
                    <div className="flex gap-[16px]">
                      <div className="flex-1 rounded-[4px] border border-border bg-secondary p-[9px] pt-[9px] pb-[29px]">
                        <p className="text-[11px] font-medium tracking-[0.55px] text-[#727784] uppercase">Problem Description</p>
                        <p className="pt-[4px] text-[14px] leading-[20px] text-foreground">{job.issues}</p>
                      </div>
                      <div className="flex-1 rounded-[4px] border border-border bg-secondary p-[9px]">
                        <p className="text-[11px] font-medium tracking-[0.55px] text-[#727784] uppercase">Inspection Notes</p>
                        <p className="pt-[4px] text-[14px] leading-[20px] text-foreground">
                          Scanned codes, found P0300 (Random Misfire). Inspected spark plugs and ignition coils. Coil
                          pack on cylinder 3 shows signs of arcing.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="border-b border-border px-[16px] pt-[16px] pb-[17px]">
                      <h2 className="flex items-center gap-[8px] text-[16px] font-semibold text-foreground">
                        <Package className="size-[15px]" />
                        Services & Parts
                      </h2>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border bg-secondary hover:bg-secondary">
                          <TableHead className="px-[16px] py-[12px] text-[11px] font-medium text-[#727784] uppercase">Item Description</TableHead>
                          <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium text-[#727784] uppercase">Qty</TableHead>
                          <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium text-[#727784] uppercase">Unit Price</TableHead>
                          <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium text-[#727784] uppercase">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "Diagnostic Fee", qty: 1, unit: 120.0 },
                          { name: "Replace Ignition Coils", qty: 4, unit: 65.0 },
                          { name: "Spark Plugs (Set)", qty: 1, unit: 45.0 },
                        ].map((item) => (
                          <TableRow key={item.name} className="border-border">
                            <TableCell className="px-[16px] py-[12px] text-[14px] font-medium text-foreground">{item.name}</TableCell>
                            <TableCell className="px-[16px] py-[12px] text-right text-[14px] text-[#424753]">{item.qty}</TableCell>
                            <TableCell className="px-[16px] py-[12px] text-right text-[14px] text-[#424753]">${item.unit.toFixed(2)}</TableCell>
                            <TableCell className="px-[16px] py-[12px] text-right text-[14px] font-medium text-foreground">${(item.qty * item.unit).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        {job.partsUsed.map((p) => (
                          <TableRow key={p.id} className="border-border">
                            <TableCell className="px-[16px] py-[12px] text-[14px] font-medium text-foreground">{p.name}</TableCell>
                            <TableCell className="px-[16px] py-[12px] text-right text-[14px] text-[#424753]">{p.qty}</TableCell>
                            <TableCell className="px-[16px] py-[12px] text-right text-[14px] text-[#424753]">${p.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="px-[16px] py-[12px] text-right text-[14px] font-medium text-foreground">${p.subtotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                </div>

                <div className="col-span-4 flex flex-col gap-[24px]">
                  <section className="flex flex-col gap-[16px] rounded-[12px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <h2 className="text-[14px] font-semibold text-foreground">Assigned Staff</h2>
                    <div className="flex flex-col gap-[16px]">
                      {[
                        { label: "Service Advisor", name: "Sarah Jenkins" },
                        { label: "Lead Mechanic", name: "Mike Ross" },
                      ].map((m) => (
                        <div key={m.name} className="flex items-center gap-[12px]">
                          <span className="flex size-[40px] items-center justify-center rounded-[12px] border border-border bg-secondary text-[12px] font-semibold text-muted-foreground">
                            {m.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                          <div>
                            <p className="text-[11px] text-[#727784]">{m.label}</p>
                            <p className="text-[14px] font-medium text-foreground">{m.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-[12px] rounded-[12px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                    <Link
                      href="/dashboard/estimates/ES-3301"
                      className="flex items-center justify-center gap-[8px] rounded-[4px] bg-primary py-[10px] text-[12px] font-semibold tracking-[0.24px] text-white"
                    >
                      <ClipboardList className="size-[15px]" />
                      Approve Estimate
                    </Link>
                    <Link
                      href="/dashboard/chat"
                      className="flex items-center justify-center gap-[8px] rounded-[4px] border border-primary bg-white py-[11px] text-[12px] font-semibold tracking-[0.24px] text-primary"
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
