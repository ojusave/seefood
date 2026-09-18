import { Render } from "@renderinc/sdk";
import { NextResponse } from "next/server";
import type { ApiEnvelope, ClassifyResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type ClassifyBody = {
  imageBase64?: string;
};

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
  const taskId = process.env.TASK_ID ?? "seefood-ts/seeFood";

  if (!process.env.RENDER_API_KEY) {
    return envelope(null, {
      code: "missing_render_api_key",
      message: "Not food. Try again.",
    }, {}, 500);
  }

  let body: ClassifyBody;
  try {
    body = (await request.json()) as ClassifyBody;
  } catch {
    return envelope(null, { code: "invalid_json", message: "Not food. Try again." }, {}, 400);
  }

  const imageBase64 = body.imageBase64?.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
  if (!imageBase64) {
    return envelope(null, { code: "missing_image", message: "Not food. Try again." }, {}, 400);
  }
  if (imageBase64.length > 3_500_000) {
    return envelope(null, { code: "image_too_large", message: "Not food. Try again." }, {}, 400);
  }

  try {
    const render = new Render();
    const finished = await render.workflows.runTask(taskId, [imageBase64]);
    const status = String(finished.status ?? "").toLowerCase();
    if (status !== "succeeded" && status !== "completed") {
      return envelope(null, {
        code: "task_failed",
        message: "Not food. Try again.",
      }, { taskId, taskRunId: finished.id }, 502);
    }

    const data = readResult(finished as unknown as Record<string, unknown>);
    return envelope(data, null, {
      taskId,
      taskRunId: finished.id,
    });
  } catch {
    return envelope(null, { code: "workflow_error", message: "Not food. Try again." }, { taskId }, 502);
  }
}
