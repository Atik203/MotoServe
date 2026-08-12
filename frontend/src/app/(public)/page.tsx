"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, FileText, Package, Receipt, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import demoData from "@/lib/demo-data";

const featureIcons: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  receipt: Receipt,
  activity: Activity,
  package: Package,
  zap: Zap,
  "file-text": FileText,
};

export default function HomePage() {
  const [features, setFeatures] = useState<{ id: string; title: string; description: string; icon: string }[]>([]);

  useEffect(() => {
    demoData.load("home").then((data) => setFeatures(data.features));
  }, []);

  return (
    <>
      <section className="mx-auto flex w-full max-w-7xl items-center justify-center gap-12 px-8 py-12">
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">
            Professional Vehicle Servicing
            <br />
            Made Simple
          </h1>
          <p className="max-w-lg text-base leading-6 text-[#414754]">
            Streamline your vehicle maintenance with online booking, live repair tracking, and secure
            digital payments. Experience transparent, efficient servicing for your personal or fleet
            vehicles.
          </p>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-primary/90"
            >
              Book Service
            </Link>
            <Link
              href="/services"
              className="flex h-10 items-center justify-center rounded-xl border border-[#e2e8f0] px-[25px] text-xs font-semibold tracking-[0.24px] text-foreground transition-colors hover:border-primary/60"
            >
              Explore Services
            </Link>
          </div>
        </div>

        <div className="h-[400px] min-w-0 flex-1 overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#edeeef] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <Image
            src="/images/hero/hero-workshop.png"
            alt="MotoServe workshop"
            width={560}
            height={400}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="border-y border-[#e2e8f0] bg-[#f3f4f5] py-[49px]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-8">
          <h2 className="text-center text-2xl font-semibold tracking-[-0.24px] text-foreground">Why Choose Us</h2>
          <div className="grid grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = featureIcons[feature.icon] ?? ShieldCheck;
              return (
                <div
                  key={feature.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8f9fa] p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-[rgba(26,115,232,0.1)]">
                    <Icon className="size-5 text-primary" />
                  </span>
                  <h3 className="pt-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-5 text-[#414754]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
