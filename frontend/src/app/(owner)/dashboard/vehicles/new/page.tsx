"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Car, ChevronDown, ImagePlus, Upload, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, addVehicle } from "@/store/slices/vehiclesSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterVehiclePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "2024",
    regNo: "",
    color: "",
    mileage: "0",
    fuelType: "Gasoline",
    transmission: "Automatic",
    vin: "",
  });

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim() || !form.regNo.trim()) {
      toast.error("Please fill in brand, model and registration number");
      return;
    }
    try {
      await dispatch(
        addVehicle({
          make: form.make.trim(),
          model: form.model.trim(),
          year: Number(form.year) || 2024,
          regNo: form.regNo.trim(),
          fuelType: "gasoline",
          mileage: Number(form.mileage) || 0,
          image: "/images/cars/toyota-camry.png",
        }),
      ).unwrap();
      toast.success("Vehicle registered successfully");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register vehicle");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-[11px] text-muted-foreground">Dashboard › Vehicles › Register</p>
          <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Register New Vehicle</h1>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <form
            onSubmit={submit}
            className="col-span-7 flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
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

              {(["fuelType", "transmission"] as const).map((key) => (
                <div key={key} className="flex flex-col gap-[8.5px]">
                  <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                    {key === "fuelType" ? "Fuel Type" : "Transmission"}
                  </Label>
                  <div className="relative">
                    <Input value={form[key]} readOnly className="h-[38px] cursor-pointer rounded border-[#6b7280] bg-[#f8f9fa]" />
                    <ChevronDown className="absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Vehicle Identification Number (VIN)</Label>
                <span className="text-[10px] tracking-[0.24px] text-muted-foreground">Optional</span>
              </div>
              <Input value={form.vin} onChange={set("vin")} placeholder="Enter 17-character VIN" className="h-[38px] rounded border-[#6b7280] bg-[#f8f9fa] uppercase" />
            </div>

            <div className="flex flex-col gap-[8.5px]">
              <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Upload Vehicle, Insurance and Registration Photo</Label>
              <div className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-[#f8f9fa] p-[26px]">
                <ImagePlus className="size-6 text-muted-foreground" />
                <p className="text-sm text-foreground">
                  Drag & drop an image here, or <span className="font-medium text-primary">browse</span>
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">Supports JPG, PNG (Max 5MB)</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-[25px]">
              <Button type="submit" className="gap-2 rounded px-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <Upload className="size-[15px]" />
                Register Vehicle
              </Button>
            </div>
          </form>

          <div className="col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <CalendarCheck className="size-5" />
                Recent Registrations
              </h2>
              <span className="text-[11px] font-medium text-primary">View All</span>
            </div>
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="w-full overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                <div className="relative h-32 bg-[#e1e3e4]">
                  <Image src={vehicle.image} alt={vehicle.model} fill className="object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-sm border border-border bg-white/90 px-[9px] py-0.75 text-[11px] font-semibold text-foreground backdrop-blur-[2px]">
                    {vehicle.regNo}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24px] text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)} • {vehicle.mileage.toLocaleString()} mi
                      </p>
                    </div>
                    <Wrench className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg text-[11px]">
                      Service History
                    </Button>
                    <Button size="sm" className="rounded-lg text-[11px]">
                      Book Service
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
