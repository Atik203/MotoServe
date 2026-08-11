"use client";

import { toast } from "sonner";
import { Package, Plus } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { addPartUsed } from "@/store/slices/jobsSlice";
import { Button } from "@/components/ui/button";
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
  const total = parts.reduce((sum, p) => sum + p.subtotal, 0);

  const addPart = () => {
    const demo = { id: `prt-${Date.now()}`, name: "New Part", qty: 1, unitPrice: 0, supplier: "Napa", subtotal: 0 };
    dispatch(addPartUsed({ id: jobId, part: demo }));
    toast.info("Part added — update name, qty and price");
  };

  return (
    <section className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-[8px] text-[16px] font-medium text-foreground">
          <Package className="size-[20px]" />
          Parts Used
        </h2>
        <Button variant="outline" size="sm" onClick={addPart} className="gap-[8px] rounded-[6px]">
          <Plus className="size-[12px]" />
          Add Part
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Part Name</TableHead>
            <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Qty</TableHead>
            <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Unit Price</TableHead>
            <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Supplier</TableHead>
            <TableHead className="text-right text-[12px] font-medium uppercase text-muted-foreground">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id} className="border-border">
              <TableCell className="text-[14px] font-medium text-foreground">{part.name}</TableCell>
              <TableCell className="text-[14px] text-foreground">{part.qty}</TableCell>
              <TableCell className="text-[14px] text-foreground">${part.unitPrice.toFixed(2)}</TableCell>
              <TableCell className="text-[14px] text-foreground">{part.supplier}</TableCell>
              <TableCell className="text-right text-[14px] font-medium text-foreground">
                ${part.subtotal.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          {parts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-[24px] text-center text-[14px] text-muted-foreground">
                No additional parts
              </TableCell>
            </TableRow>
          )}
          {parts.length > 0 && (
            <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
              <TableCell colSpan={4} className="text-[14px] font-semibold text-foreground">
                Total
              </TableCell>
              <TableCell className="text-right text-[14px] font-semibold text-foreground">
                ${total.toFixed(2)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
