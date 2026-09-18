"use client";

import { ProgressBar } from "render-dds";
import type { WorkflowSnapshot, WorkflowStepStatus } from "@/lib/types";

const MARK: Record<WorkflowStepStatus, string> = {
  queued: "",
  running: "▸",
  succeeded: "✓",
  failed: "✕",
};

/** Compact live workflow HUD for the SeeFood photo. */
export function WorkflowProgress({ snapshot }: { snapshot: WorkflowSnapshot }) {
  const failed = snapshot.steps.some((step) => step.status === "failed");

  return (
    <div className="pointer-events-none w-full text-left">
      <ProgressBar
        value={snapshot.percent}
        label={snapshot.label}
        size="sm"
        color={failed ? "error" : "primary"}
      />
      <ol className="mt-3 flex items-start justify-between gap-2 text-[11px] uppercase tracking-widest text-white/45">
        {snapshot.steps.map((step) => (
          <li
            key={step.name}
            className={
              step.status === "running"
                ? "text-white"
                : step.status === "succeeded"
                  ? "text-white/80"
                  : step.status === "failed"
                    ? "text-red-400"
                    : ""
            }
          >
            {MARK[step.status] ? `${MARK[step.status]} ` : ""}
            {step.name}
          </li>
        ))}
      </ol>
    </div>
  );
}
