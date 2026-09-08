"use client";

import ServiceForm from "@/components/roles/admin/ServiceForm";

export default function NewServicePage() {
  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-xs font-medium text-[#424753]">
            <span className="hover:text-primary">Dashboard</span>
            <span>›</span>
            <span className="hover:text-primary">Service Management</span>
            <span>›</span>
            <span className="font-semibold text-foreground">Add Service</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Add Service</h1>
          <p className="text-sm text-muted-foreground">Create a new service offering with pricing and availability.</p>
        </div>
        <ServiceForm />
      </div>
    </div>
  );
}