export type RuntimeChoice = "typescript" | "python";

export type ImageLabel = {
  label: string;
  score: number;
};

export type ClassifyResult = {
  verdict: "hotdog" | "not_hotdog";
  isHotdog: boolean;
  probability: number;
  confidence: number;
  probabilities: Record<string, number>;
  model: string;
  labels: ImageLabel[];
  runtime: RuntimeChoice;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown>;
};

export type WorkflowStepStatus = "queued" | "running" | "succeeded" | "failed";

export type WorkflowStep = {
  name: string;
  status: WorkflowStepStatus;
  taskRunId?: string;
};

export type WorkflowSnapshot = {
  taskRunId: string;
  percent: number;
  label: string;
  steps: WorkflowStep[];
};

export type ClassifyProgressEvent = {
  type: "progress";
  data: null;
  error: null;
  meta: WorkflowSnapshot & { taskId: string };
};

export type ClassifyResultEvent = {
  type: "result";
  data: ClassifyResult;
  error: null;
  meta: { taskId: string; taskRunId: string };
};

export type ClassifyErrorEvent = {
  type: "error";
  data: null;
  error: { code: string; message: string };
  meta: Record<string, unknown>;
};

export type ClassifyEvent =
  | ClassifyProgressEvent
  | ClassifyResultEvent
  | ClassifyErrorEvent;
