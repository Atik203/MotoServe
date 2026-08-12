"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch } from "@/store/hooks";
import { createEmployee } from "@/store/slices/employeesSlice";

const fieldLabel = "text-xs font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "h-10 rounded border-[#e2e8f0] bg-white text-sm text-[#111827] placeholder:text-[#9ca3af]";
const selectBase =
  "h-10 w-full rounded border border-[#e2e8f0] bg-white px-[13px] text-sm text-[#424753] outline-none focus:border-primary";

interface AdvisorForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  desk: string;
  team: string;
  languages: string;
}

export default function AddServiceAdvisorPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<AdvisorForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    desk: "",
    team: "",
    languages: "",
  });
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof AdvisorForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      toast.error("Please complete all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        createEmployee({
          name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: "advisor",
          station: form.desk || undefined,
          specialization: form.team || undefined,
        }),
      ).unwrap();
      toast.success("Service advisor profile created");
      router.push("/admin/employees");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create advisor");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#64748b]">
            Dashboard
            <span className="mx-2">›</span>
            Employee Management
            <span className="mx-2">›</span>
            <span className="font-medium text-[#424753]">Add Service Advisor</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Add Service Advisor</h1>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Full Name</span>
              <Input value={form.fullName} onChange={set("fullName")} placeholder="e.g. John Doe" className={inputBase} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Email</span>
              <Input value={form.email} onChange={set("email")} type="email" placeholder="john.doe@motoserve.com" className={inputBase} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Phone</span>
              <Input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className={inputBase} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>
                Temporary Password <span className="text-[#f44336]">*</span>
              </span>
              <div className="relative">
                <Input
                  value={form.password}
                  onChange={set("password")}
                  type="password"
                  placeholder="Minimum 6 characters"
                  className={cn(inputBase, "pl-9")}
                />
                <KeyRound className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Employee ID</span>
              <Input value="Auto-generated" readOnly className={cn(inputBase, "bg-[#f3f4f5] text-[#424753]")} />
            </label>
            <label className="flex flex-col gap-1.5">
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
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Team</span>
              <select value={form.team} onChange={set("team")} className={selectBase}>
                <option value="" disabled>
                  Select Team...
                </option>
                <option>Commercial Fleet</option>
                <option>Retail</option>
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={fieldLabel}>Languages</span>
              <Input value={form.languages} onChange={set("languages")} placeholder="e.g. English, Arabic" className={inputBase} />
            </label>
            <div className="col-span-2 flex items-center justify-between rounded border border-[#e5e7eb] bg-background px-[17px] py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#111827]">Active</span>
                <span className="text-xs text-[#6b7280]">Employee can log in and manage appointments</span>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/employees")}
            className="h-[34px] rounded px-[17px] text-xs font-semibold tracking-[0.24px]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void submit()}
            disabled={submitting}
            className="h-[34px] gap-1 rounded px-4 text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <UserPlus className="size-3" />
            {submitting ? "Creating..." : "Create Advisor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
