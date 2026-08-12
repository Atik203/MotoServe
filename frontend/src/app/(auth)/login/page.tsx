"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ROLES: { role: string; label: string; email: string; password: string }[] = [
  { role: "owner", label: "Owner", email: "john.doe@example.com", password: "password123" },
  { role: "advisor", label: "Advisor", email: "sarah.jenkins@motorserve.com", password: "password123" },
  { role: "mechanic", label: "Mechanic", email: "alex.turner@motorserve.com", password: "password123" },
  { role: "admin", label: "Admin", email: "admin@motorserve.com", password: "admin123" },
];

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const doLogin = async (emailValue: string, passwordValue: string) => {
    setSubmitting(true);
    try {
      const res = await dispatch(loginUser({ email: emailValue, password: passwordValue })).unwrap();
      toast.success(`Welcome back, ${res.name}`);
      router.push(res.role === "owner" ? "/dashboard" : `/${res.role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    void doLogin(email.trim(), password);
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-background px-[32px] py-[48px]">
      <div className="flex w-full max-w-[440px] flex-col gap-[24px] rounded-[16px] border border-[#e2e8f0] bg-white p-[41px] shadow-[0_8px_15px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center gap-[16px]">
          <span className="flex size-[48px] items-center justify-center rounded-[8px] bg-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <KeyRound className="size-[18px] text-white" />
          </span>
          <span className="text-[24px] font-semibold tracking-[-0.6px] text-primary">MotoServe</span>
        </div>

        <div className="text-center">
          <h2 className="text-[24px] font-semibold tracking-[-0.6px] text-foreground">Welcome Back</h2>
          <p className="text-[14px] text-muted-foreground">Log in to manage your vehicle services and repairs.</p>
        </div>

        <form className="flex flex-col gap-[24px] py-[8px]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[8px]">
            <Label className="text-[12px] font-semibold tracking-[0.24px] text-foreground">Email Address</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-[16px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="name@workshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[44px] rounded-[8px] border-[#e2e8f0] pl-[45px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] font-semibold tracking-[0.24px] text-foreground">Password</Label>
              <span className="cursor-pointer text-[12px] font-semibold tracking-[0.24px] text-primary" onClick={() => router.push("/forgot-password")}>
                Forgot Password?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute top-1/2 left-[16px] size-[13.3px] -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[44px] rounded-[8px] border-[#e2e8f0] px-[45px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-[16px] -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="size-[17.9px]" /> : <Eye className="size-[17.9px]" />}
              </button>
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-[8px]">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} className="rounded-[4px] border-[#e2e8f0]" />
            <span className="text-[14px] text-[#424753]">Remember Me</span>
          </label>

          <Button type="submit" disabled={submitting} className="flex h-[44px] gap-[8px] rounded-[8px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            {submitting ? "Logging in..." : "Login"}
            <ArrowRight className="size-[11.7px]" />
          </Button>
        </form>

        <div className="border-t border-[#e2e8f0] pt-[25px]">
          <p className="text-center text-[14px] text-muted-foreground">
            Don&apos;t have an account?{" "}
            <span className="cursor-pointer font-medium text-primary" onClick={() => router.push("/register")}>
              Register
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-[8px] rounded-[8px] border border-dashed border-[#c2c6d5] bg-background p-[12px]">
          <p className="text-center text-[11px] font-semibold tracking-[0.6px] text-muted-foreground uppercase">
            Demo mode — quick login
          </p>
          <div className="grid grid-cols-4 gap-[8px]">
            {DEMO_ROLES.map((d) => (
              <button
                key={d.role}
                type="button"
                disabled={submitting}
                onClick={() => void doLogin(d.email, d.password)}
                className="rounded-[6px] bg-primary-soft py-[6px] text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
