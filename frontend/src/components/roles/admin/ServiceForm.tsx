"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarClock,
  Check,
  Clock,
  ImagePlus,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createService, updateService } from "@/store/slices/servicesSlice";
import { uploadDocument } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: "maintenance", label: "Maintenance" },
  { value: "repairs", label: "Repairs" },
  { value: "inspections", label: "Inspections" },
];

const DURATIONS = [
  { value: 15, label: "15 mins" },
  { value: 30, label: "30 mins" },
  { value: 45, label: "45 mins" },
  { value: 60, label: "1 Hour" },
  { value: 90, label: "1.5 Hours" },
  { value: 120, label: "2 Hours" },
  { value: 150, label: "2.5 Hours" },
  { value: 180, label: "3 Hours" },
  { value: 240, label: "4 Hours" },
];

const SUGGESTED_TAGS = ["Popular", "Recommended", "Quick Turnaround", "Safety Critical", "Warranty Safe", "Seasonal"];

const LABOR_RATE_PER_HOUR = 45;

const durationLabel = (mins: number) =>
  mins < 60 ? `${mins} mins` : mins === 60 ? "1 Hour" : `${mins / 60} hrs`;

const errMsg = "mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600";

export default function ServiceForm({ initial }: { initial?: Service | null }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory>(initial?.category ?? "maintenance");
  const [price, setPrice] = useState(initial ? String(initial.basePrice) : "");
  const [duration, setDuration] = useState(initial?.durationMins ?? 60);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [iconUrl, setIconUrl] = useState<string | null>(initial?.marketing?.image ?? null);
  const [tags, setTags] = useState<string[]>(initial?.marketing?.tags ?? ["Popular"]);
  const [newTagInput, setNewTagInput] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(initial);
  const priceNum = Number(price);
  const durationMins = Number(duration);
  const laborCost = (durationMins / 60) * LABOR_RATE_PER_HOUR;
  const estimatedTotal = (Number.isFinite(priceNum) ? priceNum : 0) + laborCost;

  const duplicate = services.some(
    (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase() && s.id !== initial?.id
  );
  const nameError =
    name.trim().length >= 2
      ? duplicate
        ? "Service Name already exists in catalog"
        : null
      : name.trim()
      ? "Service Name must be at least 2 characters"
      : null;
  const priceError = price === "" ? null : !Number.isFinite(priceNum) || priceNum <= 0 ? "Base Price must be greater than 0" : null;

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const res = await dispatch(uploadDocument({ fileName: file.name, fileType: file.type, purpose: "image" })).unwrap();
      const put = await fetch(res.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("Upload to storage failed");
      return res.getUrl ?? res.key;
    } catch {
      // Fallback to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  const handlePickIcon = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files (PNG, JPG, SVG, WebP) are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image exceeds 5MB size limit");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setIconUrl(url);
      toast.success("Service image uploaded");
    } catch {
      toast.error("Failed to upload service image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags([...tags, trimmed]);
    setNewTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const submit = async () => {
    if (nameError || !name.trim() || priceError || price === "" || priceNum <= 0) {
      toast.error("Please fill in all required fields properly");
      return;
    }
    setSubmitting(true);

    const serviceData: Omit<Service, "id"> = {
      name: name.trim(),
      category,
      basePrice: Math.round(priceNum * 100) / 100,
      durationMins,
      description: description.trim(),
      active,
      marketing: {
        name: name.trim(),
        from: `$${priceNum.toFixed(2)}`,
        durationLabel: durationLabel(durationMins),
        tags: tags.length > 0 ? tags : ["Popular"],
        image: iconUrl ?? "/images/service-default.jpg",
        blurb: description.trim() || `${name.trim()} professional service`,
      },
    };

    try {
      if (isEdit && initial) {
        await dispatch(updateService({ id: initial.id, data: serviceData })).unwrap();
        toast.success(`Service "${name.trim()}" updated`);
      } else {
        await dispatch(createService(serviceData)).unwrap();
        toast.success(`Service "${name.trim()}" created and added to catalog`);
      }
      router.push("/admin/services");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save service");
      setSubmitting(false);
    }
  };

  const inputCls =
    "h-[42px] w-full rounded-md border border-[#c2c6d5] bg-white px-3.5 text-sm text-foreground outline-none placeholder:text-[#9ca3af] focus:border-[#004492] transition-colors";
  const invalidInputCls = "border-rose-500 bg-rose-50/20";

  return (
    <div className="grid grid-cols-12 items-start gap-6">
      {/* Left Column: Form Fields */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
        <div className="relative w-full overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#004492]" />

          <div className="flex items-center gap-3 border-b border-[#e5e7eb] pb-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)]">
              <Wrench className="size-5 text-[#004492]" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Service Parameters</h2>
              <p className="text-xs text-muted-foreground">Define service catalog details, pricing structure, and portal options.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-5">
            {/* Service Name */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Service Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brake Pad Replacement"
                className={cn(inputCls, nameError && invalidInputCls)}
              />
              {nameError && (
                <p className={errMsg}>
                  <AlertCircle className="size-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className={cn(inputCls, "cursor-pointer")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Price */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Base Price <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-[#424753]">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49.99"
                  className={cn(inputCls, "pl-7", priceError && invalidInputCls)}
                />
              </div>
              {priceError && (
                <p className={errMsg}>
                  <AlertCircle className="size-3" />
                  {priceError}
                </p>
              )}
            </div>

            {/* Estimated Duration */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Estimated Bay Duration</Label>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={cn(inputCls, "cursor-pointer pr-10")}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Service Description</Label>
                <span className="text-[11px] text-muted-foreground">{description.length}/500</span>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Detail what this service covers, included inspections, parts checks, and customer warranty details..."
                className="min-h-24 resize-none rounded-md border-[#c2c6d5] bg-white px-3.5 py-2.5 text-xs text-foreground placeholder:text-[#9ca3af] focus:border-[#004492]"
              />
            </div>

            {/* Marketing Tags */}
            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Marketing & Highlight Badges</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#004492] border border-[#bfdbfe]"
                  >
                    <Sparkles className="size-3" />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-600">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(newTagInput);
                      }
                    }}
                    placeholder="Custom tag..."
                    className="h-7 w-36 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(newTagInput)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  <span>Suggestions:</span>
                  {SUGGESTED_TAGS.filter((st) => !tags.includes(st)).slice(0, 3).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => addTag(st)}
                      className="rounded border border-dashed border-[#c2c6d5] px-2 py-0.5 text-[#424753] hover:border-[#004492] hover:text-[#004492]"
                    >
                      + {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Image Upload */}
            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-xs font-semibold text-foreground">Service Catalog Visual / Photo</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => void handlePickIcon(e.target.files?.[0])}
              />

              {uploadingImage ? (
                <div className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#004492] bg-[#eff6ff]">
                  <Loader2 className="size-6 animate-spin text-[#004492]" />
                  <span className="text-xs font-semibold text-[#004492]">Uploading image...</span>
                </div>
              ) : iconUrl ? (
                <div className="relative flex items-center gap-4 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3">
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md border border-[#e2e8f0]">
                    <Image src={iconUrl} alt="Service preview" fill unoptimized className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-xs font-semibold text-foreground">Catalog banner uploaded</p>
                    <p className="text-[11px] text-muted-foreground">Displayed on customer booking portal and advisor task intake.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIconUrl(null)}
                    className="gap-1 rounded-md text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handlePickIcon(e.dataTransfer.files?.[0]);
                  }}
                  className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-[#c2c6d5] bg-white p-6 transition-colors hover:border-[#004492]"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#eff6ff]">
                    <ImagePlus className="size-5 text-[#004492]" />
                  </span>
                  <span className="text-xs font-bold text-[#004492]">
                    Click to upload <span className="font-normal text-foreground">or drag and drop</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP, or SVG (Up to 5MB)</span>
                </button>
              )}
            </div>

            {/* Service Status Toggle */}
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-4">
              <div>
                <h3 className="text-xs font-semibold text-foreground">Active in Catalog</h3>
                <p className="text-[11px] text-muted-foreground">Enable this service for appointment booking and repair intake.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <span className={cn("text-xs font-bold", active ? "text-[#4caf50]" : "text-muted-foreground")}>
                  {active ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Live Previews & Actions */}
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
        {/* Pricing Calculation Preview */}
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2.5 border-b border-[#e5e7eb] pb-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-[rgba(0,68,146,0.1)]">
              <Tag className="size-4 text-[#004492]" />
            </span>
            <h3 className="text-base font-bold text-foreground">Pricing Breakdown</h3>
          </div>

          <div className="flex flex-col gap-3 pt-3 text-xs">
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e7eb] pb-2">
              <span className="text-muted-foreground">Base Service Fee</span>
              <span className="font-semibold text-foreground">
                {price === "" || !Number.isFinite(priceNum) ? "$0.00" : `$${priceNum.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e7eb] pb-2">
              <span className="text-muted-foreground">Estimated Bay Time</span>
              <span className="font-semibold text-foreground">{durationLabel(durationMins)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e7eb] pb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                Estimated Labor Rate
                <Info className="size-3 text-muted-foreground" />
              </span>
              <span className="font-semibold text-foreground">${laborCost.toFixed(2)}</span>
            </div>
            <div className="flex items-end justify-between rounded-lg bg-[#eff6ff] p-3 border border-[#bfdbfe]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#004492]">Customer Total</span>
                <p className="text-[10px] text-muted-foreground">Excludes replacement parts</p>
              </div>
              <span className="text-2xl font-bold text-[#004492]">${estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Portal Card Preview */}
        <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 border-b border-[#e5e7eb] bg-[#f8f9fa] px-4 py-3">
            <Check className="size-3.5 text-[#004492]" />
            <span className="text-xs font-semibold text-[#424753] uppercase tracking-wide">Customer Card Preview</span>
          </div>

          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-sm">
              <div className="relative h-28 w-full bg-[#f3f4f5]">
                {iconUrl ? (
                  <Image src={iconUrl} alt="Preview" fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eff6ff] to-[#e2e8f0]">
                    <Wrench className="size-8 text-[#004492]/40" />
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 rounded bg-[#004492] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                  {CATEGORIES.find((c) => c.value === category)?.label}
                </span>
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <Clock className="size-2.5" />
                  {durationLabel(durationMins)}
                </span>
              </div>

              <div className="p-3">
                <h4 className="text-sm font-bold text-foreground line-clamp-1">{name || "Service Name"}</h4>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {description || "Detailed description of the service appears here for customers."}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-[#e2e8f0] pt-2">
                  <span className="text-base font-bold text-[#004492]">
                    {price === "" || !Number.isFinite(priceNum) ? "$0.00" : `$${priceNum.toFixed(2)}`}
                  </span>
                  <span className="rounded bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-semibold text-[#15803d]">
                    {active ? "Available" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#004492] py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#004492]/90"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Service"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/services")}
            className="flex w-full items-center justify-center gap-2 rounded-md text-xs font-semibold text-[#424753]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}