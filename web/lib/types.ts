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
