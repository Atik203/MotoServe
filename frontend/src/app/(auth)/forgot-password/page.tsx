"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch } from "@/store/hooks";
import { forgotPassword } from "@/store/slices/authSlice";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(forgotPassword(email.trim())).unwrap();
      toast.success("If an account exists for that email, a reset link has been sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-background px-8">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col gap-6 rounded-xl border border-[#e2e8f0] bg-white p-[33px] shadow-[0_2px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col items-center gap-1">
            <span className="flex w-12 items-center justify-center rounded-xl bg-[#d8e2ff] py-2.5">
              <KeyRound className="size-[23.3px] text-primary" />
            </span>
            <h1 className="pt-3 text-2xl font-semibold tracking-[-0.24px] text-foreground">Forgot Password?</h1>
            <p className="text-center text-sm leading-5 text-[#414754]">
              Enter your email address and we&apos;ll send you a link to
              <br />
              reset your password.
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@workshop.com"
                  className="h-10 rounded-xl border-[#e2e8f0] bg-[#f8f9fa] pl-[45px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <Button type="submit" disabled={submitting} className="h-10 rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                {submitting ? "Sending..." : "Send Reset Link"}
              </Button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-1 pt-2 text-xs font-semibold tracking-[0.24px] text-primary hover:underline"
              >
                <ArrowLeft className="size-3" />
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
