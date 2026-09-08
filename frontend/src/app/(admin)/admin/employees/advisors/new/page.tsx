"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Headset, Info, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { createEmployee } from "@/store/slices/employeesSlice";

const DEPARTMENTS = ["Service Advisory", "Customer Relations", "Workshop Operations"];
const BRANCHES = ["Main HQ (Downtown)", "Main Bay / Station 01", "North Yard", "South Hub"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract"];
const SHIFTS = ["Morning (8AM - 4PM)", "Evening (4PM - 12AM)", "Rotational"];

const fieldLabel = "text-sm text-foreground";
const inputBase =
  "h-[42px] w-full rounded border border-[#6b7280] bg-white px-[13px] pl-[41px] text-sm text-foreground placeholder:text-[#6b7280] outline-none focus:border-primary";
const idInputBase = "h-[42px] w-full rounded border border-[#6b7280] bg-[#f3f4f5] px-[13px] pl-[41px] text-sm text-[#64748b]";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AddAdvisorPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    fullName: "",
    nid: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    department: "Service Advisory",
    branch: "",
    joiningDate: "",
    salary: "",
    experience: "",
  });
  const [employmentType, setEmploymentType] = useState("Full Time");
  const [shift, setShift] = useState("Morning (8AM - 4PM)");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const pickAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo exceeds 2MB limit");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const submit = async () => {
    if (!form.fullName || !form.email || !form.phone || !password) {
      toast.error("Please complete all required fields");
      return;
    }
    if (password.length < 6) {
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
          password,
          role: "advisor",
          station: form.branch || undefined,
          nid: form.nid.trim() || undefined,
          gender: form.gender || undefined,
          dateOfBirth: form.dob || undefined,
          street: form.address.trim() || undefined,
        }),
      ).unwrap();
      toast.success("Advisor account created");
      router.push("/admin/employees");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create advisor");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-1.5 text-sm text-[#64748b]">
            <span>Dashboard</span>
            <span>›</span>
            <span>Employee Management</span>
            <span>›</span>
            <span className="font-medium text-[#424753]">Add Service Advisor</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Add Service Advisor</h1>
          <p className="text-sm text-[#424753]">Create a new service advisor profile and assign system permissions.</p>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-9 flex flex-col gap-6">
            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="border-b border-[#e2e8f0] pb-[9px] text-xl font-semibold text-foreground">Personal Information</h2>

              <div className="flex items-center gap-6 pt-5">
                <div className="flex w-[104px] shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("adv-avatar")?.click()}
                    className="relative flex size-24 items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#c2c6d5] bg-[#edeeef] transition-colors hover:border-primary"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Advisor avatar" className="size-full object-cover" />
                    ) : (
                      <UserPlus className="size-7 text-[#424753]" />
                    )}
                  </button>
                  <input id="adv-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
                  <span className="text-xs text-[#64748b]">Profile Photo</span>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4">
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Full Name *</span>
                    <Input value={form.fullName} onChange={set("fullName")} placeholder="e.g. John Doe" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Employee ID</span>
                    <Input value="EMP-2026-089" readOnly className={idInputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>National ID / SSN</span>
                    <Input value={form.nid} onChange={set("nid")} placeholder="XXX-XX-XXXX" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Date of Birth</span>
                    <input type="date" value={form.dob} onChange={set("dob")} className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Gender</span>
                    <select value={form.gender} onChange={set("gender")} className={cn(inputBase, "appearance-none")}>
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <div className="hidden" />
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Phone Number *</span>
                    <Input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Email Address *</span>
                    <Input value={form.email} onChange={set("email")} type="email" placeholder="john.doe@motoserve.com" className={inputBase} />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1">
                    <span className={fieldLabel}>Residential Address</span>
                    <textarea value={form.address} onChange={set("address")} placeholder="Full street address..." className="min-h-20 w-full rounded border border-[#6b7280] bg-white px-[13px] py-3 text-sm text-foreground placeholder:text-[#6b7280] outline-none focus:border-primary" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Emergency Contact Name</span>
                    <Input value={form.emergencyName} onChange={set("emergencyName")} placeholder="Jane Doe" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Emergency Contact Number</span>
                    <Input value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="+1 (555) 999-9999" className={inputBase} />
                  </label>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="border-b border-[#e2e8f0] pb-[9px] text-xl font-semibold text-foreground">Employment Information</h2>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Department</span>
                    <select value={form.department} onChange={set("department")} className={cn(inputBase, "appearance-none")}>
                      {DEPARTMENTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Workshop Branch *</span>
                    <select value={form.branch} onChange={set("branch")} className={cn(inputBase, "appearance-none")}>
                      <option value="">Select Branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Joining Date</span>
                    <input type="date" value={form.joiningDate} onChange={set("joiningDate")} className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Monthly Salary (Base)</span>
                    <Input value={form.salary} onChange={set("salary")} placeholder="0.00" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Years of Experience</span>
                    <Input value={form.experience} onChange={set("experience")} placeholder="0" className={inputBase} />
                  </label>
                </div>

                <div>
                  <span className={fieldLabel}>Employment Type</span>
                  <div className="flex gap-2 pt-2">
                    {EMPLOYMENT_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEmploymentType(t)}
                        className={cn(
                          "rounded-[16px] border px-4 py-1.5 text-sm font-medium transition-colors",
                          employmentType === t ? "border-[#004492] bg-[rgba(0,68,146,0.1)] text-[#004492]" : "border-[#e2e8f0] bg-white text-[#424753]",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className={fieldLabel}>Work Shift</span>
                  <div className="flex gap-2 pt-2">
                    {SHIFTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setShift(s)}
                        className={cn(
                          "rounded-[16px] border px-4 py-1.5 text-sm font-medium transition-colors",
                          shift === s ? "border-[#004492] bg-[rgba(0,68,146,0.1)] text-[#004492]" : "border-[#e2e8f0] bg-white text-[#424753]",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#e2e8f0] pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className={fieldLabel}>Temporary Password *</span>
                      <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Minimum 6 characters" className={inputBase} />
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-3 flex flex-col gap-6">
            <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="relative h-16 bg-gradient-to-r from-[#004492] to-[#005bbf]" />
              <div className="px-[25px] pb-[25px]">
                <div className="relative -mt-10 flex items-end gap-3">
                  <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[rgba(0,68,146,0.1)] text-xl font-bold text-[#004492]">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initials(form.fullName || "New Advisor")}
                  </span>
                  <div className="pb-1">
                    <p className="text-base font-semibold text-foreground">{form.fullName || "New Advisor"}</p>
                    <p className="text-xs text-muted-foreground">Service Advisor</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 border-t border-[#e2e8f0] pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#424753]">ID</span>
                    <span className="font-medium text-foreground">EMP-2026-089</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#424753]">Status</span>
                    <span className="flex items-center gap-1.5 rounded-xl bg-[rgba(76,175,80,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#4caf50]">
                      <span className="size-1.5 rounded-full bg-[#4caf50]" />
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#424753]">Branch</span>
                    <span className="font-medium text-foreground">{form.branch || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#424753]">Shift</span>
                    <span className="font-medium text-foreground">{shift === SHIFTS[0] ? "Morning" : shift === SHIFTS[1] ? "Evening" : "Rotational"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e2e8f0] bg-[rgba(0,68,146,0.05)] p-[17px]">
              <p className="flex items-start gap-2 text-sm leading-5 text-[#424753]">
                <Info className="mt-0.5 size-4 shrink-0 text-[#004492]" />
                An email will be sent automatically to the new advisor with temporary login credentials upon account creation.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Button variant="outline" size="sm" onClick={() => toast.info("Draft saved locally")} className="rounded-[4px] border-[#e2e8f0] text-xs font-semibold text-[#004492]">
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/employees")} className="rounded-[4px] border-[#e2e8f0] text-xs font-semibold text-foreground">
                Cancel
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("Draft saved locally")} className="rounded-[4px] border-[#e2e8f0] text-xs font-semibold text-[#004492]">
                Save as Draft
              </Button>
              <Button size="sm" onClick={() => void submit()} disabled={submitting} className="gap-1.5 rounded-[4px] bg-[#004492] py-3 text-xs font-semibold text-white hover:bg-[#004492]/90">
                <Headset className="size-4" />
                {submitting ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}