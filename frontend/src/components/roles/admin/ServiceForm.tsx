"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarClock,
  Check,
  Clock,
  ImagePlus,
  Info,
  Trash2,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createService, updateService } from "@/store/slices/servicesSlice";
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

const LABOR_RATE_PER_HOUR = 45;

const durationLabel = (mins: number) =>
  mins < 60 ? `${mins} mins` : mins === 60 ? "1 Hour" : `${mins / 60}${mins % 60 === 0 ? "" : "x"} hrs`;

const errMsg = "mt-1 flex items-center gap-1 text-[11px] font-medium text-[#ba1a1a]";

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
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (iconUrl) URL.revokeObjectURL(iconUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEdit = Boolean(initial);
  const priceNum = Number(price);
  const durationMins = Number(duration);
  const laborCost = (durationMins / 60) * LABOR_RATE_PER_HOUR;
  const estimatedTotal = (Number.isFinite(priceNum) ? priceNum : 0) + laborCost;

  const duplicate = services.some(
    (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase() && s.id !== initial?.id,
  );
  const nameError = name.trim().length >= 2 ? (duplicate ? "Service Name already exists" : null) : name.trim() ? "Service Name must be at least 2 characters" : null;
  const priceError = price === "" ? null : !Number.isFinite(priceNum) || priceNum <= 0 ? "Base Price must be greater than 0" : null;

  const pickIcon = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image exceeds 5MB limit");
      return;
    }
    const url = URL.createObjectURL(file);
    setIconUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    toast.success("Icon preview ready — swipe in for final display uses a hosted URL");
  };

  const submit = async () => {
    if (nameError || !name.trim() || priceError || price === "" || priceNum <= 0) {
      toast.error("Fix the highlighted fields before saving");
      return;
    }
    setSubmitting(true);
    const data = {
      name: name.trim(),
      category,
      basePrice: Math.round(priceNum * 100) / 100,
      durationMins,
      description: description.trim(),
      active,
    };
    try {
      if (isEdit && initial) {
        await dispatch(updateService({ id: initial.id, data })).unwrap();
        toast.success("Service updated");
      } else {
        await dispatch(createService(data)).unwrap();
        toast.success("Service created");
      }
      router.push("/admin/services");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save service");
      setSubmitting(false);
    }
  };

  const inputCls =
    "h-[42px] w-full rounded-[4px] border border-[#c2c6d5] bg-white px-[17px] text-sm text-foreground outline-none placeholder:text-[#9ca3af] focus:border-primary";
  const invalidInputCls = "border-[#ba1a1a] bg-[rgba(255,218,214,0.1)]";

  return (
    <div className="grid grid-cols-12 items-start gap-6">
      <div className="col-span-8 flex flex-col gap-6">
        <div className="relative w-full overflow-hidden rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#004492]" />
          <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-[17px]">
            <span className="flex size-10 items-center justify-center rounded-md bg-[rgba(0,68,146,0.1)]">
              <Wrench className="size-5 text-[#004492]" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Service Information</h2>
              <p className="text-xs text-muted-foreground">Define the service, pricing and where it appears.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-6">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">
                Service Name <span className="text-[#f44336]">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oil Change Premium"
                className={cn(inputCls, nameError && invalidInputCls)}
              />
              {nameError && (
                <p className={errMsg}>
                  <AlertCircle className="size-3" />
                  {nameError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">Service Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className={cn(inputCls, "appearance-none pr-8")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">
                Base Price <span className="text-[#f44336]">*</span>
              </Label>
              <div className="relative">
                <span className="absolute top-1/2 left-[17px] -translate-y-1/2 text-base text-[#424753]">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={cn(inputCls, "pl-8", priceError && invalidInputCls)}
                />
              </div>
              {priceError && (
                <p className={errMsg}>
                  <AlertCircle className="size-3" />
                  {priceError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">Estimated Duration</Label>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute top-1/2 right-[14px] size-5 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={cn(inputCls, "appearance-none pr-10")}
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">Description</Label>
              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Provide a detailed description of what this service includes..."
                  className="min-h-28 resize-none rounded-[4px] border-[#c2c6d5] bg-white px-[17px] py-3 text-sm text-foreground placeholder:text-[#9ca3af]"
                />
                <span className="absolute right-3 bottom-2 text-[11px] font-medium text-[#424753]">{description.length}/500</span>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-xs font-semibold tracking-[0.24px] text-foreground">Service Icon / Image</Label>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/gif" className="hidden" onChange={(e) => pickIcon(e.target.files?.[0])} />
              {iconUrl ? (
                <div className="flex items-center gap-4 rounded-[8px] border border-[#e5e7eb] bg-[#f8f9fa] p-4">
                  <img src={iconUrl} alt="Service icon preview" className="h-16 w-24 rounded-md object-cover" />
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">Icon ready to display</p>
                    <p className="text-xs text-muted-foreground">800x400px recommended for the customer catalog.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => { if (iconUrl) URL.revokeObjectURL(iconUrl); setIconUrl(null); }} className="gap-1 rounded-md text-xs">
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); pickIcon(e.dataTransfer.files?.[0]); }}
                  className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-[8px] border-2 border-dashed border-[#c2c6d5] bg-white p-[30px] transition-colors hover:border-primary"
                >
                  <span className="flex size-12 items-center justify-center rounded-[12px] border border-[#e5e7eb] bg-[#edeeef]">
                    <ImagePlus className="size-5 text-[#004492]" />
                  </span>
                  <span className="pt-2 text-sm font-bold text-[#004492]">
                    Click to upload <span className="font-normal text-foreground">or drag and drop</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#424753]">SVG, PNG, JPG or GIF (MAX. 800x400px)</span>
                </button>
              )}
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-[4px] border border-[#e5e7eb] bg-[#f3f4f5] p-[17px]">
              <div>
                <h3 className="text-xs font-semibold tracking-[0.24px] text-foreground">Service Status</h3>
                <p className="text-[11px] font-medium text-[#424753]">Control visibility in customer portal</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <span className="text-xs font-semibold tracking-[0.24px] text-foreground">{active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-4 flex flex-col gap-6">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 border-b border-[#e5e7eb] pb-[17px]">
            <span className="flex size-9 items-center justify-center rounded-md bg-[rgba(0,68,146,0.1)]">
              <Wrench className="size-[18px] text-[#004492]" />
            </span>
            <h3 className="text-xl font-semibold text-foreground">Pricing Preview</h3>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e7eb] py-2">
              <span className="text-sm text-[#424753]">Base Price</span>
              <span className="text-xl font-semibold text-foreground">{price === "" || !Number.isFinite(priceNum) ? "$0.00" : `$${priceNum.toFixed(2)}`}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e7eb] py-2">
              <span className="text-sm text-[#424753]">Est. Duration</span>
              <span className="text-sm text-foreground">{durationLabel(durationMins)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-[#e5e7eb] py-2">
              <span className="flex items-center gap-1 text-sm text-[#424753]">
                Expected Labor Cost
                <Info className="size-3 text-muted-foreground" />
              </span>
              <span className="text-sm text-foreground">${laborCost.toFixed(2)}</span>
            </div>
            <div className="flex items-end justify-between rounded-[4px] border border-[#e5e7eb] bg-[#f8f9fa] p-[17px]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                  Estimated
                  <br />
                  Total
                </span>
                <span className="text-[10px] text-[#424753]">Subject to parts</span>
              </div>
              <span className="text-4xl font-bold tracking-[-0.72px] text-[#004492]">${estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white pb-[17px] pt-[25px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 border-b border-[#e5e7eb] bg-[#f3f4f5] px-4 py-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
              <Check className="size-3" />
              Customer View Preview
            </span>
          </div>
          <div className="flex justify-center pt-4">
            <div className="w-[262px] rounded-[4px] border border-[#e5e7eb] bg-[#f8f9fa] p-[17px]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-[rgba(0,68,146,0.1)]">
                  {iconUrl ? (
                    <img src={iconUrl} alt="" className="size-10 rounded-md object-cover" />
                  ) : (
                    <Wrench className="size-4 text-[#004492]" />
                  )}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold tracking-[0.24px] text-foreground">{name || "Service Name"}</p>
                  <span className="rounded-[12px] bg-[#e7e8e9] px-2 py-0.5 text-[11px] font-medium text-[#424753]">
                    {CATEGORIES.find((c) => c.value === category)?.label}
                  </span>
                </div>
              </div>
              <p className="pt-3 text-sm leading-5 text-[#424753]">
                {description || "Service description preview shown to customers."}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-[17px]">
                <span className="text-xl font-bold text-foreground">{price === "" || !Number.isFinite(priceNum) ? "TBD" : `$${priceNum.toFixed(2)}`}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#424753]">
                  <Clock className="size-3" />
                  {durationLabel(durationMins)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#004492] py-3 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
          >
            <Check className="size-3.5" />
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Save Service"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/services")}
            className="flex w-full items-center justify-center gap-2 rounded-[4px] border-[#c2c6d5] bg-[#edeeef] py-3 text-xs font-semibold tracking-[0.24px] text-foreground hover:bg-[#e1e3e4]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}