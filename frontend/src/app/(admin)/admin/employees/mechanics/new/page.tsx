"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  User as UserIcon,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { createEmployee } from "@/store/slices/employeesSlice";

const BRANCHES = ["Main Bay / Station 01", "Main Bay / Station 02", "Main Bay / Station 03", "Main Bay / Station 04"];

const SPECIALIZATIONS = [
  "Engine & Diagnostics",
  "Brakes & Suspension",
  "Electrical & AC",
  "General",
];

const SKILL_CHOICES = ["Oil Change", "Diagnostics", "Tire Alignment", "Suspension", "Exhaust Systems"];

const PERMISSIONS = [
  { key: "viewJobs", label: "View Assigned Jobs (Default)" },
  { key: "updateProgress", label: "Update Job Progress" },
  { key: "requestParts", label: "Request/Add Inventory Parts" },
  { key: "markComplete", label: "Mark Job as Complete" },
  { key: "uploadPhotos", label: "Upload Inspection Photos" },
  { key: "directChat", label: "Direct Chat with Service Advisor" },
];

const fieldLabel = "text-sm text-foreground";
const inputBase =
  "h-[42px] w-full rounded border border-[#6b7280] bg-white px-[13px] text-sm text-foreground placeholder:text-[#6b7280] outline-none focus:border-primary";
