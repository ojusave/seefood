import { Render } from "@renderinc/sdk";
import { NextResponse } from "next/server";
import type { ApiEnvelope, ClassifyResult, RuntimeChoice } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type ClassifyBody = {
  imageBase64?: string;
  runtime?: RuntimeChoice;
};

function taskIdFor(runtime: RuntimeChoice): string {
  if (runtime === "python") {
    return process.env.PY_TASK_ID ?? "not-hotdog-py/seeFood";
  }
  return process.env.TS_TASK_ID ?? "not-hotdog-ts/seeFood";
}

function envelope<T>(
  data: T | null,
  error: ApiEnvelope<T>["error"],
  meta: Record<string, unknown> = {},
  status = 200,
) {
  return NextResponse.json({ data, error, meta } satisfies ApiEnvelope<T>, { status });
}

function readResult(run: Record<string, unknown>): ClassifyResult {
  const results = run.results ?? run.result;
  const payload = Array.isArray(results) ? results[0] : results;
  if (!payload || typeof payload !== "object") {
    throw new Error("workflow returned an empty result");
  }
  return payload as ClassifyResult;
}

export async function POST(request: Request) {
  if (!process.env.RENDER_API_KEY) {
    return envelope(null, {
      code: "missing_render_api_key",
      message: "RENDER_API_KEY is not set on the web service.",
    }, {}, 500);
  }

  let body: ClassifyBody;
  try {
    body = (await request.json()) as ClassifyBody;
  } catch {
    return envelope(null, { code: "invalid_json", message: "Body must be JSON." }, {}, 400);
  }

  const imageBase64 = body.imageBase64?.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  if (!imageBase64) {
    return envelope(null, { code: "missing_image", message: "Take or upload a photo first." }, {}, 400);
  }
  if (imageBase64.length > 3_500_000) {
    return envelope(null, { code: "image_too_large", message: "Photo is too large. Try a closer, smaller shot." }, {}, 400);
  }

  const runtime: RuntimeChoice = body.runtime === "python" ? "python" : "typescript";
  const taskId = taskIdFor(runtime);

  try {
    const render = new Render();
    const finished = await render.workflows.runTask(taskId, [imageBase64]);
    const status = String(finished.status ?? "").toLowerCase();
    if (status !== "succeeded" && status !== "completed") {
      return envelope(null, {
        code: "task_failed",
        message: `Workflow run ${status}. Check the ${runtime} workflow logs.`,
      }, { taskId, taskRunId: finished.id }, 502);
    }

    const data = readResult(finished as unknown as Record<string, unknown>);
    return envelope(data, null, {
      taskId,
      taskRunId: finished.id,
      workflow: runtime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow run failed.";
    return envelope(null, { code: "workflow_error", message }, { taskId }, 502);
  }
}
