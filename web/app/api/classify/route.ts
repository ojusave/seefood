import { Render } from "@renderinc/sdk";
import type { ClassifyEvent, ClassifyResult } from "@/lib/types";
import { snapshotFromRuns } from "@/lib/workflow-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type ClassifyBody = { imageBase64?: string };
type NamedRun = { id: string; name: string; status: string; startedAt?: string };

const taskNameCache = new Map<string, string>();
const encoder = new TextEncoder();

function send(controller: ReadableStreamDefaultController, event: ClassifyEvent) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

function fail(code: string, meta: Record<string, unknown> = {}): ClassifyEvent {
  return {
    type: "error",
    data: null,
    error: { code, message: "Not food. Try again." },
    meta,
  };
}

function readResult(run: Record<string, unknown>): ClassifyResult {
  const results = run.results ?? run.result;
  const payload = Array.isArray(results) ? results[0] : results;
  if (!payload || typeof payload !== "object") {
    throw new Error("empty");
  }
  return payload as ClassifyResult;
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function taskName(taskId: string, signal: AbortSignal): Promise<string> {
  const cached = taskNameCache.get(taskId);
  if (cached) return cached;
  const token = process.env.RENDER_API_KEY;
  if (!token) return taskId;
  const response = await fetch(`https://api.render.com/v1/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal,
  });
  if (!response.ok) return taskId;
  const json = (await response.json()) as { name?: string };
  const name = json.name ?? taskId;
  taskNameCache.set(taskId, name);
  return name;
}

async function namedRuns(
  render: Render,
  rootTaskRunId: string,
  signal: AbortSignal,
): Promise<NamedRun[]> {
  const listed = await render.workflows.listTaskRuns({
    rootTaskRunId: [rootTaskRunId],
    limit: 20,
  });
  return Promise.all(
    listed.map(async (item) => {
      const run = "taskRun" in item ? item.taskRun : item;
      return {
        id: run.id,
        name: await taskName(run.taskId, signal),
        status: String(run.status ?? ""),
        startedAt: run.startedAt,
      };
    }),
  );
}

export async function POST(request: Request) {
  const taskId = process.env.TASK_ID ?? "seefood-ts/seeFood";
  const stream = new ReadableStream({
    async start(controller) {
      const signal = request.signal;
      try {
        if (!process.env.RENDER_API_KEY) {
          send(controller, fail("missing_render_api_key"));
          return;
        }

        let body: ClassifyBody;
        try {
          body = (await request.json()) as ClassifyBody;
        } catch {
          send(controller, fail("invalid_json"));
          return;
        }

        const imageBase64 = body.imageBase64?.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
        if (!imageBase64) {
          send(controller, fail("missing_image"));
          return;
        }
        if (imageBase64.length > 3_500_000) {
          send(controller, fail("image_too_large"));
          return;
        }

        const render = new Render();
        const started = await render.workflows.startTask(taskId, [imageBase64], signal);
        const rootId = started.taskRunId;
        send(controller, {
          type: "progress",
          data: null,
          error: null,
          meta: snapshotFromRuns(taskId, rootId, [{ id: rootId, name: "seeFood", status: "pending" }]),
        });

        while (!signal.aborted) {
          const runs = await namedRuns(render, rootId, signal);
          const snapshot = snapshotFromRuns(
            taskId,
            rootId,
            runs.length > 0 ? runs : [{ id: rootId, name: "seeFood", status: "running" }],
          );
          send(controller, {
            type: "progress",
            data: null,
            error: null,
            meta: snapshot,
          });

          const root = runs.find((run) => run.id === rootId);
          const status = normalizeRoot(root?.status ?? snapshot.steps[0]?.status ?? "running");
          if (status === "failed") {
            send(controller, fail("task_failed", { taskId, taskRunId: rootId }));
            return;
          }
          if (status === "succeeded") {
            const finished = await render.workflows.getTaskRun(rootId);
            send(controller, {
              type: "result",
              data: readResult(finished as unknown as Record<string, unknown>),
              error: null,
              meta: { taskId, taskRunId: rootId },
            });
            return;
          }
          await sleep(400, signal);
        }
      } catch {
        if (!request.signal.aborted) {
          send(controller, fail("workflow_error", { taskId }));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function normalizeRoot(status: string): "running" | "succeeded" | "failed" {
  const value = status.toLowerCase();
  if (value === "succeeded" || value === "completed") return "succeeded";
  if (value === "failed" || value === "canceled" || value === "cancelled") return "failed";
  return "running";
}
