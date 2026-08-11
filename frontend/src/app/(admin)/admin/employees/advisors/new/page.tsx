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

interface AdvisorForm {
  fullName: string;
  email: string;
  phone: string;
  desk: string;
  team: string;
  languages: string;
}

export default function AddServiceAdvisorPage() {
  const router = useRouter();
  const [form, setForm] = useState<AdvisorForm>({
    fullName: "",
    email: "",
    phone: "",
    desk: "",
    team: "",
    languages: "",
  });
  const [active, setActive] = useState(true);

  const set = (key: keyof AdvisorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = () => {
    if (!form.fullName || !form.email || !form.phone) {
      toast.error("Please complete all required fields");
      return;
    }
    toast.success("Service advisor profile created");
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
            <span className="font-medium text-[#424753]">Add Service Advisor</span>
          </p>
          <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Add Service Advisor</h1>
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
              <Input value="EMP-006" readOnly className={cn(inputBase, "bg-[#f3f4f5] text-[#424753]")} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Assigned Desk</span>
              <select value={form.desk} onChange={set("desk")} className={selectBase}>
                <option value="" disabled>
                  Select Desk...
                </option>
                <option>Front Desk 01</option>
                <option>Front Desk 02</option>
                <option>Front Desk 03</option>
              </select>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={fieldLabel}>Team</span>
              <select value={form.team} onChange={set("team")} className={selectBase}>
                <option value="" disabled>
                  Select Team...
                </option>
                <option>Commercial Fleet</option>
                <option>Retail</option>
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-[6px]">
              <span className={fieldLabel}>Languages</span>
              <Input value={form.languages} onChange={set("languages")} placeholder="e.g. English, Arabic" className={inputBase} />
            </label>
            <div className="col-span-2 flex items-center justify-between rounded-[4px] border border-[#e5e7eb] bg-background px-[17px] py-[14px]">
              <div className="flex flex-col gap-[2px]">
                <span className="text-[14px] font-semibold text-[#111827]">Active</span>
                <span className="text-[12px] text-[#6b7280]">Employee can log in and manage appointments</span>
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
            Create Advisor
          </Button>
        </div>
      </div>
    </div>
  );
}
