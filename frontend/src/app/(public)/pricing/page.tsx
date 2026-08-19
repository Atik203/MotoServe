"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock, Disc3, Droplet, Gauge, Truck, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const cardIcons: Record<string, LucideIcon> = { droplet: Droplet, disc: Disc3, gauge: Gauge, truck: Truck };

type PricingCard = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceSuffix: string;
  duration: string;
  icon: string;
  badge: string | null;
  highlight: boolean;
  accent?: "brown";
  features: string[];
  cta: string;
  ctaVariant?: "outline" | "brown";
};
type PricingData = {
  hero: { title: string; subtitle: string };
  cards: PricingCard[];
  pricingFaq: { question: string; answer: string }[];
  cta: { title: string; subtitle: string; button: string };
};

export default function PricingPage() {
  const [data, setData] = useState<PricingData | null>(null);
  useEffect(() => {
    api.get<{ data: PricingData }>("/content/pricing").then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) {
    return <div className="p-8 text-muted-foreground">Loading pricing...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 p-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-center text-4xl font-bold tracking-[-0.72px] text-foreground">{data.hero.title}</h1>
        <p className="max-w-2xl text-center text-base leading-6 text-[#424753]">{data.hero.subtitle}</p>
      </div>

      <div className="grid w-full grid-cols-3 gap-6">
        {data.cards.slice(0, 3).map((card) => {
          const Icon = cardIcons[card.icon] ?? Gauge;
          return (
            <div
              key={card.id}
              className={cn(
                "relative flex flex-col justify-between rounded-lg border bg-white p-[25px]",
                card.highlight
                  ? "border-primary shadow-[0_0_0_1px_rgba(0,82,204,0.2),0_1px_2px_0px_rgba(0,0,0,0.05)]"
                  : "border-[#e2e8f0] shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
              )}
            >
              {card.badge && (
                <span
                  className={cn(
                    "absolute top-0 right-0 rounded-bl px-2 py-1 text-[11px] font-semibold",
                    card.highlight ? "bg-primary text-white" : "bg-[rgba(0,82,204,0.1)] text-primary",
                  )}
                >
                  {card.badge}
                </span>
              )}

              <div>
                <div className="flex items-center pb-4">
                  <span
                    className={cn(
                      "mr-4 flex size-10 shrink-0 items-center justify-center rounded-xl",
                      card.highlight ? "bg-[rgba(0,82,204,0.1)]" : "bg-[#edeeef]",
                    )}
                  >
                    <Icon className="size-[18px] text-primary" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold whitespace-nowrap text-foreground">{card.title}</h3>
                    <p className="text-sm text-[#424753]">{card.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-baseline pb-4">
                  <span className="text-4xl font-bold tracking-[-0.72px] text-primary">{card.price}</span>
                  <span className="ml-2 text-sm text-[#424753]">{card.priceSuffix}</span>
                </div>

                <span className="mb-6 inline-flex items-center gap-1 rounded-sm bg-[#f3f4f5] px-2 py-1 text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  <Clock className="size-[13.3px]" />
                  {card.duration}
                </span>

                <ul className="flex flex-col gap-2 pb-6">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-end gap-1 text-sm text-foreground">
                      <Check className="size-[15px] shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/login"
                className={cn(
                  "block rounded py-2 text-center text-xs font-semibold tracking-[0.24px]",
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

        <div className="col-span-3 flex gap-6 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex w-[380px] shrink-0 flex-col gap-4">
            <div className="flex items-center">
              <span className="mr-4 flex size-12 items-center justify-center rounded bg-[rgba(139,80,0,0.1)]">
                <Truck className="size-[22px] text-[#8b5000]" />
              </span>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">
                  {data.cards[3].title}
                </h3>
                <p className="text-sm text-[#424753]">{data.cards[3].subtitle}</p>
              </div>
            </div>
            <p className="text-4xl font-bold tracking-[-0.72px] text-[#8b5000]">{data.cards[3].price}</p>
            <p className="text-sm leading-5 text-[#424753]">
              Tailored maintenance schedules and volume discounts designed for corporate fleets to maximize uptime.
            </p>
            <Link href="/login" className="block rounded bg-[#8b5000] py-2 text-center text-xs font-semibold tracking-[0.24px] text-white">
              {data.cards[3].cta}
            </Link>
          </div>

          <div className="flex flex-1 items-start justify-center gap-4 border-l border-[#e2e8f0] pl-[25px] pt-4">
            <ul className="flex w-[360px] flex-col gap-2">
              {data.cards[3].features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-end gap-1 text-sm text-foreground">
                  <Check className="size-[15px] shrink-0 text-[#8b5000]" />
                  {f}
                </li>
              ))}
            </ul>
            <ul className="flex w-[360px] flex-col gap-2">
              {data.cards[3].features.slice(3).map((f) => (
                <li key={f} className="flex items-end gap-1 text-sm text-foreground">
                  <Check className="size-[15px] shrink-0 text-[#8b5000]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-[-0.24px] text-foreground">Pricing FAQ</h2>
        <div className="flex w-full flex-col gap-4">
          {data.pricingFaq.map((faq, i) => (
            <div key={faq.question} className="flex flex-col gap-2 rounded border border-[#e2e8f0] bg-white p-[17px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold whitespace-nowrap text-foreground">{faq.question}</h4>
                <ChevronDown className={cn("size-3 text-muted-foreground", i === 0 && "rotate-180")} />
              </div>
              {i === 0 && <p className="text-sm leading-5 text-[#424753]">{faq.answer}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl bg-primary p-8">
        <div className="absolute -top-16 -right-16 size-64 rounded-xl bg-[#004492] opacity-10 blur-[20px]" />
        <div className="absolute -bottom-16 -left-16 size-48 rounded-xl bg-[#004492] opacity-10 blur-[12px]" />
        <div className="relative flex flex-col items-center gap-4">
          <h2 className="text-center text-4xl font-bold tracking-[-0.72px] text-[#c8d8ff]">{data.cta.title}</h2>
          <p className="max-w-xl pb-2 text-center text-base leading-6 text-[rgba(200,216,255,0.8)]">
            {data.cta.subtitle}
          </p>
          <Link
            href="/login"
            className="rounded bg-[#004492] px-8 py-4 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            {data.cta.button}
          </Link>
        </div>
      </div>
    </div>
  );
}
