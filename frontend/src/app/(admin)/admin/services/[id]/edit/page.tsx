"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices } from "@/store/slices/servicesSlice";
import ServiceForm from "@/components/roles/admin/ServiceForm";
import { DetailLoading } from "@/components/ui/loading";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);
  const servicesStatus = useAppSelector((s) => s.services.status);

  useEffect(() => {
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  if (servicesStatus === "loading" || servicesStatus === "idle") {
    return <DetailLoading label="Loading service" />;
  }

  const service = services.find((s) => s.id === params.id) ?? null;

  if (!service) {
    return (
      <div className="bg-background min-h-screen p-8 text-sm text-muted-foreground">
        <Link href="/admin/services" className="mb-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft className="size-3" />
          Back to Service Management
        </Link>
        <p>Service not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-xs font-medium text-[#424753]">
            <span className="hover:text-primary">Dashboard</span>
            <span>›</span>
            <span className="hover:text-primary">Service Management</span>
            <span>›</span>
            <span className="font-semibold text-foreground">Edit Service</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">{service.name}</h1>
          <p className="text-sm text-muted-foreground">
            Update pricing, duration or availability. Changes reflect immediately in the customer portal.
          </p>
        </div>
        <ServiceForm initial={service} />
      </div>
    </div>
  );
}