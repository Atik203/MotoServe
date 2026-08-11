"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play, Star, TrendingUp } from "lucide-react";
import demoData from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type TestimonialsData = Awaited<ReturnType<typeof demoData.load<"testimonials">>>;

function Stars({ rating, size = "h-[19px] w-[20px]" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-[4px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i <= Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i - rating >= 1
                ? "text-[#e1e3e4]"
                : "fill-amber-400/50 text-amber-400",
          )}
        />
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const [data, setData] = useState<TestimonialsData | null>(null);
  useEffect(() => {
    demoData.load("testimonials").then(setData);
  }, []);

  if (!data) {
    return <div className="p-[32px] text-muted-foreground">Loading testimonials...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center py-[48px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-[32px]">
        <h1 className="pb-[16px] text-center text-[36px] font-bold tracking-[-0.72px] text-foreground">{data.hero.title}</h1>
        <p className="max-w-[672px] pb-[32px] text-center text-[16px] leading-[24px] text-[#424753]">{data.hero.subtitle}</p>

        <div className="grid w-full grid-cols-12 items-start gap-[24px] pb-[48px]">
          <div className="relative col-span-8 h-[358px] overflow-hidden rounded-[8px] border border-[#e2e8f0] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Image src={data.video.image} alt="Video testimonial" fill className="object-cover" />
            <div className="absolute inset-0 bg-[rgba(25,28,29,0.2)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-[64px] items-center justify-center rounded-[12px] bg-white/90 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] backdrop-blur-[2px]">
                <Play className="size-[36px] fill-primary text-primary" />
              </span>
            </div>
            <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-[rgba(25,28,29,0.8)] to-[rgba(25,28,29,0)] p-[24px]">
              <p className="text-[20px] font-semibold text-white">{data.video.quote}</p>
              <p className="text-[14px] text-[#f8f9fa]">{data.video.author}</p>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <div className="flex flex-col items-center justify-center rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <p className="pb-[4px] text-[36px] font-bold tracking-[-0.72px] text-primary">{data.stats.rating}</p>
              <div className="pb-[8px]">
                <Stars rating={5} size="h-[19px] w-[20px]" />
              </div>
              <p className="text-[12px] font-semibold tracking-[0.6px] text-[#424753] uppercase">{data.stats.ratingLabel}</p>
              <p className="pt-[4px] text-[11px] font-medium text-muted-foreground">{data.stats.ratingNote}</p>
            </div>

            <div className="flex flex-col justify-center rounded-[8px] border border-[rgba(0,82,204,0.1)] bg-primary p-[25px]">
              <p className="flex items-center gap-[8px] pb-[8px] text-[12px] font-semibold tracking-[0.3px] text-[#c8d8ff] uppercase">
                <TrendingUp className="size-[12px]" />
                {data.stats.efficiencyLabel}
              </p>
              <p className="pb-[4px] text-[36px] font-bold tracking-[-0.72px] text-[#c8d8ff]">{data.stats.efficiency}</p>
              <p className="text-[14px] leading-[20px] text-[rgba(200,216,255,0.8)]">{data.stats.efficiencyNote}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-y border-[#e2e8f0] bg-[#f3f4f5] py-[49px]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px] px-[32px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">What Our Partners Say</h2>
          <div className="flex gap-[16px]">
            {data.reviews.map((review) => (
              <div key={review.id} className="flex flex-1 flex-col justify-between rounded-[4px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="pb-[8px]">
                  <Stars rating={review.rating} />
                </div>
                <p className="flex-1 pb-[16px] text-[14px] leading-[20px] text-foreground">{review.review}</p>
                <div className="flex items-center gap-[8px]">
                  {review.avatar ? (
                    <Image src={review.avatar} alt={review.name} width={32} height={32} className="rounded-[12px]" />
                  ) : (
                    <span className="flex size-[32px] items-center justify-center rounded-[12px] bg-[rgba(0,82,204,0.1)] text-[16px] text-primary">
                      {review.initials}
                    </span>
                  )}
                  <div>
                    <p className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{review.name}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-[32px]">
        <div className="my-[48px] flex flex-col items-center rounded-[16px] border border-[#e2e8f0] bg-[#edeeef] p-[33px]">
          <h2 className="pb-[16px] text-center text-[24px] font-semibold tracking-[-0.24px] text-foreground">{data.cta.title}</h2>
          <p className="max-w-[576px] pb-[32px] text-center text-[16px] leading-[24px] text-[#424753]">{data.cta.subtitle}</p>
          <Link
            href="/login"
            className="flex items-center gap-[8px] rounded-[12px] bg-primary px-[32px] py-[16px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            {data.cta.button}
            <ArrowRight className="size-[12px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
