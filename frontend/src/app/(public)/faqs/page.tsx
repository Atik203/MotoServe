"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Headset, Search } from "lucide-react";
import demoData from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type FaqsData = Awaited<ReturnType<typeof demoData.load<"faqs">>>;

export default function FaqPage() {
  const [data, setData] = useState<FaqsData | null>(null);
  const [activeCategory, setActiveCategory] = useState("Booking");
  const [search, setSearch] = useState("");
  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    demoData.load("faqs").then((d) => {
      setData(d);
      setOpenItem(d.faqs[0]?.id ?? null);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.faqs.filter((f) => {
      const matchCategory = f.category === activeCategory;
      const matchSearch = f.question.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [data, activeCategory, search]);

  if (!data) {
    return <div className="p-[32px] text-muted-foreground">Loading FAQ...</div>;
  }

  return (
    <>
      <section className="w-full border-b border-[#e2e8f0] bg-white px-[256px] pt-[48px] pb-[49px]">
        <div className="mx-auto flex w-full max-w-[768px] flex-col items-center gap-[24px]">
          <h1 className="text-center text-[36px] font-bold tracking-[-0.72px] text-foreground">How can we help you?</h1>
          <p className="max-w-[672px] text-center text-[16px] leading-[24px] text-[#424753]">
            Search our knowledge base or browse categories below to find answers to common questions about
            MotoServe&apos;s fleet management platform.
          </p>
          <div className="relative w-full max-w-[576px]">
            <Search className="absolute top-1/2 left-[16px] size-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for articles, guides, or keywords..."
              className="h-[48px] w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8f9fa] pr-[17px] pl-[49px] text-[14px] text-foreground shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[960px] grid-cols-12 gap-[24px] py-[48px]">
        <aside className="col-span-3 flex flex-col gap-[8px]">
          <h2 className="pb-[16px] text-[20px] font-semibold text-foreground">Categories</h2>
          {data.categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-[4px] px-[16px] py-[8px] text-left text-[12px] font-semibold tracking-[0.24px] transition-colors",
                cat === activeCategory
                  ? "border border-[#e2e8f0] bg-[#f3f4f5] text-primary"
                  : "text-[#424753] hover:bg-muted",
              )}
            >
              {cat}
            </button>
          ))}
        </aside>

        <div className="col-span-9 flex flex-col gap-[16px] pb-[14px]">
          <h2 className="pb-[8px] text-[24px] font-semibold tracking-[-0.24px] text-foreground">
            {activeCategory} Questions
          </h2>
          {filtered.map((faq) => {
            const open = openItem === faq.id;
            return (
              <div
                key={faq.id}
                className="w-full overflow-hidden rounded-[4px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenItem(open ? null : faq.id)}
                  className="flex w-full items-center justify-between p-[16px] text-left"
                >
                  <span className="text-[20px] font-semibold whitespace-nowrap text-foreground">{faq.question}</span>
                  <ChevronDown className={cn("size-[12px] text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>
                {open && <p className="px-[16px] pb-[16px] text-[14px] leading-[20px] text-[#424753]">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full border-t border-[#e2e8f0] bg-[#f3f4f5] px-[192px] pt-[49px] pb-[48px]">
        <div className="mx-auto flex w-full max-w-[896px] flex-col items-center gap-[8px] rounded-[8px] border border-[#e2e8f0] bg-white p-[33px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <Headset className="size-[36px] text-primary" />
          <h2 className="pt-[8px] text-[36px] font-bold tracking-[-0.72px] text-foreground">{data.cta.title}</h2>
          <p className="max-w-[512px] text-center text-[16px] leading-[24px] text-[#424753]">{data.cta.subtitle}</p>
          <div className="flex justify-center gap-[16px] pt-[16px]">
            <span className="flex items-center gap-[8px] rounded-[4px] bg-primary px-[24px] py-[13px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Headset className="size-[20px]" />
              Contact Support
            </span>
            <span className="flex items-center gap-[8px] rounded-[4px] border border-[#e2e8f0] bg-[#f8f9fa] px-[25px] py-[13px] text-[12px] font-semibold tracking-[0.24px] text-primary">
              <BookOpen className="size-[16px]" />
              View Documentation
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
