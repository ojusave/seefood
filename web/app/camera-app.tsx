"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Footer,
  GridDecoration,
  Navigation,
  RenderLogo,
  Spinner,
} from "render-dds";
import { deployToRenderUrl, githubRepoUrl, renderSignupUrlWithUtms } from "@/lib/render";
import type { ApiEnvelope, ClassifyResult, RuntimeChoice } from "@/lib/types";

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 640;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this photo.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72).split(",")[1] ?? "";
}

export function CameraApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [runtime, setRuntime] = useState<RuntimeChoice>("typescript");
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const github = githubRepoUrl();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setPayload(await compressImage(file));
  }

  async function classify() {
    if (!payload) {
      setError("Take a photo first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: payload, runtime }),
      });
      const json = (await response.json()) as ApiEnvelope<ClassifyResult>;
      if (json.error || !json.data) {
        setResult(null);
        setError(json.error?.message ?? "Classification failed.");
        return;
      }
      setResult(json.data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GridDecoration position="top-right" orientation="top-right" opacity={0.45} />
      <GridDecoration position="bottom-left" orientation="bottom-left" opacity={0.35} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navigation
          sticky
          frosted
          logo={<RenderLogo variant="full" height={28} />}
          links={[
            { label: "GitHub", href: github },
            { label: "Docs", href: "https://render.com/docs/workflows" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <a href={deployToRenderUrl()}>
                <img
                  src="https://render.com/images/deploy-to-render-button.svg"
                  alt="Deploy to Render"
                  height={32}
                />
              </a>
              <a href={renderSignupUrlWithUtms("navbar_button")}>
                <Button type="button" size="sm">
                  Sign up on Render
                </Button>
              </a>
            </div>
          }
        />

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">SeeFood</p>
          <h1 className="mt-4 text-5xl leading-none sm:text-7xl">Hotdog or not hotdog.</h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            Point the camera. A Render Workflow labels the photo, then Jev decides. That is the
            whole product.
          </p>

          <div className="mt-8 flex gap-2">
            <Button
              type="button"
              variant={runtime === "typescript" ? "default" : "outline"}
              onClick={() => setRuntime("typescript")}
            >
              TypeScript
            </Button>
            <Button
              type="button"
              variant={runtime === "python" ? "default" : "outline"}
              onClick={() => setRuntime("python")}
            >
              Python
            </Button>
          </div>

          <div className="mt-10 w-full max-w-md border border-border bg-background">
            <div className="aspect-square overflow-hidden bg-black">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Selected food" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No photo yet
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Button
                type="button"
                className="flex-1"
                onClick={() => inputRef.current?.click()}
              >
                Take photo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!payload || loading}
                onClick={() => void classify()}
              >
                {loading ? "Judging…" : "Is it a hotdog?"}
              </Button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />

          {loading ? (
            <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner /> Running {runtime} workflow
            </div>
          ) : null}

          {error ? (
            <div className="mt-8 w-full max-w-md">
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}

          {result ? (
            <section className="mt-12 w-full">
              <p
                className={
                  result.isHotdog
                    ? "text-6xl text-teal-400 sm:text-8xl"
                    : "text-6xl text-zinc-200 sm:text-8xl"
                }
              >
                {result.isHotdog ? "HOTDOG" : "NOT HOTDOG"}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Jev {Math.round(result.probability * 100)}% · confidence{" "}
                {Math.round(result.confidence * 100)}% · {result.runtime} · {result.model}
              </p>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                What the workflow saw
              </p>
              <ul className="mt-2 flex flex-wrap justify-center gap-2 text-sm">
                {result.labels.map((label) => (
                  <li key={label.label} className="border border-border px-3 py-1">
                    {label.label} {Math.round(label.score * 100)}%
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>

        <Footer
          centered
          copyright="Inspired by the SeeFood bit from Silicon Valley. Classification by Jev on Render Workflows."
          links={[
            { label: "GitHub", href: github },
            { label: "Sign up on Render", href: renderSignupUrlWithUtms("footer_link") },
            { label: "Render docs", href: "https://render.com/docs" },
          ]}
        />
      </div>
    </div>
  );
}
