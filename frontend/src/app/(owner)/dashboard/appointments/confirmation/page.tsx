"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Clock, Download, MapPin, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { downloadAppointmentPdf } from "@/lib/pdf";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AppointmentConfirmationPage() {
  const router = useRouter();
  const appointment = useAppSelector((s) => s.appointments.items[0]);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);

  const vehicle = appointment ? vehicles.find((v) => v.id === appointment.vehicleId) : undefined;
  const serviceNames = appointment
    ? appointment.serviceIds
        .map((id) => services.find((sv) => sv.id === id)?.name)
        .filter((n): n is string => Boolean(n))
    : [];

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
        <header className="flex flex-col items-center border-b border-[#e2e8f0] px-8 pt-8 pb-[25px]">
          <span className="flex size-20 items-center justify-center rounded-xl bg-[rgba(76,175,80,0.1)]">
            <CheckCircle2 className="size-10 text-[#4caf50]" />
          </span>
          <h1 className="pt-2 text-2xl font-semibold tracking-[-0.24px] text-foreground">Appointment Confirmed!</h1>
          <p className="max-w-lg text-center text-sm leading-5 text-[#424753]">
            Your service appointment has been successfully scheduled. A confirmation email has been sent to your inbox.
          </p>
        </header>

        <div className="flex flex-col gap-6 bg-[#f8f9fa] px-8 pt-8 pb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Appointment Details</h2>
            <span className="rounded-xl border border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] px-[13px] py-[5px] text-xs font-semibold tracking-[0.24px] text-primary">
              {appointment ? `#${appointment.id}` : "#MS-88291"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px] pb-2">
            {[
              {
                icon: Wrench,
                label: "Vehicle",
                value: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "2023 Ford F-150",
                sub: vehicle?.regNo ?? "A9C-1234",
              },
              {
                icon: Clock,
                label: "Schedule",
                value: appointment ? formatDate(appointment.date) : "Aug 14, 2026",
                sub: appointment ? `${appointment.time} • Est. ${serviceNames.length || 2.5} Services` : "10:30 AM • Est. 2.5 Hours",
              },
            ].map((item) => (
              <div key={item.label} className="flex h-[104px] items-start gap-4 rounded border border-[#e2e8f0] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <item.icon className="size-[18px] text-primary" />
                </span>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">{item.label}</p>
                  <p className="pt-1 text-base font-medium text-foreground">{item.value}</p>
                  <p className="text-sm text-[#424753]">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="col-span-2 flex h-[98px] items-start gap-4 rounded border border-[#e2e8f0] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Wrench className="size-[18px] text-primary" />
              </span>
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">Requested Services</p>
                <div className="flex flex-wrap gap-2">
                  {(serviceNames.length ? serviceNames : ["Brake Service", "Tire Rotation"]).map((s) => (
                    <span key={s} className="rounded-xl border border-[#e2e8f0] bg-[#edeeef] px-[13px] py-[6.5px] text-sm text-[#424753]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-2 flex h-[100px] items-start gap-4 rounded border border-[#e2e8f0] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <MapPin className="size-4 text-primary" />
              </span>
              <div className="flex flex-1 gap-6">
                <div className="flex-1">
                  <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">Workshop Address</p>
                  <p className="text-sm leading-5 text-foreground">
                    123 Precision Way
                    <br />
                    Automotive District, NY 10001
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">Service Advisor</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="flex size-8 items-center justify-center rounded-xl border border-[#e2e8f0] bg-secondary">
                      <User className="size-3.5 text-muted-foreground" />
                    </span>
                    <span className="text-sm font-medium text-foreground">Assigned at intake</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-y border-dashed border-[#e2e8f0] py-[17px]">
            <span className="pr-2 text-sm text-muted-foreground">Add to Calendar:</span>
            {["Google", "Outlook", "Apple"].map((cal) => (
              <button key={cal} type="button" className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold tracking-[0.24px] text-primary hover:bg-muted">
                <Wrench className="size-[13.5px]" />
                {cal}
              </button>
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-[#e2e8f0] px-6 pt-[25px] pb-6">
          <Button
            variant="outline"
            className="gap-2 rounded px-[17px] py-[11px] text-xs font-semibold tracking-[0.24px]"
            onClick={() => {
              if (appointment) {
                downloadAppointmentPdf(appointment, vehicle ?? null, serviceNames);
                toast.success("Appointment PDF downloaded");
              }
            }}
          >
            <Download className="size-3" />
            Download PDF
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded border-primary px-[25px] py-[11px] text-xs font-semibold tracking-[0.24px] text-primary">
              View Dashboard
            </Button>
            <Button onClick={() => router.push("/dashboard/services/track")} className="gap-2 rounded px-6 py-2.5 text-xs font-semibold tracking-[0.24px]">
              Track Appointment
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
