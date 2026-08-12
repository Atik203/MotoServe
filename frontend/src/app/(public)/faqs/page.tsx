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
    return <div className="p-8 text-muted-foreground">Loading FAQ...</div>;
  }

  return (
    <>
      <section className="w-full border-b border-[#e2e8f0] bg-white px-64 pt-12 pb-[49px]">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6">
          <h1 className="text-center text-4xl font-bold tracking-[-0.72px] text-foreground">How can we help you?</h1>
          <p className="max-w-2xl text-center text-base leading-6 text-[#424753]">
            Search our knowledge base or browse categories below to find answers to common questions about
            MotoServe&apos;s fleet management platform.
          </p>
          <div className="relative w-full max-w-xl">
            <Search className="absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for articles, guides, or keywords..."
              className="h-12 w-full rounded-xl border border-[#e2e8f0] bg-[#f8f9fa] pr-[17px] pl-[49px] text-sm text-foreground shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-[960px] grid-cols-12 gap-6 py-12">
        <aside className="col-span-3 flex flex-col gap-2">
          <h2 className="pb-4 text-xl font-semibold text-foreground">Categories</h2>
          {data.categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded px-4 py-2 text-left text-xs font-semibold tracking-[0.24px] transition-colors",
                cat === activeCategory
                  ? "border border-[#e2e8f0] bg-[#f3f4f5] text-primary"
                  : "text-[#424753] hover:bg-muted",
              )}
            >
              {cat}
            </button>
          ))}
        </aside>

        <div className="col-span-9 flex flex-col gap-4 pb-3.5">
          <h2 className="pb-2 text-2xl font-semibold tracking-[-0.24px] text-foreground">
            {activeCategory} Questions
          </h2>
          {filtered.map((faq) => {
            const open = openItem === faq.id;
            return (
              <div
                key={faq.id}
                className="w-full overflow-hidden rounded border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenItem(open ? null : faq.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-xl font-semibold whitespace-nowrap text-foreground">{faq.question}</span>
                  <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>
                {open && <p className="px-4 pb-4 text-sm leading-5 text-[#424753]">{faq.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="w-full border-t border-[#e2e8f0] bg-[#f3f4f5] px-48 pt-[49px] pb-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-[33px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <Headset className="size-9 text-primary" />
          <h2 className="pt-2 text-4xl font-bold tracking-[-0.72px] text-foreground">{data.cta.title}</h2>
          <p className="max-w-lg text-center text-base leading-6 text-[#424753]">{data.cta.subtitle}</p>
          <div className="flex justify-center gap-4 pt-4">
            <span className="flex items-center gap-2 rounded bg-primary px-6 py-[13px] text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Headset className="size-5" />
              Contact Support
            </span>
            <span className="flex items-center gap-2 rounded border border-[#e2e8f0] bg-[#f8f9fa] px-[25px] py-[13px] text-xs font-semibold tracking-[0.24px] text-primary">
              <BookOpen className="size-4" />
              View Documentation
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
