"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks, updateTaskStatus } from "@/store/slices/tasksSlice";
import { downloadTaskCardPdf } from "@/lib/pdf";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";
import { PriorityPill } from "@/components/roles/mechanic/StatusBadge";
import { MechanicNotes } from "@/components/roles/mechanic/MechanicNotes";
import { PartsUsedTable } from "@/components/roles/mechanic/PartsUsedTable";
import { RepairPhotos } from "@/components/roles/mechanic/RepairPhotos";
import { Button } from "@/components/ui/button";
import { DetailLoading } from "@/components/ui/loading";
import type { TaskStatus } from "@/types";

const STATUS_ORDER: TaskStatus[] = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

export default function RepairProgressPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const user = useAppSelector((s) => s.auth.user);
  const task = tasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (tasksStatus === "idle") dispatch(fetchTasks());
  }, [dispatch, tasksStatus]);

  if (tasksStatus === "loading" && !task) {
    return <DetailLoading label="Loading task card" />;
  }
  if (!task) {
    return (
      <div className="bg-background min-h-screen p-8">
        <p className="text-muted-foreground">Task card not found.</p>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const nextStatus = STATUS_ORDER[Math.min(currentIdx + 1, STATUS_ORDER.length - 1)];

  const advanceStage = async () => {
    if (task.status === "completed") return;
    try {
      await dispatch(updateTaskStatus({ id: task.id, status: nextStatus })).unwrap();
      toast.success(`Task moved to ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between pb-2">
          <h1 className="text-2xl font-bold text-foreground">Repair Progress</h1>
          <PriorityPill priority={task.priority} />
        </div>

        <section className="flex gap-4 rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {[
            { label: "Vehicle", value: task.vehicle ? `${task.vehicle.year} ${task.vehicle.make} ${task.vehicle.model}` : task.vehicleId },
            { label: "Customer", value: task.customer?.name ?? task.customerId },
            {
              label: "Mechanic",
              value:
                task.mechanics && task.mechanics.length > 0
                  ? task.mechanics.map((m) => m.name).join(", ")
                  : task.mechanic?.name ?? task.mechanicId ?? "Not assigned",
            },
            { label: "Advisor", value: task.advisor?.name ?? task.advisorId },
            { label: "Station", value: task.station ?? "Not assigned" },
          ].map((f) => (
            <div key={f.label} className="flex flex-1 flex-col gap-1">
              <span className="text-[13px] text-muted-foreground">{f.label}</span>
              <span className="text-sm font-semibold text-foreground">{f.value}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <h2 className="text-base font-medium text-foreground">Status</h2>
          <ProgressStepper steps={task.progress} />
        </section>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <MechanicNotes taskId={task.id} notes={task.notes} author={user?.name ?? "Mechanic"} />
            <PartsUsedTable taskId={task.id} parts={task.partsUsed} />
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <RepairPhotos taskId={task.id} photos={task.photos} />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => { downloadTaskCardPdf(task); toast.success("Task card PDF downloaded"); }}
                className="rounded border-[#c2c6d5] bg-secondary text-foreground hover:bg-muted"
              >
                Download Task Card
              </Button>
              <Button
                onClick={advanceStage}
                disabled={task.status === "completed"}
                className="rounded bg-[rgba(0,82,204,0.1)] text-primary hover:bg-[rgba(0,82,204,0.15)]"
              >
                Mark Next Stage
              </Button>
              <Button
                onClick={() => {
                  dispatch(updateTaskStatus({ id: task.id, status: "completed" }))
                    .unwrap()
                    .then(() => toast.success("Task marked as completed"))
                    .catch((err: Error) => toast.error(err.message));
                }}
                disabled={task.status === "completed"}
                className="rounded"
              >
                Complete Task
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
