"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { api } from "@/lib/api";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    api.get<{ data: Service[] }>("/content/services").then((r) => setServices(r.data)).catch(() => setServices([]));
  }, []);

  const featured = services.filter((s) => s.marketing);

  if (services.length === 0) {
    return <div className="p-8 text-muted-foreground">Loading services...</div>;
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
    </div>
  );
}
