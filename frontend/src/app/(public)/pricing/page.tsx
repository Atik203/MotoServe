"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock, Disc3, Droplet, Gauge, Truck, type LucideIcon } from "lucide-react";
import demoData from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const cardIcons: Record<string, LucideIcon> = { droplet: Droplet, disc: Disc3, gauge: Gauge, truck: Truck };

export default function PricingPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof demoData.load<"pricing">>> | null>(null);
  useEffect(() => {
    demoData.load("pricing").then(setData);
  }, []);

  if (!data) {
    return <div className="p-[32px] text-muted-foreground">Loading pricing...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-[48px] p-[32px]">
      <div className="flex flex-col items-center gap-[8px]">
        <h1 className="text-center text-[36px] font-bold tracking-[-0.72px] text-foreground">{data.hero.title}</h1>
        <p className="max-w-[672px] text-center text-[16px] leading-[24px] text-[#424753]">{data.hero.subtitle}</p>
      </div>

      <div className="grid w-full grid-cols-3 gap-[24px]">
        {data.cards.slice(0, 3).map((card) => {
          const Icon = cardIcons[card.icon] ?? Gauge;
          return (
            <div
              key={card.id}
              className={cn(
                "relative flex flex-col justify-between rounded-[8px] border bg-white p-[25px]",
                card.highlight
                  ? "border-primary shadow-[0_0_0_1px_rgba(0,82,204,0.2),0_1px_2px_0px_rgba(0,0,0,0.05)]"
                  : "border-[#e2e8f0] shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
              )}
            >
              {card.badge && (
                <span
                  className={cn(
                    "absolute top-0 right-0 rounded-bl-[4px] px-[8px] py-[4px] text-[11px] font-semibold",
                    card.highlight ? "bg-primary text-white" : "bg-[rgba(0,82,204,0.1)] text-primary",
                  )}
                >
                  {card.badge}
                </span>
              )}

              <div>
                <div className="flex items-center pb-[16px]">
                  <span
                    className={cn(
                      "mr-[16px] flex size-[40px] shrink-0 items-center justify-center rounded-[12px]",
                      card.highlight ? "bg-[rgba(0,82,204,0.1)]" : "bg-[#edeeef]",
                    )}
                  >
                    <Icon className="size-[18px] text-primary" />
                  </span>
                  <div>
                    <h3 className="text-[20px] font-semibold whitespace-nowrap text-foreground">{card.title}</h3>
                    <p className="text-[14px] text-[#424753]">{card.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-baseline pb-[16px]">
                  <span className="text-[36px] font-bold tracking-[-0.72px] text-primary">{card.price}</span>
                  <span className="ml-[8px] text-[14px] text-[#424753]">{card.priceSuffix}</span>
                </div>

                <span className="mb-[24px] inline-flex items-center gap-[4px] rounded-[2px] bg-[#f3f4f5] px-[8px] py-[4px] text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                  <Clock className="size-[13.3px]" />
                  {card.duration}
                </span>

                <ul className="flex flex-col gap-[8px] pb-[24px]">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-end gap-[4px] text-[14px] text-foreground">
                      <Check className="size-[15px] shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/login"
                className={cn(
                  "block rounded-[4px] py-[8px] text-center text-[12px] font-semibold tracking-[0.24px]",
                  card.ctaVariant === "outline"
                    ? "border border-[#c2c6d5] bg-[#edeeef] text-primary"
                    : "bg-primary text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
                )}
              >
                {card.cta}
              </Link>
            </div>
          );
        })}

        <div className="col-span-3 flex gap-[24px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex w-[380px] shrink-0 flex-col gap-[16px]">
            <div className="flex items-center">
              <span className="mr-[16px] flex size-[48px] items-center justify-center rounded-[4px] bg-[rgba(139,80,0,0.1)]">
                <Truck className="size-[22px] text-[#8b5000]" />
              </span>
              <div>
                <h3 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">
                  {data.cards[3].title}
                </h3>
                <p className="text-[14px] text-[#424753]">{data.cards[3].subtitle}</p>
              </div>
            </div>
            <p className="text-[36px] font-bold tracking-[-0.72px] text-[#8b5000]">{data.cards[3].price}</p>
            <p className="text-[14px] leading-[20px] text-[#424753]">
              Tailored maintenance schedules and volume discounts designed for corporate fleets to maximize uptime.
            </p>
            <Link href="/login" className="block rounded-[4px] bg-[#8b5000] py-[8px] text-center text-[12px] font-semibold tracking-[0.24px] text-white">
              {data.cards[3].cta}
            </Link>
          </div>

          <div className="flex flex-1 items-start justify-center gap-[16px] border-l border-[#e2e8f0] pl-[25px] pt-[16px]">
            <ul className="flex w-[360px] flex-col gap-[8px]">
              {data.cards[3].features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-end gap-[4px] text-[14px] text-foreground">
                  <Check className="size-[15px] shrink-0 text-[#8b5000]" />
                  {f}
                </li>
              ))}
            </ul>
            <ul className="flex w-[360px] flex-col gap-[8px]">
              {data.cards[3].features.slice(3).map((f) => (
                <li key={f} className="flex items-end gap-[4px] text-[14px] text-foreground">
                  <Check className="size-[15px] shrink-0 text-[#8b5000]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[768px] flex-col items-center gap-[24px]">
        <h2 className="text-center text-[24px] font-semibold tracking-[-0.24px] text-foreground">Pricing FAQ</h2>
        <div className="flex w-full flex-col gap-[16px]">
          {data.pricingFaq.map((faq, i) => (
            <div key={faq.question} className="flex flex-col gap-[8px] rounded-[4px] border border-[#e2e8f0] bg-white p-[17px]">
              <div className="flex items-center justify-between">
                <h4 className="text-[20px] font-semibold whitespace-nowrap text-foreground">{faq.question}</h4>
                <ChevronDown className={cn("size-[12px] text-muted-foreground", i === 0 && "rotate-180")} />
              </div>
              {i === 0 && <p className="text-[14px] leading-[20px] text-[#424753]">{faq.answer}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-[16px] bg-primary p-[32px]">
        <div className="absolute -top-[64px] -right-[64px] size-[256px] rounded-[12px] bg-[#004492] opacity-10 blur-[20px]" />
        <div className="absolute -bottom-[64px] -left-[64px] size-[192px] rounded-[12px] bg-[#004492] opacity-10 blur-[12px]" />
        <div className="relative flex flex-col items-center gap-[16px]">
          <h2 className="text-center text-[36px] font-bold tracking-[-0.72px] text-[#c8d8ff]">{data.cta.title}</h2>
          <p className="max-w-[576px] pb-[8px] text-center text-[16px] leading-[24px] text-[rgba(200,216,255,0.8)]">
            {data.cta.subtitle}
          </p>
          <Link
            href="/login"
            className="rounded-[4px] bg-[#004492] px-[32px] py-[16px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            {data.cta.button}
          </Link>
        </div>
      </div>
    </div>
  );
}
