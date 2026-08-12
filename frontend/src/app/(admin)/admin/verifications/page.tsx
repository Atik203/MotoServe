"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, Search, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomers, verifyCustomer } from "@/store/slices/customersSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusPill: Record<"pending" | "approved" | "rejected", string> = {
  pending: "bg-[rgba(255,193,7,0.1)] border-[rgba(255,193,7,0.2)] text-warning",
  approved: "bg-[rgba(76,175,80,0.1)] border-[rgba(76,175,80,0.2)] text-[#4caf50]",
  rejected: "bg-[rgba(244,67,54,0.1)] border-[rgba(244,67,54,0.2)] text-[#f44336]",
};

export default function VerificationPage() {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((s) => s.customers.items);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const counts = {
    pending: customers.filter((c) => c.status === "pending").length,
    approved: customers.filter((c) => c.status === "approved").length,
    rejected: customers.filter((c) => c.status === "rejected").length,
    total: customers.length,
  };

  const rows = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.nid.includes(search);
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await dispatch(verifyCustomer({ id, decision: status })).unwrap();
      toast.success(status === "approved" ? "Account approved" : "Account rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const kpis = [
    { label: "Pending Verification", value: counts.pending, icon: ShieldCheck },
    { label: "Approved Accounts", value: counts.approved, icon: UserCheck },
    { label: "Rejected Accounts", value: counts.rejected, icon: UserX },
    { label: "Total Registered", value: counts.total, icon: Users },
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#424753]">
              Dashboard › Customer Management › Vehicle Owner Verification
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Vehicle Owner Verification</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 rounded-lg px-[13px] py-[7px] text-xs font-semibold tracking-[0.24px]" onClick={() => toast.success("List exported (demo)")}>
              <Download className="size-3" />
              Export List
            </Button>
            <Button variant="outline" size="sm" className="gap-1 rounded-lg px-[13px] py-[7px] text-xs font-semibold tracking-[0.24px]" onClick={() => dispatch(fetchCustomers())}>
              <RefreshCw className="size-3" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex h-32 flex-1 flex-col justify-between rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2">
                <kpi.icon className="size-5 text-muted-foreground" />
                <span className="text-xs font-semibold tracking-[0.24px] text-[#424753]">{kpi.label}</span>
              </div>
              <span className="text-4xl font-bold tracking-[-0.72px] text-foreground">{kpi.value}</span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-background px-4 pt-4 pb-[17px]">
            <div className="relative w-96">
              <Search className="absolute top-1/2 left-3 size-[13.5px] -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Name, Phone, Email, ID..."
                className="h-[38px] rounded-lg pl-[41px]"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="h-[38px] rounded-lg border border-[#e2e8f0] bg-white px-[13px] text-sm text-[#424753] outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-background hover:bg-background">
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Owner</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Contact</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Documents</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Reg. Date</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Status</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.id} className="border-t border-border">
                  <TableCell className="px-4 py-[19px]">
                    <div className="flex items-center">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-secondary text-xs font-semibold text-muted-foreground">
                        {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                      <div className="pl-4">
                        <p className="text-xs font-semibold tracking-[0.24px] text-foreground">{customer.name}</p>
                        <p className="text-[11px] font-medium text-[#424753]">{customer.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-[19px]">
                    <p className="text-sm text-foreground">{customer.phone}</p>
                    <p className="text-[11px] font-medium text-[#424753]">{customer.email}</p>
                  </TableCell>
                  <TableCell className="px-4 py-[19px]">
                    <span className="flex gap-1 text-muted-foreground">
                      <ShieldCheck className="size-[15px]" />
                      <ShieldCheck className="size-3" />
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-[19px] text-sm text-[#424753]">
                    {customer.verifiedAt ? new Date(customer.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Pending"}
                  </TableCell>
                  <TableCell className="px-4 py-[19px]">
                    <span className={cn("inline-flex rounded-xl border px-[11px] py-0.75 text-[11px] font-medium capitalize", statusPill[customer.status])}>
                      {customer.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-[19px]">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/verifications/${customer.id}`}
                        className="rounded border border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] px-[13px] py-[5px] text-xs font-semibold tracking-[0.24px] text-primary transition-colors hover:bg-[rgba(0,82,204,0.2)]"
                      >
                        Review
                      </Link>
                      {customer.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => setStatus(customer.id, "approved")}
                          className="rounded border border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] px-[13px] py-[5px] text-xs font-semibold tracking-[0.24px] text-[#4caf50] transition-colors hover:bg-[rgba(76,175,80,0.2)]"
                        >
                          Approve
                        </button>
                      )}
                      {customer.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => setStatus(customer.id, "rejected")}
                          className="rounded border border-[rgba(244,67,54,0.2)] bg-[rgba(244,67,54,0.1)] px-[13px] py-[5px] text-xs font-semibold tracking-[0.24px] text-[#f44336] transition-colors hover:bg-[rgba(244,67,54,0.2)]"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
