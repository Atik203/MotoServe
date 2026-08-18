"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Car, ChevronDown, ImagePlus, Upload } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { uploadDocument } from "@/store/slices/authSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FuelType, Vehicle } from "@/types";

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  regNo: string;
  color?: string;
  mileage: number;
  fuelType: FuelType;
  transmission?: string;
  vin?: string;
  image: string;
  photos?: string[];
}

interface VehicleFormProps {
  initial?: Vehicle | null;
  submitLabel?: string;
  onSubmit: (data: VehicleFormData) => Promise<void>;
}

const FUEL_OPTIONS = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

const TRANSMISSION_OPTIONS = ["Automatic", "Manual", "CVT"];

const selectBase =
  "h-[38px] w-full cursor-pointer appearance-none rounded border-[#6b7280] bg-[#f8f9fa] pr-8 text-sm text-foreground outline-none";

interface PhotoItem {
  name: string;
  key: string;
  preview?: string;
}

export function VehicleForm({ initial, submitLabel = "Register Vehicle", onSubmit }: VehicleFormProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    make: initial?.make ?? "",
    model: initial?.model ?? "",
    year: String(initial?.year ?? 2024),
    regNo: initial?.regNo ?? "",
    color: initial?.color ?? "",
    mileage: String(initial?.mileage ?? 0),
    fuelType: (initial?.fuelType ?? "gasoline") as FuelType,
    transmission: initial?.transmission ?? "Automatic",
    vin: initial?.vin ?? "",
  });
  const [photos, setPhotos] = useState<PhotoItem[]>(
    initial?.photos?.length
      ? initial.photos.map((key, i) => ({ name: `Photo ${i + 1}`, key, preview: key.startsWith("/") ? key : undefined }))
      : initial?.image && initial.image.startsWith("/")
        ? [{ name: "Vehicle Photo", key: initial.image, preview: initial.image }]
        : [],
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const accepted = files.filter((file) => {
      if (!["image/png", "image/jpeg", "application/pdf"].includes(file.type)) {
        toast.error(`"${file.name}" — only JPG, PNG or PDF photos are allowed`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB limit`);
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;
    setPhotoUploading(true);
    try {
      for (const file of accepted) {
        try {
          const res = await dispatch(
            uploadDocument({ fileName: file.name, fileType: file.type, purpose: "image" }),
          ).unwrap();
          const put = await fetch(res.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!put.ok) throw new Error("Upload to storage failed");
          setPhotos((p) => [...p, { name: file.name, key: res.key, preview: URL.createObjectURL(file) }]);
        } catch (err) {
          toast.error(`"${file.name}" — ${err instanceof Error ? err.message : "Upload failed"}`);
        }
      }
      if (accepted.length > 0) toast.success("Photos uploaded");
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = (key: string) => {
    setPhotos((p) => {
      const item = p.find((x) => x.key === key);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return p.filter((x) => x.key !== key);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim() || !form.regNo.trim()) {
      toast.error("Please fill in brand, model and registration number");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year) || 2024,
        regNo: form.regNo.trim().toUpperCase(),
        color: form.color.trim() || undefined,
        mileage: Number(form.mileage) || 0,
        fuelType: form.fuelType,
        transmission: form.transmission,
        vin: form.vin.trim().toUpperCase() || undefined,
        image: photos[0]?.key ?? (initial?.image?.startsWith("/") ? initial.image : "/images/cars/toyota-camry.png"),
        photos: photos.map((p) => p.key),
      });
      toast.success(initial ? "Vehicle updated successfully" : "Vehicle registered successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-center gap-2 border-b border-border pb-[17px]">
        <span className="flex size-[30px] items-center justify-center rounded-md bg-primary-soft">
          <Car className="size-4 text-primary" />
        </span>
        <h2 className="text-xl font-semibold text-foreground">Vehicle Details</h2>
      </div>

      <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
        {[
          { label: "Brand", key: "make" as const, placeholder: "e.g., Ford" },
          { label: "Model", key: "model" as const, placeholder: "e.g., Transit 250" },
          { label: "Year", key: "year" as const, placeholder: "2024" },
          { label: "Registration Number", key: "regNo" as const, placeholder: "ABC-1234" },
          { label: "Color", key: "color" as const, placeholder: "White" },
          { label: "Current Mileage (mi)", key: "mileage" as const, placeholder: "0" },
        ].map((field) => (
          <div key={field.key} className="flex flex-col gap-[8.5px]">
            <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">{field.label}</Label>
            <Input value={form[field.key]} onChange={set(field.key)} placeholder={field.placeholder} className="h-[38px] rounded border-[#6b7280] bg-[#f8f9fa]" />
          </div>
        ))}

        <div className="flex flex-col gap-[8.5px]">
          <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Fuel Type</Label>
          <div className="relative">
            <select
              value={form.fuelType}
              onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
              className={selectBase}
            >
              {FUEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-[8.5px]">
          <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Transmission</Label>
          <div className="relative">
            <select
              value={form.transmission}
              onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))}
              className={selectBase}
            >
              {TRANSMISSION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Vehicle Identification Number (VIN)</Label>
          <span className="text-[10px] tracking-[0.24px] text-muted-foreground">Optional</span>
        </div>
        <Input value={form.vin} onChange={set("vin")} placeholder="Enter 17-character VIN" className="h-[38px] rounded border-[#6b7280] bg-[#f8f9fa] uppercase" />
      </div>

      <div className="flex flex-col gap-[8.5px]">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
            Upload Vehicle, Insurance and Registration Photos
          </Label>
          <span className="text-[10px] tracking-[0.24px] text-muted-foreground">
            {photos.length > 0 ? `${photos.length} uploaded` : "Multiple allowed"}
          </span>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          multiple
          className="hidden"
          onChange={handlePhotoPick}
        />
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((p, i) => (
              <div key={p.key} className="relative overflow-hidden rounded-lg border border-[#c2c6d5] bg-[#f8f9fa]">
                <div className="h-24 w-full bg-[#eef1f4]">
                  {p.preview ? (
                    p.name.toLowerCase().endsWith(".pdf") ? (
                      <div className="flex h-full items-center justify-center">
                        <ImagePlus className="size-6 text-primary" />
                      </div>
                    ) : (
                      <img src={p.preview} alt={p.name} className="h-full w-full object-cover" />
                    )
                  ) : p.key.startsWith("/") ? (
                    <img src={p.key} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <VehicleImage src={p.key} alt={p.name} fill className="object-contain p-2" />
                  )}
                </div>
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Vehicle Photo
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.key)}
                  className="absolute top-1.5 right-1.5 rounded-sm bg-[rgba(46,49,50,0.8)] px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#ba1a1a]"
                >
                  Remove
                </button>
                <p className="truncate px-2 py-1 text-[10px] text-muted-foreground">{p.name}</p>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={photoUploading}
          onClick={() => photoInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-[#f8f9fa] p-[26px] transition-colors hover:border-primary/50 disabled:opacity-60"
        >
          <ImagePlus className="size-6 text-muted-foreground" />
          <p className="text-sm text-foreground">
            {photoUploading ? "Uploading..." : (
              <>
                Drag & drop photos here, or <span className="font-medium text-primary">browse</span>
              </>
            )}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {photos.length > 0 ? "Add more — JPG, PNG, PDF (Max 5MB each)" : "Supports JPG, PNG, PDF (Max 5MB each) — you can upload several"}
          </p>
        </button>
      </div>

      <div className="flex justify-end border-t border-border pt-[25px]">
        <Button type="submit" disabled={submitting} className="gap-2 rounded px-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <Upload className="size-[15px]" />
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}