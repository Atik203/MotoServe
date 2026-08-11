"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices } from "@/store/slices/servicesSlice";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);

  useEffect(() => {
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  const featured = services.filter((s) => s.marketing);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-[48px] px-[32px] py-[48px]">
      <div className="flex w-full max-w-[768px] flex-col gap-[16px]">
        <h1 className="text-center text-[36px] font-bold tracking-[-0.72px] text-foreground">
          Comprehensive Fleet Services
        </h1>
        <p className="text-center text-[16px] leading-[24px] text-[#424753]">
          Keep your vehicles operating at peak performance with our professional, reliable, and
          efficient maintenance solutions designed for modern fleets.
        </p>
      </div>

      <div className="flex w-full items-start justify-center gap-[24px]">
        {featured.map((service) => (
          <article
            key={service.id}
            className="w-[389px] shrink-0 overflow-hidden rounded-[4px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            <div className="relative h-[192px] w-full bg-[#edeeef]">
              <Image src={service.marketing!.image} alt={service.marketing!.name} fill className="object-cover" />
              <span className="absolute top-[16px] right-[16px] flex items-center gap-[4px] rounded-[2px] bg-[rgba(255,255,255,0.9)] px-[8px] py-[4px] text-[11px] font-bold text-primary shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
                <Clock className="size-[10.5px]" />
                {service.marketing!.durationLabel}
              </span>
            </div>

            <div className="flex flex-col gap-[16px] p-[16px]">
              <div className="flex flex-col gap-[4px]">
                <div className="flex w-full items-start justify-between">
                  <h2 className="text-[20px] font-semibold whitespace-nowrap text-foreground">
                    {service.marketing!.name}
                  </h2>
                  <span className="rounded-[2px] bg-[#e1e3e4] px-[8px] py-[4px] text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                    From {service.marketing!.from}
                  </span>
                </div>
                <p className="text-[14px] leading-[20px] text-[#424753]">{service.marketing!.blurb}</p>
              </div>

              <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-[17px]">
                <div className="flex h-[24px] items-start gap-[8px]">
                  {service.marketing!.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "flex items-center gap-[4px] rounded-[12px] border px-[9px] py-[5px] text-[11px] font-medium",
                        service.marketing!.tagStyle === "warning"
                          ? "border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] text-foreground"
                          : "border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] text-primary",
                      )}
                    >
                      {service.marketing!.tagStyle === "warning" && (
                        <span className="size-[6px] rounded-full bg-warning" />
                      )}
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="flex items-center gap-[4px] text-[12px] font-semibold tracking-[0.24px] text-primary hover:underline"
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
