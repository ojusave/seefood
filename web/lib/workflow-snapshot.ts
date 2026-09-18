import type { WorkflowSnapshot, WorkflowStep, WorkflowStepStatus } from "@/lib/types";

export const PIPELINE = ["seeFood", "labelPhoto", "judgeHotdog"] as const;

const SCORE: Record<WorkflowStepStatus, number> = {
  queued: 0,
  pending: 0.25,
  running: 0.6,
  succeeded: 1,
  failed: 1,
};

export type NamedRun = {
  id: string;
  name: string;
  status: string;
  startedAt?: string;
};

/** Map a Render task-run status onto the UI step states. */
export function normalizeStatus(status: string): WorkflowStepStatus {
  const value = status.toLowerCase();
  if (value === "running") return "running";
  if (value === "pending" || value === "paused") return "pending";
  if (value === "succeeded" || value === "completed") return "succeeded";
  if (value === "failed" || value === "canceled" || value === "cancelled") {
    return "failed";
  }
  return "queued";
}

/** Build a progress snapshot from the live Render task-run tree. */
export function snapshotFromRuns(
  taskId: string,
  rootTaskRunId: string,
  runs: NamedRun[],
): WorkflowSnapshot {
  const byName = new Map(runs.map((run) => [run.name, run]));
  const extras = runs
    .map((run) => run.name)
    .filter((name) => !PIPELINE.includes(name as (typeof PIPELINE)[number]));
  const names = [...PIPELINE, ...extras.filter((name, index, all) => all.indexOf(name) === index)];

  const steps: WorkflowStep[] = names.map((name) => {
    const run = byName.get(name);
    return {
      name,
      status: run ? normalizeStatus(run.status) : "queued",
      taskRunId: run?.id,
      startedAt: run?.startedAt,
    };
  });

  const raw = steps.reduce((sum, step) => sum + SCORE[step.status], 0) / steps.length;
  const allDone = steps.every((step) => step.status === "succeeded" || step.status === "failed");
  const percent = allDone ? 100 : Math.max(8, Math.round(raw * 100));
  const failed = steps.find((step) => step.status === "failed");

  let label = "Queued on Render";
  if (failed) {
    label = `${failed.name} ${failed.status}`;
  } else {
    for (const step of steps) {
      if (step.status === "running" || step.status === "pending") {
        label = `${step.name} ${step.status}`;
      } else if (step.status === "succeeded" && !allDone) {
        label = `${step.name} succeeded`;
      }
    }
  }

  return { taskId, taskRunId: rootTaskRunId, percent, label, steps };
}
