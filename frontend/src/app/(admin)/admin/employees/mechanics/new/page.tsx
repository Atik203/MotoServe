"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const fieldLabel = "text-[12px] font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "h-[40px] rounded-[4px] border-[#e2e8f0] bg-white text-[14px] text-[#111827] placeholder:text-[#9ca3af]";
const selectBase =
  "h-[40px] w-full rounded-[4px] border border-[#e2e8f0] bg-white px-[13px] text-[14px] text-[#424753] outline-none focus:border-primary";
const textareaBase =
  "h-[96px] w-full resize-none rounded-[4px] border border-[#e2e8f0] bg-white px-[13px] py-[11px] text-[14px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-primary";

interface MechanicForm {
  fullName: string;
  email: string;
  phone: string;
  station: string;
  specialization: string;
  skills: string;
  certifications: string;
}

export default function AddMechanicPage() {
  const router = useRouter();
  const [form, setForm] = useState<MechanicForm>({
    fullName: "",
    email: "",
    phone: "",
    station: "",
    specialization: "",
    skills: "",
    certifications: "",
  });
  const [active, setActive] = useState(true);

  const set = (key: keyof MechanicForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = () => {
    if (!form.fullName || !form.email || !form.phone) {
      toast.error("Please complete all required fields");
      return;
    }
    toast.success("Mechanic profile created");
    router.push("/admin/employees");
  };

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex flex-col gap-[8px]">
          <p className="text-[14px] text-[#64748b]">
            Dashboard
            <span className="mx-[8px]">›</span>
            Employee Management
            <span className="mx-[8px]">›</span>
            <span className="font-medium text-[#424753]">Add Mechanic</span>
          </p>
          <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Add Mechanic</h1>
        </div>

        <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Full Name</span>
              <Input value={form.fullName} onChange={set("fullName")} placeholder="e.g. John Doe" className={inputBase} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Email</span>
              <Input value={form.email} onChange={set("email")} type="email" placeholder="john.doe@motoserve.com" className={inputBase} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Phone</span>
              <Input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className={inputBase} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Employee ID</span>
              <Input value="EMP-005" readOnly className={cn(inputBase, "bg-[#f3f4f5] text-[#424753]")} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Station</span>
              <select value={form.station} onChange={set("station")} className={selectBase}>
                <option value="" disabled>
                  Select Station...
                </option>
                <option>Main Bay / Station 01</option>
                <option>Main Bay / Station 02</option>
                <option>Main Bay / Station 03</option>
                <option>Main Bay / Station 04</option>
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Specialization</span>
              <select value={form.specialization} onChange={set("specialization")} className={selectBase}>
                <option value="" disabled>
                  Select Specialization...
                </option>
                <option>Engine & Diagnostics</option>
                <option>Brakes & Suspension</option>
                <option>Electrical & AC</option>
                <option>General</option>
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-[6px]">
              <span className={fieldLabel}>Skills</span>
              <textarea
                value={form.skills}
                onChange={set("skills")}
                placeholder="e.g. OEM diagnostic tools, hydraulic systems..."
                className={textareaBase}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-[6px]">
              <span className={fieldLabel}>Certifications</span>
              <textarea
                value={form.certifications}
                onChange={set("certifications")}
                placeholder="e.g. ASE Master Technician, EV Certification..."
                className={textareaBase}
              />
            </label>
            <div className="col-span-2 flex items-center justify-between rounded-[4px] border border-[#e5e7eb] bg-background px-[17px] py-[14px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[14px] font-semibold text-[#111827]">Active</span>
                <span className="text-[12px] text-[#6b7280]">Employee can log in and receive work assignments</span>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-[12px]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/employees")}
            className="h-[34px] rounded-[4px] px-[17px] text-[12px] font-semibold tracking-[0.24px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            className="h-[34px] gap-[4px] rounded-[4px] px-[16px] text-[12px] font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <UserPlus className="size-[12px]" />
            Create Mechanic
          </Button>
        </div>
      </div>
    </div>
  );
}
