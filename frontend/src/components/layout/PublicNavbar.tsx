"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { roleHome } from "@/lib/nav";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMe } from "@/store/slices/authSlice";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "FAQ", href: "/faqs" },
];

export function PublicNavbar({ fixed = true }: { fixed?: boolean }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!user) {
      void dispatch(fetchMe());
    }
  }, [dispatch, user]);

  const home = user ? roleHome(user.role) : "/login";
  const bookHref = user?.role === "owner" ? "/dashboard/appointments/book" : home;

  return (
    <nav
      className={cn(
        "top-0 right-0 left-0 z-40 border-b border-[#e2e8f0] bg-[rgba(248,249,250,0.8)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[6px]",
        fixed ? "fixed" : "relative",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-8">
        <Link href="/" className="text-xl font-bold text-primary">
          MotoServe
        </Link>

        <div className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-[#414754] transition-colors hover:text-primary",
                pathname === link.href && "font-medium text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href={home}
                className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-primary/90"
              >
                Dashboard
              </Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold tracking-[0.24px] text-[#414754] transition-colors hover:text-primary">
                Login
              </Link>
              <Link
                href={bookHref}
                className="flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-primary/90"
              >
                Book Service
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
