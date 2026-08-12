"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateProfile } from "@/store/slices/authSlice";
import { userInitials } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await dispatch(updateProfile({ name: name.trim(), phone: phone.trim() || null })).unwrap();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Account › Profile</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">My Profile</h1>
        </div>

        <div className="flex items-center gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft text-2xl font-bold text-primary">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} fill className="object-cover" />
            ) : (
              userInitials(user.name)
            )}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-2xl font-semibold text-foreground">{user.name}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4" />
              {user.email}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" />
              {user.phone || "No phone number"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[rgba(0,82,204,0.1)] px-3 py-1 text-xs font-semibold text-primary capitalize">
            <ShieldCheck className="size-3.5" />
            {user.role}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <form
            onSubmit={handleSave}
            className="flex flex-col gap-5 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <User className="size-5" />
              Personal Information
            </h2>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded border-[#e2e8f0] bg-white" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-10 rounded border-[#e2e8f0] bg-white" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Email Address</Label>
              <Input value={user.email} readOnly className={cn("h-10 rounded border-[#e2e8f0] bg-[#f3f4f5] text-[#6b7280]")} />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={saving} className="rounded px-5 text-xs font-semibold tracking-[0.24px]">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl font-semibold text-foreground">Account Details</h2>
            <dl className="flex flex-col gap-4">
              {[
                { label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
                ...(user.station ? [{ label: "Station", value: user.station }] : []),
                ...(user.specialization ? [{ label: "Specialization", value: user.specialization }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-semibold text-foreground capitalize">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-lg bg-[#f8f9fa] px-4 py-3 text-xs leading-5 text-muted-foreground">
              Your profile is shared across all MotoServe apps. For security-sensitive changes like your password, use
              the password reset flow from the login page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
