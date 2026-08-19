"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play, Star, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Review = { id: string; name: string; role: string; rating: number; avatar?: string; initials?: string; review: string };
type TestimonialsData = {
  hero: { title: string; subtitle: string };
  video: { image: string; quote: string; author: string };
  stats: {
    rating: string;
    ratingLabel: string;
    ratingNote: string;
    efficiency: string;
    efficiencyLabel: string;
    efficiencyNote: string;
  };
  reviews: Review[];
  cta: { title: string; subtitle: string; button: string };
};

function Stars({ rating, size = "h-[19px] w-5" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-1">
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
    api.get<{ data: TestimonialsData }>("/content/testimonials").then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) {
    return <div className="p-8 text-muted-foreground">Loading testimonials...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-8">
        <h1 className="pb-4 text-center text-4xl font-bold tracking-[-0.72px] text-foreground">{data.hero.title}</h1>
        <p className="max-w-2xl pb-8 text-center text-base leading-6 text-[#424753]">{data.hero.subtitle}</p>

        <div className="grid w-full grid-cols-12 items-start gap-6 pb-12">
          <div className="relative col-span-8 h-[358px] overflow-hidden rounded-lg border border-[#e2e8f0] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Image src={data.video.image} alt="Video testimonial" fill className="object-cover" />
            <div className="absolute inset-0 bg-[rgba(25,28,29,0.2)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-xl bg-white/90 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] backdrop-blur-[2px]">
                <Play className="size-9 fill-primary text-primary" />
              </span>
            </div>
            <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-[rgba(25,28,29,0.8)] to-[rgba(25,28,29,0)] p-6">
              <p className="text-xl font-semibold text-white">{data.video.quote}</p>
              <p className="text-sm text-[#f8f9fa]">{data.video.author}</p>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <p className="pb-1 text-4xl font-bold tracking-[-0.72px] text-primary">{data.stats.rating}</p>
              <div className="pb-2">
                <Stars rating={5} size="h-[19px] w-5" />
              </div>
              <p className="text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">{data.stats.ratingLabel}</p>
              <p className="pt-1 text-[11px] font-medium text-muted-foreground">{data.stats.ratingNote}</p>
            </div>

            <div className="flex flex-col justify-center rounded-lg border border-[rgba(0,82,204,0.1)] bg-primary p-[25px]">
              <p className="flex items-center gap-2 pb-2 text-xs font-semibold tracking-[0.3px] text-[#c8d8ff] uppercase">
                <TrendingUp className="size-3" />
                {data.stats.efficiencyLabel}
              </p>
              <p className="pb-1 text-4xl font-bold tracking-[-0.72px] text-[#c8d8ff]">{data.stats.efficiency}</p>
              <p className="text-sm leading-5 text-[rgba(200,216,255,0.8)]">{data.stats.efficiencyNote}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-y border-[#e2e8f0] bg-[#f3f4f5] py-[49px]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">What Our Partners Say</h2>
          <div className="flex gap-4">
            {data.reviews.map((review) => (
              <div key={review.id} className="flex flex-1 flex-col justify-between rounded border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="pb-2">
                  <Stars rating={review.rating} />
                </div>
                <p className="flex-1 pb-4 text-sm leading-5 text-foreground">{review.review}</p>
                <div className="flex items-center gap-2">
                  {review.avatar ? (
                    <Image src={review.avatar} alt={review.name} width={32} height={32} className="rounded-xl" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-xl bg-[rgba(0,82,204,0.1)] text-base text-primary">
                      {review.initials}
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24px] text-foreground">{review.name}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-8">
        <div className="my-12 flex flex-col items-center rounded-2xl border border-[#e2e8f0] bg-[#edeeef] p-[33px]">
          <h2 className="pb-4 text-center text-2xl font-semibold tracking-[-0.24px] text-foreground">{data.cta.title}</h2>
          <p className="max-w-xl pb-8 text-center text-base leading-6 text-[#424753]">{data.cta.subtitle}</p>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            {data.cta.button}
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
