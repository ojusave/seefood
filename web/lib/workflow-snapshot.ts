import type { WorkflowSnapshot, WorkflowStep, WorkflowStepStatus } from "@/lib/types";

export const PIPELINE = ["seeFood", "labelPhoto", "judgeHotdog"] as const;

const SCORE: Record<WorkflowStepStatus, number> = {
  queued: 0,
  running: 0.55,
  succeeded: 1,
  failed: 1,
};

type NamedRun = {
  id: string;
  name: string;
  status: string;
};

/** Map a Render task-run status onto the UI step states. */
export function normalizeStatus(status: string): WorkflowStepStatus {
  const value = status.toLowerCase();
  if (value === "running") return "running";
  if (value === "succeeded" || value === "completed") return "succeeded";
  if (value === "failed" || value === "canceled" || value === "cancelled") {
    return "failed";
  }
  return "queued";
}

/** Build a progress snapshot from the live Render task-run tree. */
export function snapshotFromRuns(rootTaskRunId: string, runs: NamedRun[]): WorkflowSnapshot {
  const byName = new Map(runs.map((run) => [run.name, run]));
  const extras = runs
    .map((run) => run.name)
    .filter((name) => !PIPELINE.includes(name as (typeof PIPELINE)[number]));
  const names = [...PIPELINE, ...extras.filter((name, index, all) => all.indexOf(name) === index)];

  const childActive = runs.some(
    (run) => run.name !== "seeFood" && normalizeStatus(run.status) !== "queued",
  );
  const steps: WorkflowStep[] = names.map((name) => {
    const run = byName.get(name);
    let status: WorkflowStep["status"] = run ? normalizeStatus(run.status) : "queued";
    if (name === "seeFood" && status === "queued" && childActive) {
      status = "running";
    }
    return {
      name,
      status,
      taskRunId: run?.id,
    };
  });

  const raw = steps.reduce((sum, step) => sum + SCORE[step.status], 0) / steps.length;
  const allDone = steps.every((step) => step.status === "succeeded" || step.status === "failed");
  const percent = allDone ? 100 : Math.max(8, Math.round(raw * 100));
  const running = steps.find((step) => step.status === "running");
  const failed = steps.find((step) => step.status === "failed");
  const lastDone = [...steps].reverse().find((step) => step.status === "succeeded");

  let label = "Queued on Render";
  if (failed) label = `${failed.name} failed`;
  else if (running) label = `${running.name} running`;
  else if (lastDone) label = `${lastDone.name} done`;

  return { taskRunId: rootTaskRunId, percent, label, steps };
}
