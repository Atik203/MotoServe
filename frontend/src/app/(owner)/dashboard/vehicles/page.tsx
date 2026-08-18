"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, History, Pencil, Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, updateVehicle, deleteVehicle } from "@/store/slices/vehiclesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FuelType, Vehicle } from "@/types";

const FUEL_TYPES: FuelType[] = ["gasoline", "diesel", "hybrid", "electric"];

export default function MyVehiclesPage() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (jobs.length === 0) dispatch(fetchJobs());
  }, [dispatch, vehicles.length, jobs.length]);

  const jobsByVehicle = (vehicleId: string) => jobs.filter((j) => j.vehicleId === vehicleId);

  const handleSave = async (data: Partial<Omit<Vehicle, "id" | "ownerId">>) => {
    if (!editing) return;
    setSaving(true);
    try {
      await dispatch(updateVehicle({ id: editing.id, data })).unwrap();
      toast.success("Vehicle updated");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await dispatch(deleteVehicle(deleting.id)).unwrap();
      toast.success("Vehicle removed");
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard › My Vehicles</p>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">My Vehicles</h1>
          </div>
          <Link
            href="/dashboard/vehicles/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Plus className="size-4" />
            Register New Vehicle
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft">
              <Plus className="size-6 text-primary" />
            </span>
            <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
            <Link
              href="/dashboard/vehicles/new"
              className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Register Your First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const vehicleJobs = jobsByVehicle(vehicle.id);
              const activeJob = vehicleJobs.find((j) => !["completed", "ready"].includes(j.status));
              return (
                <div
                  key={vehicle.id}
                  className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <div className="relative h-40 w-full bg-secondary">
                    <VehicleImage src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
                    <span className="absolute right-3 bottom-3 rounded-sm bg-[rgba(46,49,50,0.8)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.5px] text-white">
                      {vehicle.regNo}
                    </span>
                    {activeJob && (
                      <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                        In Service
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 p-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)} • {vehicle.mileage.toLocaleString()} mi
                      </p>
                    </div>
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                      <Link
                        href="/dashboard/appointments/book"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded bg-primary-soft py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        <CalendarPlus className="size-3.5" />
                        Book Service
                      </Link>
                      <Link
                        href="/dashboard/history"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded border border-border py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
                      >
                        <History className="size-3.5" />
                        History ({vehicleJobs.length})
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(vehicle)}
                        className="flex items-center justify-center rounded border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(vehicle)}
                        className="flex items-center justify-center rounded border border-border p-2 text-muted-foreground transition-colors hover:border-[#ba1a1a]/40 hover:text-[#ba1a1a]"
                        aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {activeJob && (
                      <Link
                        href={`/dashboard/services/${activeJob.id}`}
                        className="text-center text-xs font-semibold text-primary hover:underline"
                      >
                        Track {activeJob.id} — {activeJob.status.charAt(0).toUpperCase() + activeJob.status.slice(1)}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Edit Vehicle</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editing?.year} {editing?.make} {editing?.model} • {editing?.regNo}
            </DialogDescription>
          </DialogHeader>
          <EditVehicleForm vehicle={editing} saving={saving} onSave={handleSave} onClose={() => setEditing(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Remove {deleting?.make} {deleting?.model}?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This vehicle will be removed from your garage. Past service records are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="rounded-lg">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={saving} className="rounded-lg">
              {saving ? "Removing..." : "Remove Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditVehicleForm({
  vehicle,
  saving,
  onSave,
  onClose,
}: {
  vehicle: Vehicle | null;
  saving: boolean;
  onSave: (data: Partial<Omit<Vehicle, "id" | "ownerId">>) => void;
  onClose: () => void;
}) {
  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [year, setYear] = useState(vehicle ? String(vehicle.year) : "");
  const [regNo, setRegNo] = useState(vehicle?.regNo ?? "");
  const [fuelType, setFuelType] = useState<FuelType>(vehicle?.fuelType ?? "gasoline");
  const [mileage, setMileage] = useState(vehicle ? String(vehicle.mileage) : "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !regNo.trim()) return;
    onSave({
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      regNo: regNo.trim(),
      fuelType,
      mileage: Number(mileage),
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Make</Label>
          <Input value={make} onChange={(e) => setMake(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Model</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Year</Label>
          <Input type="number" min="1950" max="2100" value={year} onChange={(e) => setYear(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Registration No.</Label>
          <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Fuel Type</Label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-foreground">Mileage (mi)</Label>
          <Input type="number" min="0" value={mileage} onChange={(e) => setMileage(e.target.value)} className="h-10 rounded-lg border-border bg-white" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="rounded-lg">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
