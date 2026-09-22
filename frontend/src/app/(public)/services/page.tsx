"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { load } from "@/lib/demo-data";
import { ServicesLoading } from "@/components/ui/loading";
import type { Service, ServiceCategory } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

const FILTERS: { key: "all" | ServiceCategory; label: string }[] = [
  { key: "all", label: "All Services" },
  { key: "maintenance", label: "Maintenance" },
  { key: "repairs", label: "Repairs" },
  { key: "inspections", label: "Inspections" },
];

const categoryChip: Record<string, string> = {
  maintenance: "bg-[rgba(0,82,204,0.1)] text-primary",
  repairs: "bg-[rgba(255,193,7,0.12)] text-[#b45309]",
  inspections: "bg-[#f0fdf4] text-[#15803d]",
};

export default function ServicesPage() {
  const [featured, setFeatured] = useState<Service[]>([]);
  const [services, setServices] = useState<Service[] | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | ServiceCategory>("all");

  useEffect(() => {
    api
      .get<{ data: Service[] }>("/content/services")
      .then((r) => setFeatured((Array.isArray(r.data) ? r.data : []).filter((s) => s.marketing)))
      .catch(() => {
        load("services")
          .then((f) => setFeatured((Array.isArray(f) ? f : []).filter((s) => s.marketing)))
          .catch(() => setFeatured([]));
      });

    api
      .get<Service[]>("/services")
      .then((r) => setServices(Array.isArray(r) ? r.filter((s) => s.active) : []))
      .catch(() => {
        load("services")
          .then((f) => setServices(Array.isArray(f) ? f.filter((s) => s.active) : []))
          .catch(() => setServices([]));
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (services ?? []).filter((s) => {
      const matchCategory = category === "all" || s.category === category;
      const matchSearch =
        !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [services, search, category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services?.length ?? 0 };
    for (const s of services ?? []) counts[s.category] = (counts[s.category] ?? 0) + 1;
    return counts;
  }, [services]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered]);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const total = Math.min(pageCount, 5);
    const start = Math.min(Math.max(1, safePage - 2), Math.max(1, pageCount - total + 1));
    return Array.from({ length: total }, (_, i) => start + i);
  }, [pageCount, safePage]);

  if (services === null) {
    return <ServicesLoading />;
  }

  if (services.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No services available right now.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-8 py-12">
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <h1 className="text-center text-4xl font-bold tracking-[-0.72px] text-foreground">
          Comprehensive Fleet Services
        </h1>
        <p className="text-center text-base leading-6 text-[#424753]">
          Keep your vehicles operating at peak performance with our professional, reliable, and
          efficient maintenance solutions designed for modern fleets.
        </p>
      </div>

      {featured.length > 0 && (
        <div className="flex w-full items-start justify-center gap-6">
          {featured.map((service) => (
            <article
              key={service.id}
              className="w-[389px] shrink-0 overflow-hidden rounded border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <div className="relative h-48 w-full bg-[#edeeef]">
                <Image src={service.marketing!.image} alt={service.marketing!.name} fill className="object-cover" />
                <span className="absolute top-4 right-4 flex items-center gap-1 rounded-sm bg-[rgba(255,255,255,0.9)] px-2 py-1 text-[11px] font-bold text-primary shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
                  <Clock className="size-[10.5px]" />
                  {service.marketing!.durationLabel}
                </span>
              </div>

              <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex w-full items-start justify-between">
                    <h2 className="text-xl font-semibold whitespace-nowrap text-foreground">
                      {service.marketing!.name}
                    </h2>
                    <span className="rounded-sm bg-[#e1e3e4] px-2 py-1 text-xs font-semibold tracking-[0.24px] text-[#424753]">
                      From {service.marketing!.from}
                    </span>
                  </div>
                  <p className="text-sm leading-5 text-[#424753]">{service.marketing!.blurb}</p>
                </div>

                <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-[17px]">
                  <div className="flex h-6 items-start gap-2">
                    {service.marketing!.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "flex items-center gap-1 rounded-xl border px-[9px] py-[5px] text-[11px] font-medium",
                          service.marketing!.tagStyle === "warning"
                            ? "border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] text-foreground"
                            : "border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] text-primary",
                        )}
                      >
                        {service.marketing!.tagStyle === "warning" && (
                          <span className="size-1.5 rounded-full bg-warning" />
                        )}
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/login"
                    className="flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-primary hover:underline"
                  >
                    Book
                    <ArrowRight className="size-[10.5px]" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* All Services from DB */}
      <section className="flex w-full flex-col gap-6">
        <div className="flex w-full items-end justify-between border-b border-[#e2e8f0] pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-[-0.48px] text-foreground">Browse All Services</h2>
            <p className="text-sm text-[#424753]">
              {services.length} service{services.length === 1 ? "" : "s"} available with transparent pricing.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setCategory(t.key);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  category === t.key
                    ? "bg-primary text-white shadow-sm"
                    : "border border-[#e2e8f0] bg-white text-[#424753] hover:border-primary/40 hover:text-primary",
                )}
              >
                <span>{t.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    category === t.key ? "bg-white/20 text-white" : "bg-[#f3f4f5] text-[#64748b]",
                  )}
                >
                  {categoryCounts[t.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search service or description..."
              className="h-9 w-full rounded-md border border-[#e2e8f0] bg-white pl-9 pr-8 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((service) => (
            <article
              key={service.id}
              className="flex flex-col gap-4 overflow-hidden rounded border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_8px_0px_rgba(0,0,0,0.08)]"
            >
              <div className="flex flex-col gap-2">
                <div className="flex w-full items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold leading-6 text-foreground">{service.name}</h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      categoryChip[service.category] || "bg-[#f3f4f5] text-[#424753]",
                    )}
                  >
                    {service.category}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm leading-5 text-[#424753]">{service.description}</p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold text-foreground">${service.basePrice.toFixed(2)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {service.durationMins} min
                  </span>
                </div>
                <Link
                  href="/login"
                  className="flex items-center gap-1 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#003675]"
                >
                  Book
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="w-full rounded-lg border border-[#e2e8f0] bg-white py-16 text-center text-sm text-muted-foreground">
            No services match your search or filter criteria.
          </div>
        )}

        {/* Pagination Bar */}
        {pageCount > 1 && filtered.length > 0 && (
          <div className="flex w-full items-center justify-between text-xs font-medium text-[#424753]">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length} services
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded border border-[#e2e8f0] bg-white p-2 text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {pageNumbers.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPage(label)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded text-xs font-semibold tracking-[0.24px] transition-colors",
                    safePage === label
                      ? "bg-primary text-white shadow-sm"
                      : "border border-[#e2e8f0] bg-white text-[#424753] hover:bg-secondary",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                className="rounded border border-[#e2e8f0] bg-white p-2 text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}