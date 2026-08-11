"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, Download, MapPin, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppointmentConfirmationPage() {
  const router = useRouter();
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-[16px]">
      <div className="w-full max-w-[768px] overflow-hidden rounded-[8px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
        <header className="flex flex-col items-center border-b border-[#e2e8f0] px-[32px] pt-[32px] pb-[25px]">
          <span className="flex size-[80px] items-center justify-center rounded-[12px] bg-[rgba(76,175,80,0.1)]">
            <CheckCircle2 className="size-[40px] text-[#4caf50]" />
          </span>
          <h1 className="pt-[8px] text-[24px] font-semibold tracking-[-0.24px] text-foreground">Appointment Confirmed!</h1>
          <p className="max-w-[512px] text-center text-[14px] leading-[20px] text-[#424753]">
            Your service appointment has been successfully scheduled. A confirmation email has been sent to your inbox.
          </p>
        </header>

        <div className="flex flex-col gap-[24px] bg-[#f8f9fa] px-[32px] pt-[32px] pb-[64px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-foreground">Appointment Details</h2>
            <span className="rounded-[12px] border border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] px-[13px] py-[5px] text-[12px] font-semibold tracking-[0.24px] text-primary">
              #MS-88291
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px] pb-[8px]">
            {[
              { icon: Wrench, label: "Vehicle", value: "2023 Ford F-150", sub: "A9C-1234" },
              { icon: Clock, label: "Schedule", value: "Aug 14, 2026", sub: "10:30 AM • Est. 2.5 Hours" },
            ].map((item) => (
              <div key={item.label} className="flex h-[104px] items-start gap-[16px] rounded-[4px] border border-[#e2e8f0] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-secondary">
                  <item.icon className="size-[18px] text-primary" />
                </span>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">{item.label}</p>
                  <p className="pt-[4px] text-[16px] font-medium text-foreground">{item.value}</p>
                  <p className="text-[14px] text-[#424753]">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="col-span-2 flex h-[98px] items-start gap-[16px] rounded-[4px] border border-[#e2e8f0] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-secondary">
                <Wrench className="size-[18px] text-primary" />
              </span>
              <div className="flex flex-1 flex-col gap-[8px]">
                <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">Requested Services</p>
                <div className="flex gap-[8px]">
                  {["Brake Service", "Tire Rotation"].map((s) => (
                    <span key={s} className="rounded-[12px] border border-[#e2e8f0] bg-[#edeeef] px-[13px] py-[6.5px] text-[14px] text-[#424753]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-2 flex h-[100px] items-start gap-[16px] rounded-[4px] border border-[#e2e8f0] bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-secondary">
                <MapPin className="size-[16px] text-primary" />
              </span>
              <div className="flex flex-1 gap-[24px]">
                <div className="flex-1">
                  <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">Workshop Address</p>
                  <p className="text-[14px] leading-[20px] text-foreground">
                    123 Precision Way
                    <br />
                    Automotive District, NY 10001
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-medium tracking-[0.55px] text-muted-foreground uppercase">Service Advisor</p>
                  <div className="flex items-center gap-[8px] pt-[4px]">
                    <span className="flex size-[32px] items-center justify-center rounded-[12px] border border-[#e2e8f0] bg-secondary">
                      <User className="size-[14px] text-muted-foreground" />
                    </span>
                    <span className="text-[14px] font-medium text-foreground">Sarah Jenkins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[12px] border-y border-dashed border-[#e2e8f0] py-[17px]">
            <span className="pr-[8px] text-[14px] text-muted-foreground">Add to Calendar:</span>
            {["Google", "Outlook", "Apple"].map((cal) => (
              <button key={cal} type="button" className="flex items-center gap-[6px] rounded-[4px] px-[12px] py-[6px] text-[12px] font-semibold tracking-[0.24px] text-primary hover:bg-muted">
                <Wrench className="size-[13.5px]" />
                {cal}
              </button>
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-[#e2e8f0] px-[24px] pt-[25px] pb-[24px]">
          <Button variant="outline" className="gap-[8px] rounded-[4px] px-[17px] py-[11px] text-[12px] font-semibold tracking-[0.24px]">
            <Download className="size-[12px]" />
            Download PDF
          </Button>
          <div className="flex gap-[12px]">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="rounded-[4px] border-primary px-[25px] py-[11px] text-[12px] font-semibold tracking-[0.24px] text-primary">
              View Dashboard
            </Button>
            <Button onClick={() => router.push("/dashboard/services/track")} className="gap-[8px] rounded-[4px] px-[24px] py-[10px] text-[12px] font-semibold tracking-[0.24px]">
              Track Appointment
              <ChevronRight className="size-[12px]" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
