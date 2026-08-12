"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
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
    <div className="flex flex-col gap-[4px]">
      <Label className="text-[16px] text-foreground">
        {label} {isRequired && required}
      </Label>
      <div className="relative">
        <Input type={type} placeholder={placeholder} className="h-[46px] rounded-[6px] border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-[16px]" />
        {icon && <span className="absolute top-1/2 left-[15px] -translate-y-1/2 text-muted-foreground">{icon}</span>}
      </div>
    </div>
  );
}

export default function OwnerRegistrationPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center gap-[48px] bg-background">
      <header className="flex h-[64px] w-full items-center justify-between border-b border-border bg-white px-[32px]">
        <span className="flex items-center gap-[8px] text-[16px] font-bold tracking-[-0.4px] text-primary">
          <Wrench className="size-[16px]" />
          MotoServe
        </span>
        <span className="flex items-center gap-[4px] text-[16px] text-[#424753]">
          Already have an account?{" "}
          <span className="cursor-pointer font-medium text-primary hover:underline" onClick={() => router.push("/login")}>
            Login <ArrowRight className="ml-[2px] inline size-[10.7px]" />
          </span>
        </span>
      </header>

      <div className="flex w-full max-w-[1152px] items-start overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
        <aside className="relative flex h-[900px] w-[460px] shrink-0 flex-col justify-between overflow-hidden border-r border-border bg-[#f3f4f5] py-[48px] pl-[48px] pr-[49px]">
          <div className="absolute -top-[128px] right-[-64px] size-[256px] rounded-[12px] bg-[rgba(0,82,204,0.05)] blur-[32px]" />
          <div className="absolute bottom-[-48px] left-[-48px] size-[192px] rounded-[12px] bg-[rgba(255,176,95,0.1)] blur-[20px]" />
          <div className="relative">
            <p className="text-[16px] text-foreground">Create Your MotoServe Account</p>
            <p className="mt-[16px] text-[16px] leading-[24px] text-[#424753]">
              Register to manage your vehicles, book services, track repairs, approve repair estimates,
              make payments, and access your complete service history.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[4px] border border-border bg-background shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Image src="/images/cars/ford-f150.png" alt="MotoServe workshop" width={460} height={205} className="h-auto w-full object-cover" />
          </div>
        </aside>

        <div className="flex-1 p-[48px]">
          <form className="flex flex-col gap-[32px]" onSubmit={(e) => {
            e.preventDefault();
            toast.success("Registration submitted — pending verification");
            router.push("/login");
          }}>
            <section className="flex flex-col gap-[24px]">
              <h2 className="flex items-center gap-[8px] border-b border-border pb-[9px] text-[16px] text-foreground">
                <Wrench className="size-[16px]" />
                Personal Information
              </h2>

              <div className="flex items-center gap-[16px] pb-[8px]">
                <span className="flex size-[64px] items-center justify-center rounded-[12px] border border-dashed border-[#727784] bg-[#edeeef]">
                  <Camera className="size-[22px] text-muted-foreground" />
                </span>
                <div>
                  <p className="text-[16px] text-foreground">Profile Photo (Optional)</p>
                  <p className="text-[16px] text-muted-foreground">JPG, PNG up to 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <Field label="Full Name" required placeholder="John Doe" icon={<IdCard className="size-[16.7px]" />} />
                <Field label="Email Address" required type="email" placeholder="john@example.com" icon={<MailIcon />} />
                <Field label="Phone Number" required type="tel" placeholder="+1 (555) 000-0000" icon={<PhoneIcon />} />
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-[16px] text-foreground">Password {required}</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-[46px] rounded-[6px] border-[#c2c6d5] bg-[#f8f9fa] px-[41px]" />
                    <KeyRound className="absolute top-1/2 left-[15px] size-[13.3px] -translate-y-1/2 text-muted-foreground" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute top-1/2 right-[12px] -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {showPassword ? <EyeOff className="size-[18.3px]" /> : <Eye className="size-[18.3px]" />}
                    </button>
                  </div>
                </div>
                <Field label="Confirm Password" required type="password" placeholder="••••••••" icon={<KeyRound className="size-[16.7px]" />} />
                <Field label="Date of Birth" placeholder="mm/dd/yyyy" icon={<CalendarIcon />} />
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-[16px] text-foreground">Gender</Label>
                  <div className="relative">
                    <Input placeholder="Select Gender" className="h-[46px] cursor-pointer rounded-[6px] border-[#c2c6d5] bg-[#f8f9fa] pl-[41px]" readOnly />
                    <ChevronDown className="absolute top-1/2 right-[12px] size-[12px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <Field label="National ID (NID)" required placeholder="Enter NID number" icon={<IdCard className="size-[16.7px]" />} />
                <Field label="Driving License Number" required placeholder="Enter license number" icon={<IdCard className="size-[15px]" />} />
                <Field label="Occupation (Optional)" placeholder="E.g. Software Engineer" icon={<BriefcaseIcon />} />
              </div>
            </section>

            <section className="flex flex-col gap-[24px]">
              <h2 className="flex items-center gap-[8px] border-b border-border pb-[9px] text-[16px] text-foreground">
                <HomeIcon />
                Address Information
              </h2>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <div className="col-span-2">
                  <Field label="Street Address" required placeholder="123 Main St, Apt 4B" icon={<HomeIcon />} />
                </div>
                <Field label="City" required placeholder="City" icon={<CityIcon />} />
                <Field label="District/State" required placeholder="District or State" icon={<StateIcon />} />
                <Field label="Zip / Postal Code" placeholder="12345" icon={<ZipIcon />} />
                <div className="flex flex-col gap-[4px]">
                  <Label className="text-[16px] text-foreground">Select Country</Label>
                  <div className="relative">
                    <Input placeholder="Country" className="h-[46px] cursor-pointer rounded-[6px] border-[#c2c6d5] bg-[#f8f9fa] pl-[41px]" readOnly />
                    <ChevronDown className="absolute top-1/2 right-[12px] size-[12px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-[24px]">
              <h2 className="flex items-center gap-[8px] border-b border-border pb-[9px] text-[16px] text-foreground">
                <PhoneIcon />
                Emergency Contact
              </h2>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <Field label="Contact Name" required placeholder="Jane Doe" icon={<UserIcon />} />
                <Field label="Relationship" placeholder="e.g. Spouse, Parent" icon={<RelationshipIcon />} />
                <Field label="Contact Phone" required type="tel" placeholder="+1 (555) 000-0000" icon={<PhoneIcon />} />
              </div>
            </section>

            <section className="flex flex-col gap-[24px]">
              <h2 className="flex items-center gap-[8px] border-b border-border pb-[9px] text-[16px] text-foreground">
                <IdCard className="size-[16px]" />
                Identity Verification
              </h2>
              <div className="flex flex-col items-center justify-center gap-[8px] rounded-[6px] border border-dashed border-[#c2c6d5] bg-[#f8f9fa] py-[48px]">
                <Camera className="size-[24px] text-muted-foreground" />
                <p className="text-[14px] font-medium text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-[12px] text-muted-foreground">NID / License document — JPG, PNG or PDF up to 5MB</p>
              </div>
            </section>

            <div className="flex items-center justify-between border-t border-border pt-[24px]">
              <p className="text-[14px] text-muted-foreground">
                By creating an account you agree to our <span className="font-medium text-primary">Privacy Policy</span>.
              </p>
              <div className="flex items-center gap-[12px]">
                <span className="cursor-pointer text-[14px] font-medium text-primary hover:underline" onClick={() => router.push("/login")}>
                  Back to Login
                </span>
                <Button type="button" variant="outline" onClick={() => toast.info("Form reset (demo)")}>
                  Reset
                </Button>
                <Button type="submit" className="rounded-[6px]">
                  Create Account
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MailIcon() { return <Mail className="size-[16.7px]" />; }
function PhoneIcon() { return <Phone className="size-[15px]" />; }
function CalendarIcon() { return <CalendarDays className="size-[15px]" />; }
function BriefcaseIcon() { return <Briefcase className="size-[16.7px]" />; }
function HomeIcon() { return <Home className="size-[13.3px]" />; }
function CityIcon() { return <MapPin className="size-[15px]" />; }
function StateIcon() { return <Landmark className="size-[15px]" />; }
function ZipIcon() { return <Hash className="size-[15px]" />; }
function UserIcon() { return <User className="size-[15px]" />; }
function RelationshipIcon() { return <HeartHandshake className="size-[15px]" />; }
