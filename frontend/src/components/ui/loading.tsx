import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Status({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]", className)}>
      {children}
    </div>
  );
}

export function FaqLoading() {
  return (
    <Status label="Loading FAQ" className="w-full">
      <section className="flex w-full flex-col items-center gap-6 border-b border-border bg-white px-8 pt-12 pb-[49px]">
        <Skeleton className="h-11 w-96 max-w-full" />
        <Skeleton className="h-5 w-[672px] max-w-full" />
        <Skeleton className="h-5 w-[540px] max-w-full" />
        <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
      </section>
      <section className="mx-auto grid w-[960px] max-w-full grid-cols-12 gap-6 px-4 py-12">
        <aside className="col-span-3 flex flex-col gap-2">
          <Skeleton className="mb-4 h-7 w-28" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </aside>
        <div className="col-span-9 flex flex-col gap-4 pb-3.5">
          <Skeleton className="mb-2 h-8 w-64" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="size-3 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="flex w-full justify-center border-t border-border bg-[#f3f4f5] px-8 pt-[49px] pb-12">
        <Card className="flex w-full max-w-4xl flex-col items-center gap-2 rounded-lg p-[33px]">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-11 w-72 max-w-full" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-11 w-40 rounded" />
            <Skeleton className="h-11 w-44 rounded" />
          </div>
        </Card>
      </section>
    </Status>
  );
}

export function ServicesLoading() {
  return (
    <Status label="Loading services" className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-8 py-12">
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-5 w-[560px] max-w-full" />
      <div className="flex flex-wrap justify-center gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="w-[389px] max-w-full overflow-hidden rounded-xl">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="flex flex-col gap-3 p-6">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </Status>
  );
}

export function PricingLoading() {
  return (
    <Status label="Loading pricing" className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 p-8">
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-5 w-[520px] max-w-full" />
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-4 rounded-xl p-6">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="size-12 rounded-xl" />
            <Skeleton className="h-10 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
            <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
        ))}
      </div>
      <div className="flex w-full max-w-3xl flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-lg p-4">
            <Skeleton className="h-5 w-2/3" />
          </Card>
        ))}
      </div>
    </Status>
  );
}

export function TestimonialsLoading() {
  return (
    <Status label="Loading testimonials" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-8 py-12">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-5 w-[480px] max-w-full" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8 overflow-hidden rounded-xl">
          <Skeleton className="h-64 w-full rounded-none" />
          <div className="flex flex-col gap-2 p-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </Card>
        <Card className="col-span-4 flex flex-col gap-4 rounded-xl p-6">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-full" />
        </Card>
      </div>
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex w-[380px] max-w-full flex-1 flex-col gap-3 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </Card>
        ))}
      </div>
    </Status>
  );
}

export function HomeFeaturesLoading() {
  return (
    <Status label="Loading highlights" className="w-full border-y border-border bg-[#f3f4f5] py-[49px]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-8">
        <Skeleton className="mx-auto h-8 w-56 bg-white" />
        <div className="grid grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-[#f8f9fa] p-[25px]">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-6 w-2/3 pt-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </Status>
  );
}

export function DashboardLoading({ label = "Loading dashboard" }: { label?: string }) {
  return (
    <Status label={label} className="flex w-full flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex items-center gap-4 rounded-lg p-5">
            <Skeleton className="size-11 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 flex flex-col gap-3 rounded-lg p-6 lg:col-span-8">
          <Skeleton className="mb-2 h-6 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <Skeleton className="size-12 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </Card>
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          <Card className="flex flex-col gap-3 rounded-lg p-6">
            <Skeleton className="mb-1 h-6 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </Card>
          <Card className="flex flex-col gap-3 rounded-lg p-6">
            <Skeleton className="mb-1 h-6 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Status>
  );
}

export function TableLoading({ label = "Loading records", rows = 6 }: { label?: string; rows?: number }) {
  return (
    <Status label={label} className="flex w-full flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <Card className="overflow-hidden rounded-lg">
        <div className="flex gap-4 border-b border-border bg-muted/50 px-6 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-0">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </Card>
    </Status>
  );
}

export function CardsGridLoading({ label = "Loading items", count = 6 }: { label?: string; count?: number }) {
  return (
    <Status label={label} className="flex w-full flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden rounded-xl">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Status>
  );
}

export function RowsLoading({ label = "Loading items", count = 5 }: { label?: string; count?: number }) {
  return (
    <Status label={label} className="flex w-full flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex items-center gap-4 rounded-lg p-4">
          <Skeleton className="size-11 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </Card>
      ))}
    </Status>
  );
}

export function DetailLoading({ label = "Loading details" }: { label?: string }) {
  return (
    <Status label={label} className="flex min-h-screen w-full flex-col gap-6 bg-background p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <Card className="rounded-xl p-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
          <Card className="flex flex-col gap-4 rounded-xl p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="size-8 rounded-full" />
              ))}
            </div>
          </Card>
          <Card className="flex flex-col gap-3 rounded-xl p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </Card>
        </div>
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          <Card className="flex flex-col gap-3 rounded-xl p-6">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </Card>
        </div>
      </div>
    </Status>
  );
}

export function FormLoading({ label = "Loading form" }: { label?: string }) {
  return (
    <Status label={label} className="flex min-h-screen w-full flex-col gap-6 bg-background p-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Card className="flex w-full max-w-3xl flex-col gap-5 rounded-xl p-6">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </Card>
    </Status>
  );
}

export function ChatLoading({ label = "Loading conversations" }: { label?: string }) {
  return (
    <Status label={label} className="flex h-[calc(100vh-64px)] w-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-6 py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-80 shrink-0 flex-col gap-2 border-r border-border bg-white p-4">
          <Skeleton className="mb-2 h-10 w-full rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-background p-6">
          <div className="flex flex-1 flex-col justify-end gap-3">
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
            <Skeleton className="h-16 w-1/2 self-end rounded-2xl" />
            <Skeleton className="h-10 w-1/3 rounded-2xl" />
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        </div>
      </div>
    </Status>
  );
}

export function CenterCardLoading({ label = "Loading" }: { label?: string }) {
  return (
    <Status label={label} className="flex min-h-[calc(100vh-65px)] w-full items-center justify-center px-8">
      <Card className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-xl p-[33px]">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </Card>
    </Status>
  );
}
