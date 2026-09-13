"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Pencil, Phone, Plus, ShieldCheck, Trash2, User, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateProfile } from "@/store/slices/authSlice";
import { fetchStations, addStation, editStation, removeStation } from "@/store/slices/stationsSlice";
import { useFileUrl } from "@/hooks/useFileUrl";
import { userInitials } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const stations = useAppSelector((s) => s.stations.items);
  const stationsStatus = useAppSelector((s) => s.stations.status);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const [newStation, setNewStation] = useState("");
  const [addingStation, setAddingStation] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const avatar = useFileUrl(user?.avatar);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin && stationsStatus === "idle") {
      dispatch(fetchStations());
    }
  }, [dispatch, isAdmin, stationsStatus]);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
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

  const handleAddStation = async () => {
    if (!newStation.trim()) { toast.error("Station name cannot be empty"); return; }
    setAddingStation(true);
    try {
      await dispatch(addStation(newStation.trim())).unwrap();
      toast.success("Station added");
      setNewStation("");
    } catch {
      toast.error("Failed to add station (name may already exist)");
    } finally {
      setAddingStation(false);
    }
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) { toast.error("Name cannot be empty"); return; }
    setUpdatingId(id);
    try {
      await dispatch(editStation({ id, name: editName.trim() })).unwrap();
      toast.success("Station updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update station");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, stationName: string) => {
    setDeletingId(id);
    try {
      await dispatch(removeStation(id)).unwrap();
      toast.success(`"${stationName}" removed`);
    } catch {
      toast.error("Failed to delete station");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Account › Profile</p>
          <h1 className="text-[28px] font-bold tracking-[-0.56px] text-foreground">My Profile</h1>
        </div>

        <div className="flex items-center gap-6 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft text-2xl font-bold text-primary">
            {avatar ? (
              <Image src={avatar} alt={user.name} fill className="object-cover" />
            ) : (
              userInitials(user.name)
            )}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-xl font-semibold text-foreground">{user.name}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4" />{user.email}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" />{user.phone || "No phone number"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[rgba(0,82,204,0.1)] px-3 py-1 text-xs font-semibold capitalize text-primary">
            <ShieldCheck className="size-3.5" />{user.role}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <form
            onSubmit={handleSave}
            className="flex flex-col gap-5 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <User className="size-4 text-primary" />
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
                {saving ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-base font-semibold text-foreground">Account Details</h2>
            <dl className="flex flex-col gap-4">
              {[
                { label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
                ...(user.station ? [{ label: "Station", value: user.station }] : []),
                ...(user.specialization ? [{ label: "Specialization", value: user.specialization }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-semibold capitalize text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-lg bg-[#f8f9fa] px-4 py-3 text-xs leading-5 text-muted-foreground">
              Your profile is shared across all MotoServe apps. For security-sensitive changes like your password, use the password reset flow from the login page.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <MapPin className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Workshop Stations / Bays</h2>
              <span className="ml-auto rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                {stations.length} station{stations.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                value={newStation}
                onChange={(e) => setNewStation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddStation())}
                placeholder="e.g. Main Bay / Station 02"
                className="h-9 flex-1 rounded-lg border-border bg-[#f9fafb] text-sm"
              />
              <Button
                onClick={handleAddStation}
                disabled={addingStation || !newStation.trim()}
                className="h-9 rounded-lg px-4 text-xs font-semibold"
              >
                {addingStation ? <Loader2 className="size-3.5 animate-spin" /> : <><Plus className="size-3.5 mr-1" />Add</>}
              </Button>
            </div>

            {stationsStatus === "loading" && stations.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {stations.length === 0 && stationsStatus !== "loading" && (
              <div className="rounded-lg border border-dashed border-border py-10 text-center">
                <MapPin className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No stations added yet.</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-[#f9fafb] px-4 py-3"
                >
                  <MapPin className="size-4 shrink-0 text-primary" />
                  {editingId === station.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(station.id)}
                        className="h-8 flex-1 rounded border-border text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdate(station.id)}
                        disabled={updatingId === station.id}
                        className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        {updatingId === station.id ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-foreground">{station.name}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(station.id, station.name)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-primary"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(station.id, station.name)}
                        disabled={deletingId === station.id}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-[#ba1a1a] disabled:opacity-50"
                      >
                        {deletingId === station.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
