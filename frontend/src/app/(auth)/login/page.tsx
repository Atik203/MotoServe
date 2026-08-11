"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CalendarCheck, Eye, EyeOff, KeyRound, Lock, Mail, Package } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ROLES: { role: string; label: string; email: string; password: string; href: string }[] = [
  { role: "owner", label: "Owner", email: "john.doe@example.com", password: "password123", href: "/dashboard" },
  { role: "advisor", label: "Advisor", email: "sarah.jenkins@motorserve.com", password: "password123", href: "/advisor" },
  { role: "mechanic", label: "Mechanic", email: "alex.turner@motorserve.com", password: "password123", href: "/mechanic" },
  { role: "admin", label: "Admin", email: "admin@motorserve.com", password: "admin123", href: "/admin" },
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
    <div className="flex min-h-screen items-start bg-background">
      <div className="relative flex h-screen w-[576px] shrink-0 flex-col justify-between overflow-hidden border-r border-[#e2e8f0] bg-white">
        <div className="absolute -top-[10%] right-[60%] bottom-[60%] -left-[10%] rounded-[12px] bg-[rgba(0,82,204,0.05)] blur-[32px]" />
        <div className="absolute top-1/2 -right-[10%] -bottom-[10%] left-[50%] rounded-[12px] bg-[rgba(0,91,191,0.1)] blur-[32px]" />

        <div className="relative flex items-center gap-[8px] p-[32px]">
          <span className="flex size-[32px] items-center justify-center rounded-[4px] bg-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <WrenchSmall />
          </span>
          <span className="w-[146px] text-[24px] font-semibold tracking-[-0.6px] text-primary">MotoServe</span>
        </div>

        <div className="relative flex max-w-[512px] flex-col gap-[16px] px-[32px] pb-[48px]">
          <h1 className="text-[36px] font-bold tracking-[-0.72px] text-foreground">
            Professional Workshop
            <br />
            Management.
          </h1>
          <p className="text-[16px] leading-[26px] text-muted-foreground">
            Streamline your vehicle services, manage job cards efficiently, and keep your inventory in
            check with precision-engineered tools.
          </p>
          <div className="flex gap-[16px] pt-[16px]">
            <div className="flex items-center gap-[8px] rounded-[8px] border border-[#e2e8f0] bg-[rgba(243,244,245,0.8)] p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
              <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-[rgba(76,175,80,0.1)]">
                <CalendarCheck className="size-[16.7px] text-[#4caf50]" />
              </span>
              <div>
                <p className="text-[12px] font-semibold tracking-[0.6px] text-foreground uppercase">Job Cards</p>
                <p className="text-[11px] font-medium text-muted-foreground">Streamlined workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-[8px] rounded-[8px] border border-[#e2e8f0] bg-[rgba(243,244,245,0.8)] p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
              <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-[rgba(0,82,204,0.1)]">
                <Package className="size-[16.7px] text-primary" />
              </span>
              <div>
                <p className="text-[12px] font-semibold tracking-[0.6px] text-foreground uppercase">Inventory</p>
                <p className="text-[11px] font-medium text-muted-foreground">Real-time tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen flex-1 items-center justify-center bg-[#f8f9fa] p-[32px]">
        <div className="flex w-[440px] max-w-full flex-col gap-[24px] rounded-[16px] border border-[#e2e8f0] bg-white p-[41px] shadow-[0_8px_15px_rgba(0,0,0,0.04)]">
          <div className="flex justify-center">
            <span className="flex size-[48px] items-center justify-center rounded-[8px] bg-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <KeyRound className="size-[18px] text-white" />
            </span>
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
    </div>
  );
}

function WrenchSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="size-[15px]">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
