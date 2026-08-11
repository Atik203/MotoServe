"use client";

import {
  CalendarDays,
  Car,
  ClipboardList,
  FileCheck,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type Role = "owner" | "advisor" | "mechanic" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface RoleNavConfig {
  brand: string;
  items: NavItem[];
  bottomItems: NavItem[];
  profile?: { name: string; subtitle: string; avatar: string };
  actionButton?: { label: string };
}

export const roleNav: Record<Role, RoleNavConfig> = {
  owner: {
    brand: "MotoServe",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Vehicles", href: "/dashboard/vehicles", icon: Car },
      { label: "Appointments", href: "/dashboard/appointments", icon: CalendarDays },
      { label: "Service Tracking", href: "/dashboard/services", icon: Gauge },
      { label: "Estimates", href: "/dashboard/estimates", icon: FileCheck },
      { label: "Communication Center", href: "/dashboard/chat", icon: MessageSquare },
      { label: "Service History", href: "/dashboard/history", icon: History },
      { label: "Payments & Invoices", href: "/dashboard/payments", icon: Wallet },
    ],
    bottomItems: [
      { label: "Support", href: "#", icon: LifeBuoy },
      { label: "Settings", href: "#", icon: Settings },
    ],
  },
  advisor: {
    brand: "MotoServe",
    items: [
      { label: "Dashboard", href: "/advisor", icon: LayoutDashboard },
      { label: "Receive Vehicle", href: "/advisor/receive", icon: Truck },
      { label: "Create Job Card", href: "/advisor/job-cards/new", icon: FileText },
      { label: "Assign Mechanic", href: "/advisor/job-cards/assign", icon: Users },
      { label: "Send Estimate", href: "/advisor/estimates/new", icon: FileCheck },
      { label: "Communication Center", href: "/advisor/chat", icon: MessageSquare },
    ],
    bottomItems: [
      { label: "Help", href: "#", icon: LifeBuoy },
      { label: "Logout", href: "/login", icon: LogOut },
    ],
  },
  mechanic: {
    brand: "MotoServe",
    items: [
      { label: "Current Jobs", href: "/mechanic", icon: ClipboardList },
      { label: "Repair Progress", href: "/mechanic/jobs", icon: Wrench },
      { label: "History", href: "/mechanic/history", icon: History },
      { label: "Parts Request", href: "/mechanic/parts", icon: Package },
      { label: "Diagnostic Tools", href: "/mechanic/diagnostics", icon: Gauge },
      { label: "Workshop Chat", href: "/mechanic/chat", icon: MessageSquare },
    ],
    bottomItems: [
      { label: "Help", href: "#", icon: LifeBuoy },
      { label: "Logout", href: "/login", icon: LogOut },
    ],
    profile: { name: "Main Bay", subtitle: "Station 04", avatar: "/images/avatars/alex-turner.png" },
    actionButton: { label: "Clock Out" },
  },
  admin: {
    brand: "MotoServe",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Services", href: "/admin/services", icon: Wrench },
      { label: "Employees", href: "/admin/employees", icon: Users },
      { label: "Reports", href: "/admin/reports", icon: FileText },
      { label: "Customer Management", href: "/admin/verifications", icon: ShieldCheck },
    ],
    bottomItems: [
      { label: "Settings", href: "#", icon: Settings },
      { label: "Logout", href: "/login", icon: LogOut },
    ],
  },
};
