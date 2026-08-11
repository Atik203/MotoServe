"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { roleNav, type Role } from "@/lib/nav";

interface AppSidebarProps {
  role: Role;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const config = roleNav[role];
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="bg-white border-r border-border fixed inset-y-0 left-0 z-30 flex w-[256px] flex-col justify-between">
      <div>
        <div className="flex h-[64px] items-center border-b border-border px-[24px]">
          <span className="text-[18px] font-bold tracking-[-0.45px] text-foreground">MotoServe</span>
        </div>

        {config.profile && (
          <div className="m-[16px] mb-[8px] flex items-center gap-[8px] rounded-[6px] border border-border bg-secondary p-[9px]">
            <Image
              src={config.profile.avatar}
              alt={config.profile.name}
              width={32}
              height={32}
              className="rounded-[6px]"
            />
            <div>
              <p className="text-[14px] font-semibold text-foreground">{config.profile.name}</p>
              <p className="text-[12px] text-muted-foreground">{config.profile.subtitle}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-[4px] p-[16px] pt-[8px]">
          {config.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-[12px] rounded-[6px] px-[12px] py-[8px] text-[14px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-primary text-white hover:bg-primary hover:text-white",
                )}
              >
                <span className="flex w-[24px] items-center justify-center">
                  <item.icon className="size-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="flex flex-col gap-[4px] p-[16px]">
          {config.bottomItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-[12px] rounded-[6px] px-[12px] py-[8px] text-[14px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex w-[24px] items-center justify-center">
                <item.icon className="size-[18px]" />
              </span>
              {item.label}
            </Link>
          ))}
          {config.actionButton && (
            <button
              type="button"
              className="mt-[8px] w-full rounded-[4px] border border-input bg-secondary py-[9px] text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              {config.actionButton.label}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
