"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Camera,
  CalendarDays,
  ChevronDown,
  Eye,
  EyeOff,
  Hash,
  HeartHandshake,
  Home,
  IdCard,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { registerUser } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const required = <span className="text-[#f44336]">*</span>;

function Field({
  label,
  required: isRequired,
  placeholder,
  type = "text",
  icon,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-base text-foreground">
        {label} {isRequired && required}
      </Label>
      <div className="relative">
        <Input type={type} placeholder={placeholder} className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
        {icon && <span className="absolute top-1/2 left-[15px] -translate-y-1/2 text-muted-foreground">{icon}</span>}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        registerUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      ).unwrap();
      toast.success("Account created — verification pending. You can log in once approved.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center gap-12 bg-background py-12">
      <div className="flex w-full max-w-7xl items-start overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
        <aside className="relative flex h-[900px] w-[460px] shrink-0 flex-col justify-between overflow-hidden border-r border-border bg-[#f3f4f5] py-12 pl-12 pr-[49px]">
          <div className="absolute -top-32 right-[-64px] size-64 rounded-xl bg-[rgba(0,82,204,0.05)] blur-[32px]" />
          <div className="absolute bottom-[-48px] left-[-48px] size-48 rounded-xl bg-[rgba(255,176,95,0.1)] blur-[20px]" />
          <div className="relative">
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Wrench className="size-[18px] text-white" />
            </span>
            <p className="mt-6 text-xl font-semibold text-foreground">Create Your MotoServe Account</p>
            <p className="mt-4 text-base leading-6 text-[#424753]">
              Register to manage your vehicles, book services, track repairs, approve repair estimates,
              make payments, and access your complete service history.
            </p>
          </div>
          <div className="relative overflow-hidden rounded border border-border bg-background shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Image src="/images/cars/ford-f150.png" alt="MotoServe workshop" width={460} height={205} className="h-auto w-full object-cover" />
          </div>
        </aside>

        <div className="flex-1 p-12">
          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
            <section className="flex flex-col gap-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base text-foreground">
                <Wrench className="size-4" />
                Personal Information
              </h2>

              <div className="flex items-center gap-4 pb-2">
                <span className="flex size-16 items-center justify-center rounded-xl border border-dashed border-[#727784] bg-[#edeeef]">
                  <Camera className="size-[22px] text-muted-foreground" />
                </span>
                <div>
                  <p className="text-base text-foreground">Profile Photo (Optional)</p>
                  <p className="text-base text-muted-foreground">JPG, PNG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Full Name {required}</Label>
                  <div className="relative">
                    <Input value={form.name} onChange={set("name")} placeholder="John Doe" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
                    <IdCard className="absolute top-1/2 left-[15px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Email Address {required}</Label>
                  <div className="relative">
                    <Input type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
                    <Mail className="absolute top-1/2 left-[15px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Phone Number {required}</Label>
                  <div className="relative">
                    <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
                    <Phone className="absolute top-1/2 left-[15px] size-[15px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Password {required}</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] px-[41px] text-base" />
                    <KeyRound className="absolute top-1/2 left-[15px] size-[13.3px] -translate-y-1/2 text-muted-foreground" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {showPassword ? <EyeOff className="size-[18.3px]" /> : <Eye className="size-[18.3px]" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Confirm Password {required}</Label>
                  <div className="relative">
                    <Input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] px-[41px] text-base" />
                    <KeyRound className="absolute top-1/2 left-[15px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <Field label="Date of Birth" placeholder="mm/dd/yyyy" icon={<CalendarDays className="size-[15px]" />} />
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Gender</Label>
                  <div className="relative">
                    <Input placeholder="Select Gender" className="h-[46px] cursor-pointer rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" readOnly />
                    <ChevronDown className="absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <Field label="National ID (NID)" required placeholder="Enter NID number" icon={<IdCard className="size-[16.7px]" />} />
                <Field label="Driving License Number" required placeholder="Enter license number" icon={<IdCard className="size-[15px]" />} />
                <Field label="Occupation (Optional)" placeholder="E.g. Software Engineer" icon={<Briefcase className="size-[16.7px]" />} />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base text-foreground">
                <Home className="size-[13.3px]" />
                Address Information
              </h2>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <div className="col-span-2">
                  <Field label="Street Address" required placeholder="123 Main St, Apt 4B" icon={<Home className="size-[13.3px]" />} />
                </div>
                <Field label="City" required placeholder="City" icon={<MapPin className="size-[15px]" />} />
                <Field label="District/State" required placeholder="District or State" icon={<Landmark className="size-[15px]" />} />
                <Field label="Zip / Postal Code" placeholder="12345" icon={<Hash className="size-[15px]" />} />
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Select Country</Label>
                  <div className="relative">
                    <Input placeholder="Country" className="h-[46px] cursor-pointer rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" readOnly />
                    <ChevronDown className="absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base text-foreground">
                <Phone className="size-[15px]" />
                Emergency Contact
              </h2>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <Field label="Contact Name" required placeholder="Jane Doe" icon={<User className="size-[15px]" />} />
                <Field label="Relationship" placeholder="e.g. Spouse, Parent" icon={<HeartHandshake className="size-[15px]" />} />
                <Field label="Contact Phone" required type="tel" placeholder="+1 (555) 000-0000" icon={<Phone className="size-[15px]" />} />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base text-foreground">
                <IdCard className="size-4" />
                Identity Verification
              </h2>
              <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[#c2c6d5] bg-[#f8f9fa] py-12">
                <Camera className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">NID / License document — JPG, PNG or PDF up to 5MB</p>
              </div>
            </section>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                By creating an account you agree to our <span className="font-medium text-primary">Privacy Policy</span>.
              </p>
              <div className="flex items-center gap-3">
                <span className="cursor-pointer text-sm font-medium text-primary hover:underline" onClick={() => router.push("/login")}>
                  Back to Login
                </span>
                <Button type="button" variant="outline" onClick={() => toast.info("Form reset (demo)")}>
                  Reset
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-md">
                  {submitting ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
