"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { addPartUsed } from "@/store/slices/jobsSlice";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PartUsed } from "@/types";

interface PartsUsedTableProps {
  jobId: string;
  parts: PartUsed[];
}

export function PartsUsedTable({ jobId, parts }: PartsUsedTableProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const total = parts.reduce((sum, p) => sum + p.subtotal, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !qty || Number(qty) <= 0 || !unitPrice || Number(unitPrice) < 0 || !supplier.trim()) {
      toast.error("Fill in part name, qty, unit price, and supplier");
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        addPartUsed({
          id: jobId,
          part: {
            name: name.trim(),
            qty: Number(qty),
            unitPrice: Number(unitPrice),
            supplier: supplier.trim(),
          },
        }),
      ).unwrap();
      toast.success("Part added");
      setOpen(false);
      setName("");
      setQty("1");
      setUnitPrice("");
      setSupplier("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add part");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
          <Package className="size-5" />
          Parts Used
        </h2>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 rounded-md">
          <Plus className="size-3" />
          Add Part
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part Name</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Qty</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Unit Price</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Supplier</TableHead>
            <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id} className="border-border">
              <TableCell className="text-sm font-medium text-foreground">{part.name}</TableCell>
              <TableCell className="text-sm text-foreground">{part.qty}</TableCell>
              <TableCell className="text-sm text-foreground">${part.unitPrice.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-foreground">{part.supplier}</TableCell>
              <TableCell className="text-right text-sm font-medium text-foreground">
                ${part.subtotal.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          {parts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                No additional parts
              </TableCell>
            </TableRow>
          )}
          {parts.length > 0 && (
            <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
              <TableCell colSpan={4} className="text-sm font-semibold text-foreground">
                Total
              </TableCell>
              <TableCell className="text-right text-sm font-semibold text-foreground">
                ${total.toFixed(2)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Add Part</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Record a part used on this job.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Part Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brake Pad Set" className="h-10 rounded-lg border-border bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Qty *</Label>
                <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Unit Price ($) *</Label>
                <Input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Supplier *</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Napa" className="h-10 rounded-lg border-border bg-white" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-lg">
                {saving ? "Adding..." : "Add Part"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
