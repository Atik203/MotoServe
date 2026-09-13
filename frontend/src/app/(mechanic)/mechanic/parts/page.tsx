"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Package, Search, SendHorizonal, Loader2, AlertCircle, Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchParts } from "@/store/slices/partsSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchPartRequests, submitPartRequest } from "@/store/slices/partRequestsSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableLoading } from "@/components/ui/loading";
import { toast } from "sonner";
import type { Part } from "@/types";

function stockPill(stock: number) {
  if (stock <= 0) return { label: "Out of Stock", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]" };
  if (stock <= 10) return { label: "Low Stock", className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" };
  return { label: "In Stock", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" };
}

function statusConfig(status: string) {
  if (status === "approved") return { label: "Approved", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]", icon: Check };
  if (status === "fulfilled") return { label: "Fulfilled", className: "bg-[rgba(0,82,204,0.1)] text-primary", icon: Package };
  if (status === "rejected") return { label: "Rejected", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]", icon: AlertCircle };
  return { label: "Pending", className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]", icon: Clock };
}

export default function PartsRequestPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const parts = useAppSelector((s) => s.parts.items);
  const partsStatus = useAppSelector((s) => s.parts.status);
  const tasks = useAppSelector((s) => s.tasks.items);
  const partRequests = useAppSelector((s) => s.partRequests.items);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Part | null>(null);
  const [qty, setQty] = useState(1);
  const [taskCardId, setTaskCardId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (parts.length === 0) dispatch(fetchParts());
    dispatch(fetchTasks());
    dispatch(fetchPartRequests());
  }, [dispatch, parts.length]);

  const myActiveTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !["completed"].includes(t.status) &&
          (user
            ? t.mechanicId === user.id ||
              t.mechanicIds?.includes(user.id) ||
              t.mechanics?.some((m) => m.id === user.id)
            : true),
      ),
    [tasks, user],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q),
    );
  }, [parts, search]);

  const lowStockCount = parts.filter((p) => p.stock <= 10).length;

  const handleRequest = (part: Part) => {
    setSelected(part);
    setQty(1);
    setNotes("");
    setTaskCardId(myActiveTasks[0]?.id ?? "");
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (qty < 1) { toast.error("Quantity must be at least 1"); return; }
    setSubmitting(true);
    try {
      await dispatch(
        submitPartRequest({
          partName: selected.name,
          partId: selected.id,
          qty,
          taskCardId: taskCardId || undefined,
          notes: notes || undefined,
        }),
      ).unwrap();
      toast.success(`Request for ${selected.name} submitted`);
      setSelected(null);
      setQty(1);
      setNotes("");
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if ((partsStatus === "idle" || partsStatus === "loading") && parts.length === 0) {
    return <TableLoading label="Loading parts catalog" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mechanic › Parts Request</p>
            <h1 className="text-[28px] font-bold tracking-[-0.56px] text-foreground">Parts Request</h1>
            <p className="pt-1 text-sm text-[#64748b]">
              {parts.length} parts in catalog • {lowStockCount} low or out of stock
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className={cn("flex flex-col gap-4", selected ? "col-span-7" : "col-span-12")}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Parts Catalog</p>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parts..."
                  className="h-9 w-60 rounded-lg border-border bg-white pl-9 text-sm shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-[#f9fafb] hover:bg-[#f9fafb]">
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part Name</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">SKU</TableHead>
                    {!selected && (
                      <TableHead className="text-xs font-medium uppercase text-muted-foreground">Supplier</TableHead>
                    )}
                    <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Unit Price</TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Stock</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((part) => {
                    const pill = stockPill(part.stock);
                    const isSelected = selected?.id === part.id;
                    return (
                      <TableRow
                        key={part.id}
                        className={cn(
                          "border-border transition-colors",
                          isSelected && "bg-primary-soft",
                        )}
                      >
                        <TableCell className="text-sm font-medium text-foreground">{part.name}</TableCell>
                        <TableCell className="font-mono text-xs text-[#64748b]">{part.sku}</TableCell>
                        {!selected && (
                          <TableCell className="text-sm text-foreground">{part.supplier}</TableCell>
                        )}
                        <TableCell className="text-right text-sm text-foreground">${part.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm text-foreground">{part.stock}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", pill.className)}>
                            {pill.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => isSelected ? setSelected(null) : handleRequest(part)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                              isSelected
                                ? "bg-primary text-white"
                                : "border border-border bg-white text-foreground hover:border-primary hover:text-primary",
                            )}
                          >
                            {isSelected ? "Selected ✓" : "+ Request"}
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow className="border-border">
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        <Package className="mx-auto mb-2 size-6" />
                        No parts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {selected && (
            <div className="col-span-5 flex flex-col gap-4">
              <div className="flex flex-col gap-4 rounded-[8px] border border-primary/30 bg-white p-6 shadow-[0_2px_8px_rgba(0,82,204,0.1)]">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <SendHorizonal className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Request Part</h2>
                </div>

                <div className="rounded-lg bg-primary-soft px-4 py-3">
                  <p className="text-xs text-muted-foreground">Selected Part</p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">{selected.name}</p>
                  <p className="text-xs text-[#64748b]">SKU: {selected.sku} • ${selected.unitPrice.toFixed(2)}/unit</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
                  <Input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="h-9 rounded-lg border-border bg-[#f9fafb] text-sm"
                  />
                </div>

                {myActiveTasks.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Linked Task (optional)</label>
                    <select
                      value={taskCardId}
                      onChange={(e) => setTaskCardId(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-[#f9fafb] px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">— None —</option>
                      {myActiveTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} — {t.services[0]?.name ?? t.issues}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes for the advisor..."
                    className="w-full rounded-lg border border-border bg-[#f9fafb] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                    className="flex-1 rounded-lg border-border text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-primary text-sm text-white hover:bg-primary/90"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Request"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {partRequests.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">My Requests</h2>
            <div className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-[#f9fafb] hover:bg-[#f9fafb]">
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Qty</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Task</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Notes</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Submitted</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partRequests.map((req) => {
                    const cfg = statusConfig(req.status);
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={req.id} className="border-border">
                        <TableCell className="text-sm font-medium text-foreground">{req.partName}</TableCell>
                        <TableCell className="text-sm text-foreground">{req.qty}</TableCell>
                        <TableCell className="font-mono text-xs text-[#64748b]">{req.taskCardId ?? "—"}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-[#64748b]">{req.notes ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", cfg.className)}>
                            <Icon className="size-3" />
                            {cfg.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
