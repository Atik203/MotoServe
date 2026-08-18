"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, updateVehicle } from "@/store/slices/vehiclesSlice";
import { VehicleForm, type VehicleFormData } from "@/components/roles/owner/VehicleForm";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const vehicle = vehicles.find((v) => v.id === params.id) ?? null;

  if (!vehicle) {
    return (
      <div className="bg-background min-h-screen p-8 text-sm text-muted-foreground">
        {vehicles.length === 0 ? "Loading vehicle..." : "Vehicle not found."}
      </div>
    );
  }

  const submit = async (data: VehicleFormData) => {
    await dispatch(updateVehicle({ id: vehicle.id, data })).unwrap();
    router.push(`/dashboard/vehicles/${vehicle.id}`);
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <Link
            href={`/dashboard/vehicles/${vehicle.id}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#424753] hover:text-primary"
          >
            <ArrowLeft className="size-3" />
            Back to vehicle details
          </Link>
          <p className="pt-1 text-[11px] text-muted-foreground">
            Dashboard › Vehicles › {vehicle.regNo} › Edit
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Edit Vehicle</h1>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7">
            <VehicleForm initial={vehicle} submitLabel="Update Vehicle" onSubmit={submit} />
          </div>

          <div className="col-span-5 space-y-4">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="relative h-40 bg-[#eef1f4]">
                <VehicleImage
                  src={vehicle.image}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-contain p-3"
                />
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{vehicle.regNo}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-white p-[17px]">
              <p className="text-xs font-semibold tracking-[0.24px] text-foreground uppercase">What changes here</p>
              <ul className="flex flex-col gap-2 text-xs leading-relaxed text-[#424753]">
                <li>• Update vehicle details like year, model, fuel type and transmission.</li>
                <li>• Replace the cover photo or add more vehicle, insurance &amp; registration photos.</li>
                <li>• Past service records and appointments are preserved.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}