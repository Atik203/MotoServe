"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs, updateJobStatus } from "@/store/slices/jobsSlice";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";
import { PriorityPill } from "@/components/roles/mechanic/StatusBadge";
import { MechanicNotes } from "@/components/roles/mechanic/MechanicNotes";
import { PartsUsedTable } from "@/components/roles/mechanic/PartsUsedTable";
import { RepairPhotos } from "@/components/roles/mechanic/RepairPhotos";
import { Button } from "@/components/ui/button";

import type { JobCard } from "@/types";

const STATUS_ORDER = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

const vehicles = new Map<string, string>([
  ["veh-001", "2023 Ford F-150"],
  ["veh-002", "2022 Toyota Camry"],
  ["veh-003", "2021 Honda Civic"],
]);
const customers = new Map<string, string>([
  ["cus-001", "John Doe"],
  ["cus-002", "Jane Smith"],
  ["cus-003", "Michael Brown"],
]);
const advisors = new Map<string, string>([["emp-001", "Sarah Jenkins"]]);

const vehicleName = (id: JobCard["vehicleId"]) => vehicles.get(id) ?? id;
const customerName = (id: JobCard["customerId"]) => customers.get(id) ?? id;
const advisorName = (id: JobCard["advisorId"]) => advisors.get(id) ?? id;

export default function RepairProgressPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const dispatch = useAppDispatch();

  const jobs = useAppSelector((s) => s.jobs.items);
  const job = jobs.find((j) => j.id === jobId);

  useEffect(() => {
    if (jobs.length === 0) dispatch(fetchJobs());
  }, [dispatch, jobs.length]);

  if (!job) {
    return (
      <div className="bg-background min-h-screen p-[32px]">
        <p className="text-muted-foreground">Loading job card...</p>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(job.status);
  const nextStatus = STATUS_ORDER[Math.min(currentIdx + 1, STATUS_ORDER.length - 1)];

  const advanceStage = () => {
    if (job.status === "completed") return;
    dispatch(updateJobStatus({ id: job.id, status: nextStatus as never }));
    toast.success(`Job moved to ${nextStatus}`);
  };

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-center justify-between pb-[8px]">
          <h1 className="text-[24px] font-bold text-foreground">Repair Progress</h1>
          <PriorityPill priority={job.priority} />
        </div>

        <section className="flex gap-[16px] rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          {[
            { label: "Vehicle", value: vehicleName(job.vehicleId) },
            { label: "Customer", value: customerName(job.customerId) },
            { label: "Job Card", value: job.id, blue: true },
            { label: "Advisor", value: advisorName(job.advisorId) },
            { label: "Station", value: job.station ?? "Not assigned" },
          ].map((f) => (
            <div key={f.label} className="flex flex-1 flex-col gap-[4px]">
              <span className="text-[13px] text-muted-foreground">{f.label}</span>
              <span className={`text-[14px] font-semibold ${f.blue ? "text-primary" : "text-foreground"}`}>
                {f.value}
              </span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-[24px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <h2 className="text-[16px] font-medium text-foreground">Status</h2>
          <ProgressStepper steps={job.progress} />
        </section>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <MechanicNotes jobId={job.id} notes={job.notes} author="Alex Turner" />
            <PartsUsedTable jobId={job.id} parts={job.partsUsed} />
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <RepairPhotos photos={job.photos} />
            <div className="flex flex-col gap-[8px]">
              <Button variant="outline" className="rounded-[4px] border-[#c2c6d5] bg-secondary text-foreground hover:bg-muted">
                Save Progress
              </Button>
              <Button
                onClick={advanceStage}
                disabled={job.status === "completed"}
                className="rounded-[4px] bg-[rgba(0,82,204,0.1)] text-primary hover:bg-[rgba(0,82,204,0.15)]"
              >
                Mark Next Stage
              </Button>
              <Button
                onClick={() => {
                  dispatch(updateJobStatus({ id: job.id, status: "completed" }));
                  toast.success("Job marked as completed");
                }}
                disabled={job.status === "completed"}
                className="rounded-[4px]"
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
