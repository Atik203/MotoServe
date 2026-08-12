"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import {
  ArrowRight,
  CalendarCheck,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DEMO_ROLES: {
  role: string;
  label: string;
  email: string;
  password: string;
}[] = [
  {
    role: "owner",
    label: "Owner",
    email: "john.doe@example.com",
    password: "password123",
  },
  {
    role: "advisor",
    label: "Advisor",
    email: "sarah.jenkins@motorserve.com",
    password: "password123",
  },
  {
    role: "mechanic",
    label: "Mechanic",
    email: "alex.turner@motorserve.com",
    password: "password123",
  },
  {
    role: "admin",
    label: "Admin",
    email: "admin@motorserve.com",
    password: "admin123",
  },
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
      const res = await dispatch(
        loginUser({ email: emailValue, password: passwordValue }),
      ).unwrap();
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
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-background px-8 py-12">
      <div className="flex w-full max-w-7xl items-stretch overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="relative flex w-[460px] shrink-0 flex-col justify-between overflow-hidden border-r border-[#e2e8f0] bg-white px-10 py-10">
        <div className="absolute -top-[10%] right-[60%] bottom-[60%] -left-[10%] rounded-xl bg-[rgba(0,82,204,0.05)] blur-[32px]" />
        <div className="absolute top-1/2 -right-[10%] -bottom-[10%] left-[50%] rounded-xl bg-[rgba(0,91,191,0.1)] blur-[32px]" />

        <div className="relative flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded bg-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <WrenchSmall />
          </span>
          <span className="w-[146px] text-2xl font-semibold tracking-[-0.6px] text-primary">
            MotoServe
          </span>
        </div>

        <div className="relative flex max-w-lg flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">
            Professional Workshop
            <br />
            Management.
          </h1>
          <p className="text-base leading-[26px] text-muted-foreground">
            Streamline your vehicle services, manage job cards efficiently, and
            keep your inventory in check with precision-engineered tools.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[rgba(243,244,245,0.8)] p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[rgba(76,175,80,0.1)]">
                <CalendarCheck className="size-[16.7px] text-[#4caf50]" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.6px] text-foreground uppercase">
                  Job Cards
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Streamlined workflow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[rgba(243,244,245,0.8)] p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[rgba(0,82,204,0.1)]">
                <Package className="size-[16.7px] text-primary" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.6px] text-foreground uppercase">
                  Inventory
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Real-time tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#f8f9fa] p-8">
        <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-[41px] shadow-[0_8px_15px_rgba(0,0,0,0.04)]">
          <div className="flex justify-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <KeyRound className="size-[18px] text-white" />
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.6px] text-foreground">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground">
              Log in to manage your vehicle services and repairs.
            </p>
          </div>

          <form
            className="flex flex-col gap-6 py-2"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-4 size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@workshop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border-[#e2e8f0] pl-[45px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">
                  Password
                </Label>
                <span
                  className="cursor-pointer text-xs font-semibold tracking-[0.24px] text-primary"
                  onClick={() => router.push("/forgot-password")}
                >
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 size-[13.3px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border-[#e2e8f0] px-[45px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="size-[17.9px]" />
                  ) : (
                    <Eye className="size-[17.9px]" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="rounded border-[#e2e8f0]"
              />
              <span className="text-sm text-[#424753]">Remember Me</span>
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="flex h-11 gap-2 rounded-lg shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              {submitting ? "Logging in..." : "Login"}
              <ArrowRight className="size-[11.7px]" />
            </Button>
          </form>

          <div className="border-t border-[#e2e8f0] pt-[25px]">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <span
                className="cursor-pointer font-medium text-primary"
                onClick={() => router.push("/register")}
              >
                Register
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[#c2c6d5] bg-background p-3">
            <p className="text-center text-[11px] font-semibold tracking-[0.6px] text-muted-foreground uppercase">
              Demo mode — quick login
            </p>
            <div className="grid grid-cols-4 gap-2">
              {DEMO_ROLES.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  disabled={submitting}
                  onClick={() => void doLogin(d.email, d.password)}
                  className="rounded-md bg-primary-soft py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function WrenchSmall() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      className="size-[15px]"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
