"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchParts } from "@/store/slices/partsSlice";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function stockPill(stock: number) {
  if (stock <= 0) return { label: "Out of Stock", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]" };
  if (stock <= 10) return { label: "Low Stock", className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" };
  return { label: "In Stock", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" };
}

export default function PartsInventoryPage() {
  const dispatch = useAppDispatch();
  const parts = useAppSelector((s) => s.parts.items);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (parts.length === 0) dispatch(fetchParts());
  }, [dispatch, parts.length]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parts;
    return parts.filter(
      (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.supplier.toLowerCase().includes(query),
    );
  }, [parts, search]);

  const lowStock = parts.filter((p) => p.stock <= 10).length;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mechanic › Parts Inventory</p>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Parts Inventory</h1>
            <p className="pt-1 text-sm text-[#424753]">
              {parts.length} parts • {lowStock} low or out of stock
            </p>
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parts..."
              className="h-10 w-64 rounded-lg border-border bg-white pl-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-secondary hover:bg-secondary">
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part Name</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">SKU</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Supplier</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Unit Price</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Stock</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((part) => {
                const pill = stockPill(part.stock);
                return (
                  <TableRow key={part.id} className="border-border">
                    <TableCell className="text-sm font-medium text-foreground">{part.name}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{part.sku}</TableCell>
                    <TableCell className="text-sm text-foreground">{part.supplier}</TableCell>
                    <TableCell className="text-right text-sm text-foreground">${part.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm text-foreground">{part.stock}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", pill.className)}>
                        {pill.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    <Package className="mx-auto mb-2 size-6" />
                    No parts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