const idInputBase = "h-[42px] w-full rounded border border-[#6b7280] bg-[#f3f4f5] px-[13px] text-sm text-[#424753]";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AddMechanicPage() {
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
    branch: "",
    joiningDate: "",
    employmentType: "Full Time",
    salary: "",
    experience: "",
    status: "Available",
  });
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountActive, setAccountActive] = useState(true);
  const [specialization, setSpecialization] = useState("");
  const [skills, setSkills] = useState<string[]>(["Oil Change", "Diagnostics"]);
  const [customSkill, setCustomSkill] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    viewJobs: true,
    updateProgress: true,
    requestParts: true,
    markComplete: true,
    uploadPhotos: true,
    directChat: false,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const addCustomSkill = () => {
    const v = customSkill.trim();
    if (!v) return;
    if (!skills.includes(v)) setSkills((prev) => [...prev, v]);
    setCustomSkill("");
  };

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
          role: "mechanic",
          station: form.branch || undefined,
          specialization: specialization || undefined,
          nid: form.nid.trim() || undefined,
          gender: form.gender || undefined,
          dateOfBirth: form.dob || undefined,
          street: form.address.trim() || undefined,
        }),
      ).unwrap();
      toast.success("Mechanic account created");
      router.push("/admin/employees");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create mechanic");
      setSubmitting(false);
    }
  };

  const selectCls = cn(inputBase, "appearance-none pr-8");

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-sm text-[#64748b]">
            <span>Dashboard</span>
            <span>›</span>
            <span>Employee Management</span>
            <span>›</span>
            <span className="font-medium text-[#424753]">Add Mechanic</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Add Mechanic</h1>
          <p className="text-sm text-[#424753]">Create a new mechanic profile and assign system permissions.</p>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)]">
                  <UserIcon className="size-5 text-[#004492]" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
              </div>

              <div className="flex items-start gap-6 pt-5">
                <div className="flex w-[104px] shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("mech-avatar")?.click()}
                    className="relative flex size-24 items-center justify-center overflow-hidden rounded-[12px] border-2 border-dashed border-[#c2c6d5] bg-[#e7e8e9] transition-colors hover:border-primary"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Mechanic avatar" className="size-full object-cover" />
                    ) : (
                      <UserPlus className="size-7 text-[#424753]" />
                    )}
                  </button>
                  <input id="mech-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
                  <span className="text-center text-[11px] font-medium text-[#424753]">
                    Upload Photo
                    <br />
                    (Max 2MB)
                  </span>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4">
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Full Name</span>
                    <Input value={form.fullName} onChange={set("fullName")} placeholder="e.g. John Doe" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Employee ID (Auto)</span>
                    <Input value="EMP-MEC-2026-001" readOnly className={idInputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>National ID / Passport</span>
                    <Input value={form.nid} onChange={set("nid")} placeholder="Enter ID number" className={inputBase} />
                  </label>
                  <div className="flex gap-3">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className={fieldLabel}>Date of Birth</span>
                      <input type="date" value={form.dob} onChange={set("dob")} className={inputBase} />
                    </label>
                    <label className="flex flex-1 flex-col gap-1">
                      <span className={fieldLabel}>Gender</span>
                      <select value={form.gender} onChange={set("gender")} className={cn(selectCls, "relative")}>
                        <option value="">Select...</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </label>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Phone Number</span>
                    <Input value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Email Address</span>
                    <Input value={form.email} onChange={set("email")} type="email" placeholder="john.doe@motoserve.com" className={inputBase} />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1">
                    <span className={fieldLabel}>Residential Address</span>
                    <textarea value={form.address} onChange={set("address")} placeholder="Full residential address..." className="min-h-20 w-full rounded border border-[#6b7280] bg-white px-[13px] py-3 text-sm text-foreground placeholder:text-[#6b7280] outline-none focus:border-primary" />
                  </label>
                </div>
              </div>

              <div className="mt-5 rounded-[4px] border border-[#e5e7eb] bg-[#f3f4f5] p-[17px]">
                <h3 className="flex items-center gap-2 pb-3 text-xs font-semibold tracking-[0.24px] text-foreground">
                  <AlertTriangle className="size-4 text-[#004492]" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input value={form.emergencyName} onChange={set("emergencyName")} placeholder="Contact Name" className={inputBase} />
                  <Input value={form.emergencyPhone} onChange={set("emergencyPhone")} placeholder="Contact Phone" className={inputBase} />
                </div>
              </div>
            </section>

            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)]">
                  <Users className="size-5 text-[#004492]" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">Employment Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-5">
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Workshop Branch</span>
                  <select value={form.branch} onChange={set("branch")} className={cn(inputBase, "appearance-none")}>
                    <option value="">Select Branch...</option>
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
                  <span className={fieldLabel}>Employment Type</span>
                  <select value={form.employmentType} onChange={set("employmentType")} className={cn(inputBase, "appearance-none")}>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Contract</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Monthly Salary ($)</span>
                  <Input value={form.salary} onChange={set("salary")} placeholder="e.g. 4500" className={inputBase} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Years of Experience</span>
                  <Input value={form.experience} onChange={set("experience")} placeholder="e.g. 5" className={inputBase} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Current Status</span>
                  <select value={form.status} onChange={set("status")} className={cn(inputBase, "appearance-none")}>
                    <option>Available</option>
                    <option>Busy</option>
                    <option>On Leave</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)]">
                  <Wrench className="size-5 text-[#004492]" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">Technical Profile</h2>
              </div>
              <div className="flex flex-col gap-4 pt-5">
                <label className="flex items-center gap-4">
                  <span className={fieldLabel}>Primary Specialization</span>
                  <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className={cn(inputBase, "appearance-none")}>
                    <option value="">Select...</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className={fieldLabel}>Additional Skills (Select multiple)</span>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {SKILL_CHOICES.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          "rounded-[12px] border px-[9px] py-[5px] text-[11px] font-medium transition-colors",
                          skills.includes(skill)
                            ? "border-[#005bbf] bg-[#005bbf] text-[#c8d8ff]"
                            : "border-[#e5e7eb] bg-white text-[#424753] hover:border-primary/50",
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                    {skills.filter((s) => !SKILL_CHOICES.includes(s)).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="rounded-[12px] border border-[#005bbf] bg-[#005bbf] px-[9px] py-[5px] text-[11px] font-medium text-[#c8d8ff]"
                      >
                        {skill}
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                        placeholder="Add Custom"
                        className="h-7 w-28 rounded-[12px] border border-dashed border-[#c2c6d5] bg-white px-2 text-[11px] text-[#424753] outline-none placeholder:text-[#424753]"
                      />
                      <button type="button" onClick={addCustomSkill} className="rounded-full bg-[#004492] px-2 py-0.5 text-xs font-bold text-white">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)]">
                  <KeyRound className="size-5 text-[#004492]" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">System Access & Permissions</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-5">
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Username</span>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jdoe" className={inputBase} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Temporary Password</span>
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="TempPass123!"
                      className={cn(inputBase, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>System Role</span>
                  <Input value="Mechanic" readOnly className={idInputBase} />
                </label>
                <div className="flex items-end justify-between pb-1">
                  <span className={fieldLabel}>Account Active</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={accountActive}
                    onClick={() => setAccountActive((v) => !v)}
                    className={cn(
                      "flex h-6 w-11 items-center rounded-[12px] px-0.5 transition-colors",
                      accountActive ? "justify-end bg-[#004492]" : "justify-start bg-[#e1e3e4]",
                    )}
                  >
                    <span className="size-5 rounded-full border border-white bg-white shadow" />
                  </button>
                </div>
              </div>
              <div className="pt-5">
                <span className={fieldLabel}>App Permissions</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2">
                  {PERMISSIONS.map((p) => (
                    <label key={p.key} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={permissions[p.key]}
                        onChange={() => setPermissions((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                        className={cn("size-4 accent-[#004492]", p.key === "viewJobs" && "cursor-not-allowed opacity-60")}
                        disabled={p.key === "viewJobs"}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <p className="pb-4 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">Profile Preview</p>
              <div className="flex items-center gap-4 pb-4">
                <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e2e8f0] bg-[rgba(0,68,146,0.1)] text-xl font-bold text-[#004492]">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initials(form.fullName || "New Mechanic")}
                  <span className="absolute right-0.5 bottom-0.5 size-3 rounded-full border-2 border-white bg-[#4caf50]" />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">{form.fullName || "New Mechanic"}</p>
                  <p className="text-xs text-muted-foreground">EMP-MEC-2026-001</p>
                  {specialization && (
                    <span className="mt-1 inline-flex rounded-xl bg-[rgba(0,68,146,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#004492]">
                      {specialization}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 border-t border-[#e2e8f0] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#424753]">Branch</span>
                  <span className="font-medium text-foreground">{form.branch || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#424753]">Experience</span>
                  <span className="font-medium text-foreground">{form.experience ? `${form.experience} Years` : "-- Years"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#424753]">Employment</span>
                  <span className="font-medium text-foreground">{form.employmentType}</span>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((s) => (
                      <span key={s} className="rounded-[12px] bg-[#e1e3e4] px-2 py-0.5 text-[11px] font-medium text-[#424753]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 flex items-center justify-between rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-4 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="size-3.5" />
            Unsaved changes
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/employees")} className="rounded-[4px] px-4 text-xs font-semibold">
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Draft saved locally")} className="rounded-[4px] border-[#e2e8f0] px-4 text-xs font-semibold text-[#004492]">
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Draft saved locally")} className="rounded-[4px] border-[#e2e8f0] px-4 text-xs font-semibold text-[#004492]">
              Save Draft
            </Button>
            <Button size="sm" onClick={() => void submit()} disabled={submitting} className="gap-1.5 rounded-[4px] bg-[#004492] px-4 text-xs font-semibold text-white hover:bg-[#004492]/90">
              <UserPlus className="size-3.5" />
              {submitting ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}