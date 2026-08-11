"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "FAQ", href: "/faqs" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 right-0 left-0 z-40 border-b border-[#e2e8f0] bg-[rgba(248,249,250,0.8)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[6px]">
      <div className="mx-auto flex h-[64px] w-full max-w-[1280px] items-center justify-between px-[32px]">
        <Link href="/" className="text-[20px] font-bold text-primary">
          MotoServe
        </Link>

        <div className="flex items-center gap-[24px]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[14px] text-[#414754] transition-colors hover:text-primary",
                pathname === link.href && "font-medium text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-[16px]">
          <Link href="/login" className="text-[12px] font-semibold tracking-[0.24px] text-[#414754] transition-colors hover:text-primary">
            Login
          </Link>
          <Link
            href="/login"
            className="flex h-[40px] items-center justify-center rounded-[12px] bg-primary px-[16px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-primary/90"
          >
            Book Service
          </Link>
        </div>
      </div>
    </nav>
  );
}
