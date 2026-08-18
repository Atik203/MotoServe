"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarDays,
  Camera,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Home,
  IdCard,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { registerUser, uploadDocument } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const required = <span className="text-[#f44336]">*</span>;

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  dateOfBirth: string;
  gender: string;
  nid: string;
  drivingLicense: string;
  occupation: string;
  street: string;
  city: string;
  district: string;
  zip: string;
  country: string;
}

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
  dateOfBirth: "",
  gender: "",
  nid: "",
  drivingLicense: "",
  occupation: "",
  street: "",
  city: "",
  district: "",
  zip: "",
  country: "",
};

function Field({
  label,
  required: isRequired,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-base text-foreground">
        {label} {isRequired && required}
      </Label>
      <div className="relative">
        <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
        {icon && <span className="absolute top-1/2 left-[15px] -translate-y-1/2 text-muted-foreground">{icon}</span>}
      </div>
    </div>
  );
}

function DocItem({
  doc,
  onRemove,
}: {
  doc: { name: string; preview: string; key: string; kind: "nid" | "license" };
  onRemove: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-[#c2c6d5] bg-[#f8f9fa] px-4 py-3">
      {doc.name.toLowerCase().endsWith(".pdf") ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-[rgba(0,82,204,0.1)]">
          <FileText className="size-5 text-primary" />
        </span>
      ) : (
        <img src={doc.preview} alt={doc.name} className="size-10 shrink-0 rounded object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
        <p className="text-xs text-muted-foreground">{doc.kind === "nid" ? "NID document" : "License document"}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(doc.key)}
        className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-[#ba1a1a]"
      >
        Remove
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<{ name: string; key: string; preview: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docs, setDocs] = useState<{ name: string; key: string; kind: "nid" | "license"; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const nidInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const setEvent = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const uploadFile = async (file: File, purpose: "document" | "image"): Promise<string> => {
    const res = await dispatch(uploadDocument({ fileName: file.name, fileType: file.type, purpose })).unwrap();
    const put = await fetch(res.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("Upload to storage failed");
    return res.key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.nid.trim() || !form.drivingLicense.trim() || !form.street.trim() || !form.city.trim() || !form.district.trim()) {
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
          phone: form.phone.trim(),
          password: form.password,
          dateOfBirth: form.dateOfBirth.trim() || undefined,
          gender: form.gender.trim() || undefined,
          nid: form.nid.trim(),
          drivingLicense: form.drivingLicense.trim(),
          occupation: form.occupation.trim() || undefined,
          street: form.street.trim(),
          city: form.city.trim(),
          district: form.district.trim(),
          zip: form.zip.trim() || undefined,
          country: form.country.trim() || undefined,
          documents: docs.map(({ name, key, kind }) => ({ name, key, kind })),
          avatar: photo?.key ?? undefined,
        }),
      ).unwrap();
      toast.success("Account created — verification pending. You can log in once approved.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
      setSubmitting(false);
    }
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Only JPG or PNG photos are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo exceeds 2MB limit");
      return;
    }
    setPhotoUploading(true);
    try {
      const key = await uploadFile(file, "image");
      setPhoto({ name: file.name, key, preview: URL.createObjectURL(file) });
      toast.success("Profile photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDocsPick = (kind: "nid" | "license") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const accepted = files.filter((file) => {
      if (!["image/png", "image/jpeg", "application/pdf"].includes(file.type)) {
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
    setUploading(true);
    try {
      for (const file of accepted) {
        try {
          const key = await uploadFile(file, "document");
          setDocs((d) => [...d, { name: file.name, key, kind, preview: URL.createObjectURL(file) }]);
        } catch (err) {
          toast.error(`"${file.name}" — ${err instanceof Error ? err.message : "Upload failed"}`);
        }
      }
      toast.success("Documents uploaded for verification");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (key: string) => {
    setDocs((d) => {
      const doc = d.find((x) => x.key === key);
      if (doc) URL.revokeObjectURL(doc.preview);
      return d.filter((x) => x.key !== key);
    });
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
                <input ref={photoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhotoPick} />
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => photoInputRef.current?.click()}
                  className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#727784] bg-[#edeeef] transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  {photo ? (
                    <img src={photo.preview} alt="Profile photo" className="size-full object-cover" />
                  ) : (
                    <Camera className="size-[22px] text-muted-foreground" />
                  )}
                </button>
                {photo ? (
                  <>
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-foreground">{photo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {photoUploading ? "Uploading..." : "Profile photo uploaded — click the tile to change"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(photo.preview);
                        setPhoto(null);
                      }}
                      className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-[#ba1a1a]"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <div>
                    <p className="text-base text-foreground">Profile Photo (Optional)</p>
                    <p className="text-sm text-muted-foreground">
                      {photoUploading ? "Uploading..." : "JPG, PNG up to 2MB — click the tile to upload"}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Full Name {required}</Label>
                  <div className="relative">
                    <Input value={form.name} onChange={setEvent("name")} placeholder="John Doe" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
                    <IdCard className="absolute top-1/2 left-[15px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Email Address {required}</Label>
                  <div className="relative">
                    <Input type="email" value={form.email} onChange={setEvent("email")} placeholder="john@example.com" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
                    <Mail className="absolute top-1/2 left-[15px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Phone Number {required}</Label>
                  <div className="relative">
                    <Input type="tel" value={form.phone} onChange={setEvent("phone")} placeholder="+880 1XXX-XXXXXX" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base" />
                    <Phone className="absolute top-1/2 left-[15px] size-[15px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Password {required}</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={setEvent("password")} placeholder="••••••••" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] px-[41px] text-base" />
                    <KeyRound className="absolute top-1/2 left-[15px] size-[13.3px] -translate-y-1/2 text-muted-foreground" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {showPassword ? <EyeOff className="size-[18.3px]" /> : <Eye className="size-[18.3px]" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Confirm Password {required}</Label>
                  <div className="relative">
                    <Input type="password" value={form.confirm} onChange={setEvent("confirm")} placeholder="••••••••" className="h-[46px] rounded-md border-[#c2c6d5] bg-[#f8f9fa] px-[41px] text-base" />
                    <KeyRound className="absolute top-1/2 left-[15px] size-[16.7px] -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <Field label="Date of Birth" type="date" placeholder="Select date" icon={<CalendarDays className="size-[15px]" />} value={form.dateOfBirth} onChange={set("dateOfBirth")} />
                <div className="flex flex-col gap-1">
                  <Label className="text-base text-foreground">Gender</Label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender")(e.target.value)}
                      className="h-[46px] w-full cursor-pointer appearance-none rounded-md border border-[#c2c6d5] bg-[#f8f9fa] pl-[41px] text-base text-foreground outline-none"
                    >
                      <option value="" disabled>
                        Select Gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <Field label="National ID (NID)" required placeholder="Enter NID number" icon={<IdCard className="size-[16.7px]" />} value={form.nid} onChange={set("nid")} />
                <Field label="Driving License Number" required placeholder="Enter license number" icon={<IdCard className="size-[15px]" />} value={form.drivingLicense} onChange={set("drivingLicense")} />
                <Field label="Occupation (Optional)" placeholder="E.g. Software Engineer" icon={<Briefcase className="size-[16.7px]" />} value={form.occupation} onChange={set("occupation")} />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base text-foreground">
                <Home className="size-[13.3px]" />
                Address Information
              </h2>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                <div className="col-span-2">
                  <Field label="Street Address" required placeholder="123 Main St, Apt 4B" icon={<Home className="size-[13.3px]" />} value={form.street} onChange={set("street")} />
                </div>
                <Field label="City" required placeholder="City" icon={<MapPin className="size-[15px]" />} value={form.city} onChange={set("city")} />
                <Field label="District/State" required placeholder="District or State" icon={<Landmark className="size-[15px]" />} value={form.district} onChange={set("district")} />
                <Field label="Zip / Postal Code" placeholder="12345" icon={<Hash className="size-[15px]" />} value={form.zip} onChange={set("zip")} />
                <Field label="Country" placeholder="Country" icon={<MapPin className="size-[15px]" />} value={form.country} onChange={set("country")} />
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base text-foreground">
                <IdCard className="size-4" />
                Identity Verification
              </h2>
              {(
                [
                  { kind: "nid", title: "National ID (NID) Documents", ref: nidInputRef },
                  { kind: "license", title: "Driving License Documents", ref: licenseInputRef },
                ] as const
              ).map(({ kind, title, ref }) => {
                const list = docs.filter((d) => d.kind === kind);
                return (
                  <div key={kind} className="flex flex-col gap-3">
                    <Label className="text-base text-foreground">{title}</Label>
                    <input ref={ref} type="file" accept="image/png,image/jpeg,application/pdf" multiple className="hidden" onChange={handleDocsPick(kind)} />
                    {list.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {list.map((doc) => (
                          <DocItem key={doc.key} doc={doc} onRemove={removeDoc} />
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => ref.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[#c2c6d5] bg-[#f8f9fa] py-8 transition-colors hover:border-primary/50 disabled:opacity-60"
                    >
                      <Camera className="size-6 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {uploading ? "Uploading..." : "Click to upload multiple files"}
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or PDF up to 5MB each — you can upload more than one</p>
                    </button>
                  </div>
                );
              })}
            </section>

              <div className="flex items-center justify-between border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  By creating an account you agree to our <span className="font-medium text-primary">Privacy Policy</span>.
                </p>
                <div className="flex items-center gap-3">
                  <span className="cursor-pointer text-sm font-medium text-primary hover:underline" onClick={() => router.push("/login")}>
                    Back to Login
                  </span>
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
