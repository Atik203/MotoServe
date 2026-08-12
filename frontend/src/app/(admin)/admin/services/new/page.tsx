"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/store/hooks";
import { createService } from "@/store/slices/servicesSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "maintenance", label: "Maintenance" },
  { value: "repairs", label: "Repairs" },
  { value: "inspections", label: "Inspections" },
];

const DURATIONS = [
  { value: "30", label: "30 mins" },
  { value: "45", label: "45 mins" },
  { value: "60", label: "1 hr" },
  { value: "120", label: "2 hrs" },
];

const fieldClass = "h-[38px] w-full rounded border-[#e2e8f0] bg-[#f8f9fa] text-sm";

export default function NewServicePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("maintenance");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      toast.error("Service name and a valid price are required");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        createService({
          name: name.trim(),
          category: category as "maintenance" | "repairs" | "inspections",
          basePrice: Number(price),
          durationMins: Number(duration),
          description: description.trim(),
          active,
        }),
      ).unwrap();
      toast.success("Service created");
      router.push("/admin/services");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create service");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#727784]">
            <span>Services</span>
            <span>›</span>
            <span className="text-foreground">New Service</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Add New Service</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[25px] rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748b]">Service Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oil Change" className={fieldClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748b]">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748b]">Base Price</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={`${fieldClass} pl-6`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748b]">Est. Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748b]">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this service includes..."
                className="min-h-24 resize-none rounded border-[#e2e8f0] bg-[#f8f9fa] text-sm"
              />
            </div>

            <div className="col-span-2 flex items-center gap-3">
              <Label className="text-xs font-medium text-[#64748b]">Status</Label>
              <Switch checked={active} onCheckedChange={setActive} />
              <span className="text-xs text-[#64748b]">Active</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/services")}
              className="rounded border-[#e2e8f0] px-[17px] py-[9px] text-xs font-semibold tracking-[0.24px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              {submitting ? "Creating..." : "Create Service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
