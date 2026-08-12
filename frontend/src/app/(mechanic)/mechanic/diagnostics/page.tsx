"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Activity, BatteryCharging, Cpu, Gauge, Loader2, ScanLine, ShieldAlert, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanModule {
  id: string;
  label: string;
  icon: typeof Gauge;
  desc: string;
  codes: string[];
}

const MODULES: ScanModule[] = [
  {
    id: "engine",
    label: "Engine Scan",
    icon: Cpu,
    desc: "Reads live engine parameters and stored DTCs.",
    codes: ["P0300 — Random/Multiple Cylinder Misfire", "P0171 — System Too Lean (Bank 1)"],
  },
  {
    id: "battery",
    label: "Battery & Charging Test",
    icon: BatteryCharging,
    desc: "Measures battery health, voltage, and alternator output.",
    codes: ["12.6V Static • 14.2V Charging — Battery healthy"],
  },
  {
    id: "brakes",
    label: "Brake System Check",
    icon: Wrench,
    desc: "Checks ABS module, sensors, and brake fluid level.",
    codes: ["C0035 — Left Front Wheel Speed Sensor Circuit"],
  },
  {
    id: "full",
    label: "Full System Sweep",
    icon: ScanLine,
    desc: "Scans all modules: engine, ABS, airbag, transmission, body.",
    codes: ["U0101 — Lost Communication with TCM", "B0022 — Driver Frontal Stage 1 Deployment Circuit"],
  },
];

const RESULT_SETS: Record<string, string[]> = {
  engine: ["P0300 — Random/Multiple Cylinder Misfire", "P0171 — System Too Lean (Bank 1)"],
  battery: ["12.6V Static • 14.2V Charging — Battery healthy", "Alternator output within spec"],
  brakes: ["C0035 — Left Front Wheel Speed Sensor Circuit", "Brake fluid level OK"],
  full: ["U0101 — Lost Communication with TCM", "B0022 — Driver Frontal Stage 1 Deployment Circuit", "No communication faults in ABS"],
};

export default function DiagnosticToolsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string[]>>({});
  const [cleared, setCleared] = useState<string[]>([]);

  const runScan = (module: ScanModule) => {
    if (running) return;
    setRunning(module.id);
    setTimeout(() => {
      setResults((prev) => ({ ...prev, [module.id]: RESULT_SETS[module.id] }));
      setCleared((prev) => prev.filter((id) => id !== module.id));
      setRunning(null);
      const faultCount = RESULT_SETS[module.id].filter((c) => !c.includes("OK") && !c.includes("within spec")).length;
      toast[faultCount > 0 ? "warning" : "success"](
        `${module.label} complete — ${faultCount > 0 ? `${faultCount} fault(s) found` : "no faults detected"}`,
      );
    }, 1800);
  };

  const clearCodes = (moduleId: string) => {
    setCleared((prev) => [...prev, moduleId]);
    setResults((prev) => ({ ...prev, [moduleId]: ["DTCs cleared — no active faults"] }));
    toast.success("Diagnostic trouble codes cleared");
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Mechanic › Diagnostic Tools</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Diagnostic Tools</h1>
          <p className="pt-1 text-sm text-[#424753]">
            Run simulated scans on workshop vehicles to read and clear diagnostic trouble codes.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isRunning = running === module.id;
            const moduleResults = results[module.id];
            const hasFaults = moduleResults?.some((c) => !c.includes("OK") && !c.includes("within spec") && !c.includes("cleared"));
            const isCleared = cleared.includes(module.id);
            return (
              <div
                key={module.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-lg bg-primary-soft">
                    <Icon className="size-5 text-primary" />
                  </span>
                  {isRunning && <Loader2 className="size-4 animate-spin text-primary" />}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-foreground">{module.label}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{module.desc}</p>
                </div>

                {moduleResults && (
                  <div className="flex flex-col gap-1.5 rounded-lg bg-[#f8f9fa] p-3">
                    {moduleResults.map((code) => (
                      <p
                        key={code}
                        className={cn(
                          "flex items-start gap-1.5 font-mono text-[11px] leading-4",
                          code.includes("OK") || code.includes("within spec") || code.includes("cleared")
                            ? "text-[#4caf50]"
                            : "text-[#ba1a1a]",
                        )}
                      >
                        <Activity className="mt-0.5 size-3 shrink-0" />
                        {code}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => runScan(module)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded bg-primary py-2 text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-50"
                  >
                    <ScanLine className="size-3.5" />
                    {isRunning ? "Scanning..." : "Run Scan"}
                  </button>
                  {hasFaults && !isCleared && (
                    <button
                      type="button"
                      onClick={() => clearCodes(module.id)}
                      className="flex items-center justify-center gap-1.5 rounded border border-border px-3 py-2 text-xs font-semibold text-[#424753]"
                    >
                      <ShieldAlert className="size-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
