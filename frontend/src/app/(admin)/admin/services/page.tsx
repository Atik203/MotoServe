"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices, deleteService } from "@/store/slices/servicesSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Service } from "@/types";

const PAGE_SIZE = 5;

const formatDuration = (mins: number) =>
  mins < 60 ? `${mins} mins` : `${mins / 60} hr${mins > 60 ? "s" : ""}`;

const formatCategory = (category: Service["category"]) =>
  category.charAt(0).toUpperCase() + category.slice(1);

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  if (services.length === 0) {
    return (
      <div className="bg-background min-h-screen p-[32px]">
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  const total = services.length;
  const active = services.filter((s) => s.active).length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = services.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const kpis = [
    { label: "Total Services", value: total },
    { label: "Active Services", value: active },
    { label: "Avg. Margin", value: "45%" },
    { label: "Requires Review", value: "4" },
  ];

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Service Management</h1>
            <p className="text-[14px] text-muted-foreground">Manage your workshop&apos;s service offerings and pricing.</p>
          </div>
          <Button asChild size="sm" className="gap-[4px] rounded-[4px] px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Link href="/admin/services/new">
              <Plus className="size-[13.5px]" />
              New Service
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-[24px]">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-[100px] flex-col justify-between rounded-[8px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <span className="text-[12px] font-semibold tracking-[0.24px] text-[#424753]">{kpi.label}</span>
              <span className="text-[36px] font-bold tracking-[-0.72px] text-foreground">{kpi.value}</span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-[16px] py-[16px]">
            <h2 className="text-[20px] font-semibold text-foreground">Service Catalog</h2>
            <button className="rounded-[2px] p-[4px] text-muted-foreground hover:text-foreground" aria-label="Service catalog options">
              <MoreVertical className="size-[16px]" />
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-background hover:bg-background">
                <TableHead className="px-[16px] py-[12px] text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Service Name</TableHead>
                <TableHead className="px-[16px] py-[12px] text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Category</TableHead>
                <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Base Price</TableHead>
                <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Est. Duration</TableHead>
                <TableHead className="px-[16px] py-[12px] text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Status</TableHead>
                <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((service) => (
                <TableRow key={service.id} className="group border-t border-border">
                  <TableCell className="px-[16px] py-[19px]">
                    <p className={cn("line-clamp-2 max-w-[280px] text-[14px] font-medium text-foreground", !service.active && "line-through")}>
                      {service.name}
                    </p>
                  </TableCell>
                  <TableCell className="px-[16px] py-[19px] text-[14px] text-[#64748b]">{formatCategory(service.category)}</TableCell>
                  <TableCell className="px-[16px] py-[19px] text-right text-[14px] text-foreground">
                    ${service.basePrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-[16px] py-[19px] text-right text-[14px] text-foreground">
                    {formatDuration(service.durationMins)}
                  </TableCell>
                  <TableCell className="px-[16px] py-[19px]">
                    <span
                      className={cn(
                        "inline-flex rounded-[12px] px-[11px] py-[3px] text-[11px] font-medium",
                        service.active ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" : "bg-[#e1e3e4] text-[#64748b]",
                      )}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-[16px] py-[19px]">
                    <div className="flex justify-end gap-[8px] opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label={`Edit ${service.name}`}
                        onClick={() => toast.info("Edit service — coming with the backend")}
                        className="rounded-[4px] p-[4px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="size-[14px]" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${service.name}`}
                        onClick={async () => {
                          try {
                            await dispatch(deleteService(service.id)).unwrap();
                            toast.success("Service deleted");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed to delete service");
                          }
                        }}
                        className="rounded-[4px] p-[4px] text-muted-foreground transition-colors hover:bg-[rgba(244,67,54,0.1)] hover:text-[#f44336]"
                      >
                        <Trash2 className="size-[14px]" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-background px-[16px] py-[12px]">
            <span className="text-[12px] font-medium text-[#424753]">
              {total === 0 ? "0 of 0" : `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
            </span>
            <div className="flex gap-[4px]">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex size-[28px] items-center justify-center rounded-[4px] border border-[#e2e8f0] bg-white text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-[14px]" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="flex size-[28px] items-center justify-center rounded-[4px] border border-[#e2e8f0] bg-white text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
