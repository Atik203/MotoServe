"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { roleNav, type Role } from "@/lib/nav";
import { useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";

interface AppSidebarProps {
  role: Role;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const config = roleNav[role];
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="bg-white border-r border-border fixed inset-y-0 left-0 z-30 flex w-64 flex-col justify-between">
      <div>
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/" className="text-lg font-bold tracking-[-0.45px] text-foreground transition-colors hover:text-primary">
            MotoServe
          </Link>
        </div>

        {config.profile && (
          <div className="m-4 mb-2 flex items-center gap-2 rounded-md border border-border bg-secondary p-[9px]">
            <Image
              src={config.profile.avatar}
              alt={config.profile.name}
              width={32}
              height={32}
              className="rounded-md"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{config.profile.name}</p>
              <p className="text-xs text-muted-foreground">{config.profile.subtitle}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1 p-4 pt-2">
          {config.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-primary text-white hover:bg-primary hover:text-white",
                )}
              >
                <span className="flex w-6 items-center justify-center">
                  <item.icon className="size-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="flex flex-col gap-1 p-4">
          {config.bottomItems.map((item) =>
            item.label === "Logout" ? (
              <button
                key={item.label}
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex w-6 items-center justify-center">
                  <item.icon className="size-[18px]" />
                </span>
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex w-6 items-center justify-center">
                  <item.icon className="size-[18px]" />
                </span>
                {item.label}
              </Link>
            ),
          )}
          {config.actionButton && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 w-full rounded border border-input bg-secondary py-[9px] text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {config.actionButton.label}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
