"use client";

import { useRef, useState } from "react";
import { Alert, Button, Link, Navigation, RenderLogo } from "render-dds";
import {
  githubRepoUrl,
  renderSignupUrlWithUtms,
  renderWorkflowsUrl,
  typeSafeJevUrl,
} from "@/lib/render";
import { classifyStream } from "@/lib/classify-stream";
import { DeployPicker } from "@/components/deploy-picker";
import { WorkflowProgress } from "@/components/workflow-progress";
import type { ClassifyResult, WorkflowSnapshot } from "@/lib/types";

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 640;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("blurry hotdog");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72).split(",")[1] ?? "";
}

const EMPTY_PROGRESS: WorkflowSnapshot = {
  taskRunId: "",
  percent: 5,
  label: "Queued on Render",
  steps: [
    { name: "seeFood", status: "queued" },
    { name: "labelPhoto", status: "queued" },
    { name: "judgeHotdog", status: "queued" },
  ],
};

export function CameraApp() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<WorkflowSnapshot>(EMPTY_PROGRESS);
  const github = githubRepoUrl();

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
    setProgress(EMPTY_PROGRESS);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setProgress(EMPTY_PROGRESS);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const imageBase64 = await compressImage(file);
      for await (const event of classifyStream(imageBase64)) {
        if (event.type === "progress") {
          setProgress(event.meta);
        } else if (event.type === "result" && event.data) {
          setResult(event.data);
        } else if (event.type === "error") {
          setError("Not food. Try again.");
        }
      }
    } catch {
      setError("Not food. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation
        logo={<RenderLogo variant="full" height={28} />}
        links={[{ label: "GitHub", href: github }]}
        actions={
          <div className="flex items-center gap-2">
            <DeployPicker />
            <a href={renderSignupUrlWithUtms("navbar_button")}>
              <Button type="button" size="sm">
                Sign up on Render
              </Button>
            </a>
          </div>
        }
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10">
        <h1 className="text-4xl tracking-tight">SeeFood</h1>

        <button
          type="button"
          className="relative mt-8 aspect-square w-full overflow-hidden border border-border bg-black"
          onClick={result || error ? reset : undefined}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-8xl">🌭</span>
          )}

          {loading && !result ? (
            <div className="absolute inset-0 flex flex-col justify-end bg-black/55 p-4">
              <WorkflowProgress snapshot={progress} />
            </div>
          ) : null}

          {result ? (
            <div
              className={
                result.isHotdog
                  ? "absolute inset-0 flex flex-col items-center justify-center bg-emerald-600/90"
                  : "absolute inset-0 flex flex-col items-center justify-center bg-red-600/90"
              }
            >
              <p className="text-8xl leading-none">{result.isHotdog ? "✓" : "✕"}</p>
              <p className="mt-4 text-4xl font-medium tracking-wide">
                {result.isHotdog ? "HOTDOG" : "NOT HOTDOG"}
              </p>
            </div>
          ) : null}
        </button>

        {!result && !loading ? (
          <div className="mt-6 flex w-full gap-2">
            <Button type="button" className="flex-1" onClick={() => cameraRef.current?.click()}>
              Camera
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => uploadRef.current?.click()}
            >
              Upload
            </Button>
          </div>
        ) : null}

        {result ? (
          <Button type="button" className="mt-6" onClick={reset}>
            Again
          </Button>
        ) : null}

        {error ? (
          <div className="mt-6 w-full">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </main>

      <footer className="border-t border-border bg-background px-6 py-8">
        <p className="text-center text-sm text-muted-foreground">
          Built with{" "}
          <Link href={renderWorkflowsUrl()} variant="muted" underline="hover" external>
            Render Workflows
          </Link>{" "}
          and{" "}
          <Link href={typeSafeJevUrl()} variant="muted" underline="hover" external>
            TypeSafe Jev
          </Link>
        </p>
      </footer>
    </div>
  );
}
