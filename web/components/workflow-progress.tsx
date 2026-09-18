"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
} from "render-dds";
import type { WorkflowSnapshot, WorkflowStepStatus } from "@/lib/types";

const BADGE: Record<WorkflowStepStatus, "default" | "yellow" | "green" | "red" | "purple"> = {
  queued: "default",
  pending: "purple",
  running: "yellow",
  succeeded: "green",
  failed: "red",
};

const DOT: Record<WorkflowStepStatus, string> = {
  queued: "border-border bg-background",
  pending: "border-primary bg-primary/30",
  running: "border-yellow-500 bg-yellow-500 animate-pulse",
  succeeded: "border-green-600 bg-green-600",
  failed: "border-red-500 bg-red-500",
};

/** Live Render Workflows tree for the current SeeFood run. */
export function WorkflowProgress({ snapshot }: { snapshot: WorkflowSnapshot }) {
  const failed = snapshot.steps.some((step) => step.status === "failed");
  const live = snapshot.steps.some(
    (step) => step.status === "running" || step.status === "pending",
  );

  return (
    <Card className="w-full text-left">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Render Workflows</CardTitle>
          <Badge variant={live ? "purple" : failed ? "red" : "green"} size="sm">
            {live ? "Live" : failed ? "Failed" : "Done"}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs break-all">
          {snapshot.taskId}
          {snapshot.taskRunId ? ` · ${snapshot.taskRunId}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar
          value={snapshot.percent}
          label={snapshot.label}
          size="sm"
          color={failed ? "error" : "primary"}
        />
        <ol>
          {snapshot.steps.map((step, index) => (
            <li key={step.name} className="relative flex gap-3 pb-4 last:pb-0">
              {index < snapshot.steps.length - 1 ? (
                <span className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-border" />
              ) : null}
              <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${DOT[step.status]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-foreground">{step.name}</span>
                  <Badge variant={BADGE[step.status]} size="sm">
                    {step.status}
                  </Badge>
                </div>
                {step.taskRunId ? (
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {step.taskRunId}
                  </p>
                ) : (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">waiting for run</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
