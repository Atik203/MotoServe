"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices, deleteService, updateService } from "@/store/slices/servicesSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  if (services.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
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
    { label: "Inactive Services", value: total - active },
    { label: "Categories", value: new Set(services.map((s) => s.category)).size },
  ];

  const handleSave = async (data: {
    name: string;
    category: Service["category"];
    basePrice: number;
    durationMins: number;
    description: string;
    active: boolean;
  }) => {
    if (!editing) return;
    setSaving(true);
    try {
      await dispatch(updateService({ id: editing.id, data })).unwrap();
      toast.success("Service updated");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Service Management</h1>
            <p className="text-sm text-muted-foreground">Manage your workshop&apos;s service offerings and pricing.</p>
          </div>
          <Button asChild size="sm" className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Link href="/admin/services/new">
              <Plus className="size-[13.5px]" />
              New Service
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-[100px] flex-col justify-between rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <span className="text-xs font-semibold tracking-[0.24px] text-[#424753]">{kpi.label}</span>
              <span className="text-4xl font-bold tracking-[-0.72px] text-foreground">{kpi.value}</span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-4">
            <h2 className="text-xl font-semibold text-foreground">Service Catalog</h2>
            <button className="rounded-sm p-1 text-muted-foreground hover:text-foreground" aria-label="Service catalog options">
              <MoreVertical className="size-4" />
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-background hover:bg-background">
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Service Name</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Category</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Base Price</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Est. Duration</TableHead>
                <TableHead className="px-4 py-3 text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Status</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((service) => (
                <TableRow key={service.id} className="group border-t border-border">
                  <TableCell className="px-4 py-[19px]">
                    <p className={cn("line-clamp-2 max-w-[280px] text-sm font-medium text-foreground", !service.active && "line-through")}>
                      {service.name}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-[19px] text-sm text-[#64748b]">{formatCategory(service.category)}</TableCell>
                  <TableCell className="px-4 py-[19px] text-right text-sm text-foreground">
                    ${service.basePrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-[19px] text-right text-sm text-foreground">
                    {formatDuration(service.durationMins)}
                  </TableCell>
                  <TableCell className="px-4 py-[19px]">
                    <span
                      className={cn(
                        "inline-flex rounded-xl px-[11px] py-0.75 text-[11px] font-medium",
                        service.active ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" : "bg-[#e1e3e4] text-[#64748b]",
                      )}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-[19px]">
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label={`Edit ${service.name}`}
                        onClick={() => setEditing(service)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
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
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-[rgba(244,67,54,0.1)] hover:text-[#f44336]"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-background px-4 py-3">
            <span className="text-xs font-medium text-[#424753]">
              {total === 0 ? "0 of 0" : `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex size-7 items-center justify-center rounded border border-[#e2e8f0] bg-white text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="flex size-7 items-center justify-center rounded border border-[#e2e8f0] bg-white text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Edit Service</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Update pricing, duration, or availability.</DialogDescription>
          </DialogHeader>
          <EditServiceForm service={editing} saving={saving} onSave={handleSave} onClose={() => setEditing(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditServiceForm({
  service,
  saving,
  onSave,
  onClose,
}: {
  service: Service | null;
  saving: boolean;
  onSave: (data: { name: string; category: Service["category"]; basePrice: number; durationMins: number; description: string; active: boolean }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState<Service["category"]>(service?.category ?? "maintenance");
  const [basePrice, setBasePrice] = useState(service ? String(service.basePrice) : "");
  const [durationMins, setDurationMins] = useState(service ? String(service.durationMins) : "30");
  const [description, setDescription] = useState(service?.description ?? "");
  const [active, setActive] = useState(service?.active ?? true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !basePrice || Number(basePrice) <= 0) return;
    onSave({
      name: name.trim(),
      category,
      basePrice: Number(basePrice),
      durationMins: Number(durationMins),
      description: description.trim(),
      active,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Service Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Service["category"])}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="maintenance">Maintenance</option>
            <option value="repairs">Repairs</option>
            <option value="inspections">Inspections</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Base Price ($)</Label>
          <Input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Est. Duration (mins)</Label>
          <select
            value={durationMins}
            onChange={(e) => setDurationMins(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="30">30 mins</option>
            <option value="45">45 mins</option>
            <option value="60">1 hr</option>
            <option value="120">2 hrs</option>
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20 rounded-lg border-border bg-white resize-none" />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Label className="text-xs font-semibold text-foreground">Status</Label>
          <Switch checked={active} onCheckedChange={setActive} />
          <span className="text-xs text-muted-foreground">{active ? "Active" : "Inactive"}</span>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="rounded-lg">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
