"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, CalendarDays, Download, FileText, Mail, MapPin, Phone, ShieldCheck, User as UserIcon, UserX, UserCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomers, fetchDocumentUrl, verifyCustomer } from "@/store/slices/customersSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const statusPill: Record<"pending" | "approved" | "rejected", string> = {
  pending: "bg-[rgba(255,193,7,0.1)] border-[rgba(255,193,7,0.2)] text-warning",
  approved: "bg-[rgba(76,175,80,0.1)] border-[rgba(76,175,80,0.2)] text-[#4caf50]",
  rejected: "bg-[rgba(244,67,54,0.1)] border-[rgba(244,67,54,0.2)] text-[#f44336]",
};

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="size-3.5 text-primary" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">{label}</span>
        <span className="text-sm font-medium text-foreground">{value || "—"}</span>
      </div>
    </div>
  );
}

export default function VerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const customers = useAppSelector((s) => s.customers.items);
  const [docs, setDocs] = useState<{ key: string; url: string; kind: "nid" | "license"; name: string }[]>([]);

  useEffect(() => {
    if (customers.length === 0) dispatch(fetchCustomers());
  }, [dispatch, customers.length]);

  const customer = customers.find((c) => c.id === params.id) ?? null;

  useEffect(() => {
    const keys = [...(customer?.documents ?? []).map((d) => ({ key: d.key, kind: d.kind, name: d.name }))];
    if (customer?.documentUrl) keys.push({ key: customer.documentUrl, kind: "nid", name: "document" });
    if (keys.length === 0) return;
    let cancelled = false;
    Promise.all(
      keys.map(({ key, kind, name }) =>
        dispatch(fetchDocumentUrl(key))
          .unwrap()
          .then((res) => ({ key, kind, name, url: res.url }))
          .catch(() => null),
      ),
    ).then((resolved) => {
      if (!cancelled) setDocs(resolved.filter((r): r is { key: string; url: string; kind: "nid" | "license"; name: string } => r !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, customer?.documentUrl, customer?.documents]);

  const decide = async (decision: "approved" | "rejected") => {
    if (!customer) return;
    try {
      await dispatch(verifyCustomer({ id: customer.id, decision })).unwrap();
      toast.success(decision === "approved" ? "Account approved" : "Account rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (!customer) {
    return <div className="bg-background min-h-screen p-8 text-muted-foreground">Loading owner details...</div>;
  }

  const fullAddress = [customer.street, customer.city, customer.district, customer.zip, customer.country].filter(Boolean).join(", ");

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <Link href="/admin/verifications" className="flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-[#424753] hover:text-primary">
              <ArrowLeft className="size-[10.7px]" />
              Back to Verification Queue
            </Link>
            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">{customer.name}</h1>
              <span className={cn("inline-flex rounded-xl border px-[13px] py-1 text-xs font-semibold capitalize", statusPill[customer.status])}>
                {customer.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Registered {customer.joinedAt ? new Date(customer.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={customer.status !== "pending"}
              onClick={() => void decide("rejected")}
              className="gap-1 rounded border-[rgba(244,67,54,0.3)] px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-[#f44336] hover:bg-[rgba(244,67,54,0.05)]"
            >
              <UserX className="size-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              disabled={customer.status !== "pending"}
              onClick={() => void decide("approved")}
              className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px]"
            >
              <UserCheck className="size-3.5" />
              Approve Account
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5 flex flex-col gap-6">
            <section className="rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base font-semibold text-foreground">
                <UserIcon className="size-4 text-primary" />
                Owner Profile
              </h2>
              <div className="flex flex-col gap-4 pt-4">
                <InfoRow icon={Mail} label="Email" value={customer.email} />
                <InfoRow icon={Phone} label="Phone" value={customer.phone} />
                <InfoRow icon={ShieldCheck} label="National ID (NID)" value={customer.nid} />
                <InfoRow icon={ShieldCheck} label="Driving License" value={customer.drivingLicense} />
                <InfoRow
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                />
                <InfoRow icon={UserIcon} label="Gender" value={customer.gender ?? ""} />
                <InfoRow icon={Briefcase} label="Occupation" value={customer.occupation ?? ""} />
                <InfoRow icon={MapPin} label="Address" value={fullAddress} />
              </div>
            </section>
          </div>

          <div className="col-span-7 flex flex-col gap-6">
            <section className="rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-border pb-[9px]">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <FileText className="size-4 text-primary" />
                  Verification Documents
                </h2>
              </div>

              {docs.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {docs.map((doc) => {
                    const isPdf = doc.name.toLowerCase().endsWith(".pdf") || doc.url.toLowerCase().includes(".pdf");
                    return (
                      <div key={doc.key} className="flex flex-col gap-2 overflow-hidden rounded border border-border bg-[#f8f9fa]">
                        <div className="flex items-center justify-between px-3 pt-3">
                          <span className="text-[11px] font-semibold tracking-[0.55px] text-muted-foreground uppercase">
                            {doc.kind === "nid" ? "National ID (NID)" : "Driving License"}
                          </span>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs font-semibold text-[#424753] transition-colors hover:border-primary/50"
                          >
                            <Download className="size-3.5" />
                            Open
                          </a>
                        </div>
                        <div className="px-3">
                          {isPdf ? (
                            <iframe src={doc.url} title={doc.name} className="h-52 w-full rounded border border-border bg-white" />
                          ) : (
                            <img src={doc.url} alt={doc.name} className="h-52 w-full rounded border border-border bg-white object-contain" />
                          )}
                        </div>
                        <p className="truncate px-3 pb-3 text-xs text-muted-foreground">{doc.name}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded border border-dashed border-[#c2c6d5] bg-[#f8f9fa] py-16">
                  <FileText className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">No verification documents uploaded</p>
                  <p className="text-xs text-muted-foreground">The owner can attach their NID or license during registration.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
