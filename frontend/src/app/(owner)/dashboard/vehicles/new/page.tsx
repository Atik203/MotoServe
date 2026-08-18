"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CalendarCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, addVehicle, selectVehicle } from "@/store/slices/vehiclesSlice";
import { VehicleForm, type VehicleFormData } from "@/components/roles/owner/VehicleForm";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/types";

export default function RegisterVehiclePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const submit = async (data: VehicleFormData) => {
    await dispatch(addVehicle(data)).unwrap();
    router.push("/dashboard/vehicles");
  };

  const bookService = (vehicle: Vehicle) => {
    dispatch(selectVehicle(vehicle.id));
    router.push("/dashboard/appointments/book");
  };

  const serviceHistory = (vehicle: Vehicle) => {
    router.push(`/dashboard/services?vehicle=${encodeURIComponent(vehicle.id)}`);
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-[11px] text-muted-foreground">Dashboard › Vehicles › Register</p>
          <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Register New Vehicle</h1>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7">
            <VehicleForm onSubmit={submit} />
          </div>

          <div className="col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <CalendarCheck className="size-5" />
                Recent Registrations
              </h2>
              <Link href="/dashboard/vehicles" className="text-[11px] font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            {vehicles.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center text-sm text-muted-foreground">
                No vehicles registered yet — your registered vehicles will appear here.
              </div>
            )}
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="w-full overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:border-primary/40">
                <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                  <div className="relative h-32 bg-[#eef1f4]">
                    <VehicleImage src={vehicle.image} alt={vehicle.model} fill className="object-contain p-2" />
                    <span className="absolute bottom-2 left-2 rounded-sm border border-border bg-white/90 px-[9px] py-0.75 text-[11px] font-semibold text-foreground backdrop-blur-[2px]">
                      {vehicle.regNo}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col gap-2 p-4">
                  <Link href={`/dashboard/vehicles/${vehicle.id}`} className="group">
                    <p className="text-xs font-semibold tracking-[0.24px] text-foreground group-hover:text-primary">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
                      {vehicle.transmission ? ` • ${vehicle.transmission}` : ""} • {vehicle.mileage.toLocaleString()} mi
                    </p>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => serviceHistory(vehicle)}
                      className="rounded-lg text-[11px]"
                    >
                      Service History
                    </Button>
                    <Button type="button" size="sm" onClick={() => bookService(vehicle)} className="rounded-lg text-[11px]">
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