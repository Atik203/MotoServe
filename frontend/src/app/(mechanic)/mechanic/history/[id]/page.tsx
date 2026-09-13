"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Check,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Package,
  User,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { cn } from "@/lib/utils";
import { DetailLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STEP_ORDER = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

export default function MechanicHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);

  useEffect(() => {
    if (tasksStatus === "idle") dispatch(fetchTasks());
  }, [dispatch, tasksStatus]);

  if (tasksStatus === "loading" && tasks.length === 0) {
    return <DetailLoading label="Loading task history" />;
  }

  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <Link
            href="/mechanic/history"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to History
          </Link>
          <p className="text-sm text-muted-foreground">Task not found.</p>
        </div>
      </div>
    );
  }

  const vehicle = task.vehicle;
  const customer = task.customer;
  const mechanics = task.mechanics && task.mechanics.length > 0
    ? task.mechanics.map((m) => m.name).join(", ")
    : task.mechanic?.name ?? task.mechanicId ?? "—";
  const completedIdx = STEP_ORDER.length - 1;
  const partsTotal = task.partsUsed.reduce((s, p) => s + p.subtotal, 0);
  const servicesTotal = task.services.reduce((s, sv) => s + sv.price, 0);
  const isReady = task.status === "ready";

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href="/mechanic/history"
              className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Back to History
            </Link>
            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-[22px] font-bold text-foreground">{taskId}</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize",
                  isReady
                    ? "bg-[rgba(255,193,7,0.1)] text-[#8b5000]"
                    : "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
                )}
              >
                <CheckCircle2 className="size-3.5" />
                {task.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Parts Used", value: task.partsUsed.reduce((s, p) => s + p.qty, 0), icon: Package, color: "bg-[rgba(0,82,204,0.1)] text-primary" },
            { label: "Services", value: task.services.length, icon: Wrench, color: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
            { label: "Notes", value: task.notes.length, icon: ClipboardList, color: "bg-[rgba(139,80,0,0.1)] text-[#8b5000]" },
            { label: "Total Parts Cost", value: `$${partsTotal.toFixed(2)}`, icon: DollarSign, color: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex h-[90px] flex-col justify-between rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={cn("flex size-7 items-center justify-center rounded-lg", stat.color)}>
                  <stat.icon className="size-3.5" />
                </span>
              </div>
              <span className="text-2xl font-bold text-[#111827]">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 flex flex-col gap-6">

            <section className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="border-b border-border px-6 py-4">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Vehicle & Customer</h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 p-6">
                {[
                  { label: "Vehicle", value: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : task.vehicleId },
                  { label: "Registration", value: vehicle?.regNo ?? "—" },
                  { label: "Fuel Type", value: vehicle?.fuelType ?? "—" },
                  { label: "Customer", value: customer?.name ?? task.customerId },
                  { label: "Mechanic(s)", value: mechanics },
                  { label: "Advisor", value: task.advisor?.name ?? task.advisorId },
                  { label: "Station", value: task.station ?? "—" },
                  { label: "Priority", value: task.priority },
                  { label: "Mileage In", value: task.mileage ? `${task.mileage.toLocaleString()} mi` : "—" },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</span>
                    <span className="text-sm font-medium capitalize text-foreground">{f.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {task.services.length > 0 && (
              <section className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="size-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Services Performed</h2>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-[#f9fafb] hover:bg-[#f9fafb]">
                      <TableHead className="text-xs font-medium uppercase text-muted-foreground">Service</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {task.services.map((sv) => (
                      <TableRow key={sv.id} className="border-border">
                        <TableCell className="text-sm font-medium text-foreground">{sv.name}</TableCell>
                        <TableCell className="text-right text-sm text-foreground">${sv.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-border bg-[#f9fafb]">
                      <TableCell className="text-sm font-semibold text-foreground">Services Total</TableCell>
                      <TableCell className="text-right text-sm font-bold text-foreground">${servicesTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </section>
            )}

            {task.partsUsed.length > 0 && (
              <section className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-[#8b5000]" />
                    <h2 className="text-sm font-semibold text-foreground">Parts Used</h2>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-[#f9fafb] hover:bg-[#f9fafb]">
                      <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part</TableHead>
                      <TableHead className="text-xs font-medium uppercase text-muted-foreground">Supplier</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Qty</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Unit Price</TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {task.partsUsed.map((p) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="text-sm font-medium text-foreground">{p.name}</TableCell>
                        <TableCell className="text-sm text-[#64748b]">{p.supplier}</TableCell>
                        <TableCell className="text-right text-sm text-foreground">{p.qty}</TableCell>
                        <TableCell className="text-right text-sm text-foreground">${p.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-foreground">${p.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-border bg-[#f9fafb]">
                      <TableCell colSpan={4} className="text-sm font-semibold text-foreground">Parts Total</TableCell>
                      <TableCell className="text-right text-sm font-bold text-foreground">${partsTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </section>
            )}

            {task.notes.length > 0 && (
              <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <ClipboardList className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Repair Notes</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {task.notes.map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                        <User className="size-3.5 text-primary" />
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{note.author}</span>
                          <span className="text-xs text-muted-foreground">{note.time}</span>
                        </div>
                        <p className="text-sm text-[#424753]">{note.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-5 rounded-[8px] border border-border bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <CheckCircle2 className="size-4 text-[#4caf50]" />
                <h2 className="text-sm font-semibold text-foreground">Repair Timeline</h2>
              </div>
              <div className="relative flex flex-col gap-5 pb-2 pl-6">
                <div className="absolute top-2 bottom-4 left-[11px] w-0.5 bg-border" />
                {task.progress.map((step, i) => {
                  const isDone = step.done;
                  return (
                    <div key={step.step} className="relative flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "absolute -left-6 top-0 flex size-[22px] items-center justify-center rounded-full border-2",
                          isDone ? "border-[#4caf50] bg-[#4caf50] text-white" : "border-border bg-muted",
                        )}
                      >
                        {isDone && <Check className="size-3" />}
                      </span>
                      <p className={cn("text-xs tracking-[0.24px]", isDone ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>
                        {step.label}
                      </p>
                      {step.timestamp && (
                        <p className="text-[11px] text-muted-foreground">{step.timestamp}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {task.photos && task.photos.length > 0 && (
              <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h2 className="border-b border-border pb-3 text-sm font-semibold text-foreground">Repair Photos</h2>
                <div className="grid grid-cols-2 gap-2">
                  {(task.photos as string[]).map((src, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-[6px] border border-border bg-muted">
                      <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="rounded-[8px] border border-border bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="border-b border-border pb-3 text-sm font-semibold text-foreground">Cost Summary</h2>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Services</span>
                  <span className="font-medium text-foreground">${servicesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts</span>
                  <span className="font-medium text-foreground">${partsTotal.toFixed(2)}</span>
                </div>
                <div className="my-2 border-t border-border" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${(servicesTotal + partsTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
