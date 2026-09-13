"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarPlus,
  Car,
  CheckCircle2,
  ChevronRight,
  History,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, deleteVehicle, selectVehicle } from "@/store/slices/vehiclesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import { CardsGridLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function MyVehiclesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const vehiclesStatus = useAppSelector((s) => s.vehicles.status);
  const tasks = useAppSelector((s) => s.tasks.items);

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_service" | "ready" | "healthy">("all");
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (tasks.length === 0) dispatch(fetchTasks());
  }, [dispatch, vehicles.length, tasks.length]);

  const refreshAll = () => {
    dispatch(fetchVehicles());
    dispatch(fetchTasks());
    toast.success("Vehicles refreshed");
  };

  const tasksByVehicle = (vehicleId: string) => tasks.filter((t) => t.vehicleId === vehicleId);

  const bookService = (vehicle: Vehicle) => {
    dispatch(selectVehicle(vehicle.id));
    router.push("/dashboard/appointments/book");
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

  // Metrics
  const inServiceCount = useMemo(() => {
    return vehicles.filter((v) =>
      tasks.some(
        (t) =>
          t.vehicleId === v.id &&
          ["received", "inspecting", "repairing", "testing"].includes(t.status),
      ),
    ).length;
  }, [vehicles, tasks]);

  const readyCount = useMemo(() => {
    return vehicles.filter((v) =>
      tasks.some((t) => t.vehicleId === v.id && t.status === "ready"),
    ).length;
  }, [vehicles, tasks]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.regNo.toLowerCase().includes(q) ||
        String(v.year).includes(q);

      if (!matchesSearch) return false;

      const inService = tasks.some(
        (t) =>
          t.vehicleId === v.id &&
          ["received", "inspecting", "repairing", "testing"].includes(t.status),
      );
      const isReady = tasks.some((t) => t.vehicleId === v.id && t.status === "ready");

      if (statusFilter === "in_service") return inService;
      if (statusFilter === "ready") return isReady;
      if (statusFilter === "healthy") return !inService && !isReady;
      return true;
    });
  }, [vehicles, tasks, search, statusFilter]);

  if ((vehiclesStatus === "idle" || vehiclesStatus === "loading") && vehicles.length === 0) {
    return <CardsGridLoading label="Loading vehicles" count={3} />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-foreground">My Vehicles</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">My Vehicles</h1>
              <p className="text-sm text-muted-foreground pt-0.5">
                Manage your registered fleet, schedule service bookings, and track maintenance records.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-xs hover:bg-secondary cursor-pointer"
              >
                <RefreshCw className="size-3.5 text-primary" />
                Refresh
              </Button>
              <Link
                href="/dashboard/vehicles/new"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <Plus className="size-4" />
                Register New Vehicle
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Fleet</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{vehicles.length}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Car className="size-5" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">In Service</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{inServiceCount}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="size-5" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ready for Pickup</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{readyCount}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Service Records</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{tasks.length}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <History className="size-5" />
            </span>
          </div>
        </div>

        {/* Toolbar: Search, Status Tabs & Table/Grid Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3.5 shadow-xs">
          <div className="flex flex-1 items-center gap-3 min-w-[260px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by make, model, plate..."
                className="h-9 w-full rounded-xl bg-[#f1f3f5] pr-8 pl-9 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-border border border-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                All ({vehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("in_service")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "in_service"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                In Service ({inServiceCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ready")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "ready"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Ready ({readyCount})
              </button>
            </div>
          </div>

          {/* View Mode Switcher (Table default vs Grid) */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-[#f8f9fa] p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Table View"
            >
              <List className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Car className="size-7" />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">
                {vehicles.length === 0 ? "No vehicles registered yet" : "No vehicles match your search"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicles.length === 0
                  ? "Register your car to access service tracking, instant booking, and maintenance history."
                  : "Try clearing your search term or status filter."}
              </p>
            </div>
            {vehicles.length === 0 && (
              <Link
                href="/dashboard/vehicles/new"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs"
              >
                Register Your First Vehicle
              </Link>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW (Default) */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa] border-b border-border">
                  <TableHead className="w-[300px] text-xs font-bold text-muted-foreground uppercase tracking-wider py-3.5">
                    Vehicle
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    License Plate
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Fuel & Mileage
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Workshop Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Services
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => {
                  const vehicleTasks = tasksByVehicle(vehicle.id);
                  const activeTask = vehicleTasks.find((t) =>
                    ["received", "inspecting", "repairing", "testing"].includes(t.status),
                  );
                  const isReady = vehicleTasks.some((t) => t.status === "ready");
                  return (
                    <TableRow key={vehicle.id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                      <TableCell className="py-3">
                        <Link
                          href={`/dashboard/vehicles/${vehicle.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-[#f1f3f5]">
                            <VehicleImage
                              src={vehicle.image}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">VIN: {vehicle.vin || "Standard VIN"}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md border border-border bg-[#f8f9fa] px-2.5 py-1 font-mono text-xs font-bold text-foreground shadow-2xs">
                          {vehicle.regNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {vehicle.mileage.toLocaleString()} mi
                          </span>
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {vehicle.fuelType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTask ? (
                          <Link
                            href={`/dashboard/services/${activeTask.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary hover:underline"
                          >
                            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                            In Service ({activeTask.status})
                          </Link>
                        ) : isReady ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            Ready for Pickup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            Healthy
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-foreground">
                          {vehicleTasks.length} record{vehicleTasks.length === 1 ? "" : "s"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => bookService(vehicle)}
                            className="flex items-center gap-1 rounded-xl bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs"
                          >
                            <CalendarPlus className="size-3.5" />
                            Book
                          </button>
                          <Link
                            href={`/dashboard/services?vehicle=${encodeURIComponent(vehicle.id)}`}
                            className="flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                          >
                            <History className="size-3.5 text-muted-foreground" />
                            History
                          </Link>
                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}/edit`}
                            className="flex size-8 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                            title="Edit Vehicle"
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleting(vehicle)}
                            className="flex size-8 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Vehicle"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const vehicleTasks = tasksByVehicle(vehicle.id);
              const activeTask = vehicleTasks.find((t) =>
                ["received", "inspecting", "repairing", "testing"].includes(t.status),
              );
              return (
                <div
                  key={vehicle.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <Link href={`/dashboard/vehicles/${vehicle.id}`} className="block">
                    <div className="relative h-44 w-full overflow-hidden bg-[#f1f3f5] p-3 flex items-center justify-center">
                      <VehicleImage
                        src={vehicle.image}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-contain p-2"
                      />
                      <span className="absolute right-3 bottom-3 rounded-md border border-border/80 bg-white/95 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-foreground shadow-2xs">
                        {vehicle.regNo}
                      </span>
                      {activeTask && (
                        <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                          <span className="size-1.5 animate-pulse rounded-full bg-white" />
                          In Service
                        </span>
                      )}
                    </div>
                    <div className="px-5 pt-4">
                      <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)} •{" "}
                        {vehicle.mileage.toLocaleString()} mi
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => bookService(vehicle)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-soft py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs"
                      >
                        <CalendarPlus className="size-3.5" />
                        Book
                      </button>
                      <Link
                        href={`/dashboard/services?vehicle=${encodeURIComponent(vehicle.id)}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                      >
                        <History className="size-3.5" />
                        History ({vehicleTasks.length})
                      </Link>
                      <Link
                        href={`/dashboard/vehicles/${vehicle.id}/edit`}
                        className="flex size-8 items-center justify-center rounded-xl border border-border p-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                        aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleting(vehicle)}
                        className="flex size-8 items-center justify-center rounded-xl border border-border p-2 text-muted-foreground hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer"
                        aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {activeTask && (
                      <Link
                        href={`/dashboard/services/${activeTask.id}`}
                        className="flex items-center justify-center gap-1 text-center text-xs font-bold text-primary hover:underline pt-1"
                      >
                        Track {activeTask.id} ({cap(activeTask.status)}) <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Remove {deleting?.make} {deleting?.model}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will permanently remove the vehicle along with its appointments and service records from your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={saving}
              className="rounded-xl font-semibold shadow-xs"
            >
              {saving ? "Removing..." : "Remove Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
