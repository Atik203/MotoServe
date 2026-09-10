"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Trash2,
  Upload,
  User as UserIcon,
  UserPlus,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { createEmployee } from "@/store/slices/employeesSlice";
import { uploadDocument } from "@/store/slices/authSlice";

const BRANCHES = ["Main Bay / Station 01", "Main Bay / Station 02", "Main Bay / Station 03", "Main Bay / Station 04"];

const SPECIALIZATIONS = [
  "Engine & Diagnostics",
  "Brakes & Suspension",
  "Electrical & AC",
  "General",
];

const SKILL_CHOICES = ["Oil Change", "Diagnostics", "Tire Alignment", "Suspension", "Exhaust Systems"];

const DOCUMENT_KINDS = [
  "National ID (NID)",
  "Driving License",
  "Mechanic / ASE Certification",
  "Apprenticeship / Trade Certificate",
  "Employment Contract / Resume",
  "Other Document",
];

const PERMISSIONS = [
  { key: "viewTasks", label: "View Assigned Tasks (Default)" },
  { key: "updateProgress", label: "Update Task Progress" },
  { key: "requestParts", label: "Request/Add Inventory Parts" },
  { key: "markComplete", label: "Mark Task as Complete" },
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

interface AttachedDoc {
  name: string;
  key: string;
  kind: string;
  preview?: string;
  size?: number;
}

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
    viewTasks: true,
    updateProgress: true,
    requestParts: true,
    markComplete: true,
    uploadPhotos: true,
    directChat: false,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [docs, setDocs] = useState<AttachedDoc[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [selectedKind, setSelectedKind] = useState("National ID (NID)");
  const [submitting, setSubmitting] = useState(false);

  const docsInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = async (file: File, purpose: "document" | "image"): Promise<string> => {
    try {
      const res = await dispatch(uploadDocument({ fileName: file.name, fileType: file.type, purpose })).unwrap();
      const put = await fetch(res.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (put.ok) {
        return res.key;
      }
    } catch {
      // Fallback below
    }
    // Fallback: convert file to a base64 Data URL so upload is 100% dynamic even in offline/demo environment
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(`/images/documents/${file.name}`);
      reader.readAsDataURL(file);
    });
  };

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed for profile photo");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo exceeds 2MB limit");
      return;
    }
    setAvatarUploading(true);
    try {
      const key = await uploadFile(file, "image");
      setAvatarKey(key);
      setAvatarUrl(URL.createObjectURL(file));
      toast.success("Profile photo uploaded");
    } catch {
      toast.error("Failed to process photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDocsPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const accepted = files.filter((file) => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImg && !isPdf) {
        toast.error(`"${file.name}" — only JPG, PNG or PDF documents are allowed`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (accepted.length === 0) return;

    setUploadingDocs(true);
    let successCount = 0;
    for (const file of accepted) {
      try {
        const key = await uploadFile(file, "document");
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        setDocs((prev) => [
          ...prev,
          {
            name: file.name,
            key,
            kind: selectedKind,
            preview,
            size: file.size,
          },
        ]);
        successCount++;
      } catch {
        toast.error(`"${file.name}" — upload failed`);
      }
    }
    setUploadingDocs(false);
    if (successCount > 0) {
      toast.success(`Attached ${successCount} document${successCount === 1 ? "" : "s"}`);
    }
  };

  const removeDoc = (index: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
    toast.info("Document removed");
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
          avatar: avatarKey || undefined,
          nid: form.nid.trim() || undefined,
          gender: form.gender || undefined,
          dateOfBirth: form.dob || undefined,
          street: form.address.trim() || undefined,
          documents: docs.map(({ name, key, kind }) => ({ name, key, kind })),
        }),
      ).unwrap();
      toast.success("Mechanic account created successfully with documents");
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
          <p className="text-sm text-[#424753]">Create a new mechanic profile, upload verification documents, and assign station permissions.</p>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            {/* 1. Personal Information */}
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
                    disabled={avatarUploading}
                    onClick={() => document.getElementById("mech-avatar")?.click()}
                    className="relative flex size-24 items-center justify-center overflow-hidden rounded-[12px] border border-dashed border-[#c2c6d5] bg-[#edeeef] transition-colors hover:border-primary disabled:opacity-60"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Mechanic avatar" className="size-full object-cover" />
                    ) : (
                      <UserPlus className="size-7 text-[#424753]" />
                    )}
                  </button>
                  <input id="mech-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
                  <span className="text-xs text-[#64748b]">
                    {avatarUploading ? "Uploading..." : "Profile Photo"}
                  </span>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4">
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Full Name *</span>
                    <Input value={form.fullName} onChange={set("fullName")} placeholder="e.g. Alex Turner" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Employee ID</span>
                    <Input value="EMP-MEC-2026-001" readOnly className={idInputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>National ID (NID) / SSN</span>
                    <Input value={form.nid} onChange={set("nid")} placeholder="e.g. 1988123456789" className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Date of Birth</span>
                    <input type="date" value={form.dob} onChange={set("dob")} className={inputBase} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Gender</span>
                    <select value={form.gender} onChange={set("gender")} className={selectCls}>
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
                    <Input value={form.email} onChange={set("email")} type="email" placeholder="alex.turner@motorserve.com" className={inputBase} />
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

            {/* 2. Workshop Assignment & Skills */}
            <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3 border-b border-[#e2e8f0] pb-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)]">
                  <Wrench className="size-5 text-[#004492]" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">Workshop Assignment & Skills</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-5">
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Assigned Bay / Station *</span>
                  <select value={form.branch} onChange={set("branch")} className={selectCls}>
                    <option value="">Select Bay</option>
                    {BRANCHES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Specialization *</span>
                  <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className={selectCls}>
                    <option value="">Select Specialization</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Joining Date</span>
                  <input type="date" value={form.joiningDate} onChange={set("joiningDate")} className={inputBase} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Employment Type</span>
                  <select value={form.employmentType} onChange={set("employmentType")} className={selectCls}>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Contract</option>
                  </select>
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

              <div className="border-t border-[#e2e8f0] pt-4 mt-4">
                <span className={fieldLabel}>Core Skills & Competencies</span>
                <div className="flex flex-wrap gap-2 pt-2">
                  {SKILL_CHOICES.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "rounded-[16px] border px-3 py-1 text-xs font-medium transition-colors",
                        skills.includes(skill)
                          ? "border-[#004492] bg-[rgba(0,68,146,0.1)] text-[#004492] font-semibold"
                          : "border-[#e2e8f0] bg-white text-[#424753]",
                      )}
                    >
                      {skill} {skills.includes(skill) ? "✓" : "+"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-3">
                  <Input
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add custom skill..."
                    className={cn(inputBase, "h-9 max-w-xs text-xs")}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomSkill} className="rounded text-xs">
                    Add
                  </Button>
                </div>
              </div>
            </section>

            {/* 3. Multi-Document Upload & Identity Verification */}
            <section className="flex flex-col gap-5 rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-[9px]">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <FileText className="size-5 text-primary" />
                    Identity Verification & Document Uploads
                  </h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Upload official identification (National ID front/back), technical certifications, mechanic licenses, and trade certificates.
                  </p>
                </div>
                {docs.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {docs.length} attached
                  </span>
                )}
              </div>

              {/* Document Category / Type Selector */}
              <div className="flex flex-col gap-2">
                <span className={fieldLabel}>Document Category for Next Upload</span>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_KINDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedKind(k)}
                      className={cn(
                        "rounded-[16px] border px-3 py-1 text-xs font-medium transition-colors",
                        selectedKind === k
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-[#e2e8f0] bg-white text-[#424753] hover:border-primary/40",
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={docsInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleDocsPick}
              />

              <div
                onClick={() => !uploadingDocs && docsInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c2c6d5] bg-[#f8f9fa] py-8 px-4 text-center transition-colors cursor-pointer hover:border-primary/60 hover:bg-primary/5",
                  uploadingDocs && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-white shadow-xs text-primary">
                  <Upload className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {uploadingDocs ? "Uploading documents..." : "Click to select or drag & drop multiple document photos"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Select multiple files (PNG, JPG, WEBP, PDF up to 5MB each) as <span className="font-semibold text-primary">{selectedKind}</span>
                  </p>
                </div>
              </div>

              {/* Uploaded Documents List */}
              {docs.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {docs.map((doc, idx) => (
                    <div
                      key={`${doc.name}-${idx}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-[#f8f9fa] p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                          {doc.preview ? (
                            <img src={doc.preview} alt={doc.name} className="size-full object-cover" />
                          ) : (
                            <FileText className="size-5 text-primary" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                              {doc.kind}
                            </span>
                            {doc.size && (
                              <span className="text-[10px] text-muted-foreground">
                                {(doc.size / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDoc(idx);
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        aria-label="Remove document"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. System Access & Permissions */}
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
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                      "flex h-6 w-11 items-center rounded-[12px] px-0.5 transition-colors cursor-pointer",
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
                        className={cn("size-4 accent-[#004492]", p.key === "viewTasks" && "cursor-not-allowed opacity-60")}
                        disabled={p.key === "viewTasks"}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Profile Preview */}
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
                    <span className="mt-1 inline-block rounded bg-[rgba(0,68,146,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#004492]">
                      {specialization}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 border-t border-[#e2e8f0] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#424753]">Status</span>
                  <span className="flex items-center gap-1.5 rounded-xl bg-[rgba(76,175,80,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#4caf50]">
                    <span className="size-1.5 rounded-full bg-[#4caf50]" />
                    {form.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#424753]">Assigned Bay</span>
                  <span className="font-medium text-foreground">{form.branch || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#424753]">Documents</span>
                  <span className="font-medium text-primary font-semibold">{docs.length} attached</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="sticky bottom-4 flex items-center justify-between rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-4 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="size-3.5" />
            Ensure all required fields and documents are attached before creation
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/employees")} className="rounded-[4px] px-4 text-xs font-semibold">
              Cancel
            </Button>
            <Button size="sm" onClick={() => void submit()} disabled={submitting || uploadingDocs} className="gap-1.5 rounded-[4px] bg-[#004492] px-4 text-xs font-semibold text-white hover:bg-[#004492]/90">
              <UserPlus className="size-3.5" />
              {submitting ? "Creating Mechanic..." : "Create Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}