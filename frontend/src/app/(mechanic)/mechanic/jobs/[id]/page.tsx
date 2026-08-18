"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs, updateJobStatus } from "@/store/slices/jobsSlice";
import { downloadJobCardPdf } from "@/lib/pdf";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";
import { PriorityPill } from "@/components/roles/mechanic/StatusBadge";
import { MechanicNotes } from "@/components/roles/mechanic/MechanicNotes";
import { PartsUsedTable } from "@/components/roles/mechanic/PartsUsedTable";
import { RepairPhotos } from "@/components/roles/mechanic/RepairPhotos";
import { Button } from "@/components/ui/button";

const STATUS_ORDER = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

export default function RepairProgressPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const dispatch = useAppDispatch();

  const jobs = useAppSelector((s) => s.jobs.items);
  const user = useAppSelector((s) => s.auth.user);
  const job = jobs.find((j) => j.id === jobId);

  useEffect(() => {
    if (jobs.length === 0) dispatch(fetchJobs());
  }, [dispatch, jobs.length]);

  if (!job) {
    return (
      <div className="bg-background min-h-screen p-8">
        <p className="text-muted-foreground">Loading job card...</p>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(job.status);
  const nextStatus = STATUS_ORDER[Math.min(currentIdx + 1, STATUS_ORDER.length - 1)];

  const advanceStage = async () => {
    if (job.status === "completed") return;
    try {
      await dispatch(updateJobStatus({ id: job.id, status: nextStatus as never })).unwrap();
      toast.success(`Job moved to ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between pb-2">
          <h1 className="text-2xl font-bold text-foreground">Repair Progress</h1>
          <PriorityPill priority={job.priority} />
        </div>

        <section className="flex gap-4 rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {[
            { label: "Vehicle", value: job.vehicle ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}` : job.vehicleId },
            { label: "Customer", value: job.customer?.name ?? job.customerId },
            { label: "Mechanic", value: job.mechanic?.name ?? job.mechanicId ?? "Not assigned" },
            { label: "Advisor", value: job.advisor?.name ?? job.advisorId },
            { label: "Station", value: job.station ?? "Not assigned" },
          ].map((f) => (
            <div key={f.label} className="flex flex-1 flex-col gap-1">
              <span className="text-[13px] text-muted-foreground">{f.label}</span>
              <span className="text-sm font-semibold text-foreground">{f.value}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <h2 className="text-base font-medium text-foreground">Status</h2>
          <ProgressStepper steps={job.progress} />
        </section>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <MechanicNotes jobId={job.id} notes={job.notes} author={user?.name ?? "Mechanic"} />
            <PartsUsedTable jobId={job.id} parts={job.partsUsed} />
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <RepairPhotos jobId={job.id} photos={job.photos} />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => { downloadJobCardPdf(job); toast.success("Job card PDF downloaded"); }}
                className="rounded border-[#c2c6d5] bg-secondary text-foreground hover:bg-muted"
              >
                Download Job Card
              </Button>
              <Button
                onClick={advanceStage}
                disabled={job.status === "completed"}
                className="rounded bg-[rgba(0,82,204,0.1)] text-primary hover:bg-[rgba(0,82,204,0.15)]"
              >
                Mark Next Stage
              </Button>
              <Button
                onClick={() => {
                  dispatch(updateJobStatus({ id: job.id, status: "completed" }))
                    .unwrap()
                    .then(() => toast.success("Job marked as completed"))
                    .catch((err: Error) => toast.error(err.message));
                }}
                disabled={job.status === "completed"}
                className="rounded"
              >
                Complete Job
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
