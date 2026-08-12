"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch } from "@/store/hooks";
import { resetPassword } from "@/store/slices/authSlice";

function ResetPasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing reset token — request a new link");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      toast.success("Password reset — you can now log in");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
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
            <h1 className="pt-3 text-2xl font-semibold tracking-[-0.24px] text-foreground">Set a New Password</h1>
            <p className="text-center text-sm leading-5 text-[#414754]">
              Choose a new password for your account.
            </p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">New Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 size-[13.3px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-10 rounded-xl border-[#e2e8f0] bg-[#f8f9fa] pl-[45px]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 size-[13.3px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="h-10 rounded-xl border-[#e2e8f0] bg-[#f8f9fa] pl-[45px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <Button type="submit" disabled={submitting} className="h-10 rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                {submitting ? "Resetting..." : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
