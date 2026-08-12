"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-background px-[32px]">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col gap-[24px] rounded-[12px] border border-[#e2e8f0] bg-white p-[33px] shadow-[0_2px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col items-center gap-[4px]">
            <span className="flex w-[48px] items-center justify-center rounded-[12px] bg-[#d8e2ff] py-[10px]">
              <KeyRound className="size-[23.3px] text-primary" />
            </span>
            <h1 className="pt-[12px] text-[24px] font-semibold tracking-[-0.24px] text-foreground">Forgot Password?</h1>
            <p className="text-center text-[14px] leading-[20px] text-[#414754]">
              Enter your email address and we&apos;ll send you a link to
              <br />
              reset your password.
            </p>
          </div>

          <form
            className="flex flex-col gap-[24px]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) {
                toast.error("Please enter your email address");
                return;
              }
              toast.success("Reset link sent — check your inbox (demo)");
            }}
          >
            <div className="flex flex-col gap-[8px]">
              <Label className="text-[12px] font-semibold tracking-[0.24px] text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-[16px] size-[20px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@workshop.com"
                  className="h-[40px] rounded-[12px] border-[#e2e8f0] bg-[#f8f9fa] pl-[45px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[16px] pt-[8px]">
              <Button type="submit" className="h-[40px] rounded-[12px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-[4px] pt-[8px] text-[12px] font-semibold tracking-[0.24px] text-primary hover:underline"
              >
                <ArrowLeft className="size-[12px]" />
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
