"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  BellRing,
  CalendarCheck,
  Eye,
  EyeOff,
  FileText,
  History,
  KeyRound,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BENEFITS = [
  { icon: CalendarCheck, label: "Online Appointment Booking" },
  { icon: Wrench, label: "Live Repair Tracking" },
  { icon: FileText, label: "Digital Invoices" },
  { icon: History, label: "Service History" },
  { icon: BellRing, label: "Instant Notifications" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-start bg-white">
      <div className="relative flex h-screen flex-1 items-start justify-center overflow-hidden bg-[#edeeef]">
        <Image src="/images/register-bg.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-[rgba(0,91,191,0.9)] mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,91,191,0.8)] to-[rgba(0,91,191,0)]" />

        <div className="relative flex h-full w-full flex-col justify-between p-[96px]">
          <h1 className="text-[24px] font-bold tracking-[-0.6px] text-white">MotoServe</h1>
          <div>
            <h2 className="text-[36px] font-bold tracking-[-0.72px] text-white">Join MotoServe Today</h2>
            <div className="mt-[48px] flex flex-col gap-[24px]">
              {BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center">
                  <span className="mr-[16px] flex size-[40px] items-center justify-center rounded-[12px] bg-white/10 backdrop-blur-[2px]">
                    <b.icon className="size-[20px] text-white" />
                  </span>
                  <span className="text-[20px] font-semibold text-white">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen flex-1 items-center justify-center overflow-auto bg-white p-[96px]">
        <div className="flex w-full max-w-[448px] flex-col gap-[32px]">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Create Account</h2>
            <p className="text-[14px] text-[#414754]">Streamline your workshop management today.</p>
          </div>

          <form
            className="flex flex-col gap-[20px]"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Account created — verification pending");
              router.push("/login");
            }}
          >
            {[
              { label: "Full Name", placeholder: "John Doe", type: "text" },
              { label: "Email Address", placeholder: "john@example.com", type: "email" },
              { label: "Phone Number", placeholder: "+1 (555) 000-0000", type: "tel" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-[4px]">
                <Label className="text-[12px] font-semibold tracking-[0.24px] text-foreground">
                  {f.label} <span className="text-[#ba1a1a]">*</span>
                </Label>
                <Input type={f.type} placeholder={f.placeholder} className="h-[40px] rounded-[12px] border-[#e2e8f0]" />
              </div>
            ))}

            <div className="flex flex-col gap-[4px]">
              <Label className="text-[12px] font-semibold tracking-[0.24px] text-foreground">
                Password <span className="text-[#ba1a1a]">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-[40px] rounded-[12px] border-[#e2e8f0] pr-[41px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-[12px] -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-[18.3px]" /> : <Eye className="size-[18.3px]" />}
                </button>
              </div>
              <div className="flex items-center gap-[4px] pt-[4px]">
                <span className="h-[6px] w-[133px] rounded-full bg-[#4caf50]" />
                <span className="h-[6px] w-[133px] rounded-full bg-[#4caf50]" />
                <span className="h-[6px] w-[133px] rounded-full bg-[#e7e8e9]" />
                <span className="pl-[8px] text-[11px] font-medium text-[#414754]">Good</span>
              </div>
            </div>

            <div className="flex flex-col gap-[4px]">
              <Label className="text-[12px] font-semibold tracking-[0.24px] text-foreground">
                Confirm Password <span className="text-[#ba1a1a]">*</span>
              </Label>
              <Input type="password" placeholder="password" className="h-[40px] rounded-[12px] border-[#e2e8f0]" />
              <div className="flex items-center">
                <KeyRound className="mr-[6px] size-[13.3px] text-[#4caf50]" />
                <span className="text-[11px] font-medium text-[#4caf50]">Passwords match</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-start pb-[16px]">
              <Checkbox className="mt-[2px] rounded-[4px] border-[#e2e8f0]" />
              <span className="pl-[12px] text-[14px] text-[#414754]">
                I agree to the <span className="font-medium text-primary">Terms</span> &{" "}
                <span className="font-medium text-primary">Privacy Policy</span>.
              </span>
            </label>

            <Button type="submit" className="h-[40px] rounded-[12px]">
              Create Account
            </Button>
          </form>

          <p className="text-center text-[14px] text-[#414754]">
            Already have an account?{" "}
            <span className="cursor-pointer text-[12px] font-semibold tracking-[0.24px] text-primary" onClick={() => router.push("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
