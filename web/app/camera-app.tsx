"use client";

import { useRef, useState } from "react";
import { Alert, Button, Footer, Navigation, RenderLogo, Spinner } from "render-dds";
import { deployToRenderUrl, githubRepoUrl, renderSignupUrlWithUtms } from "@/lib/render";
import type { ApiEnvelope, ClassifyResult } from "@/lib/types";

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

export function CameraApp() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const github = githubRepoUrl();

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const imageBase64 = await compressImage(file);
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const json = (await response.json()) as ApiEnvelope<ClassifyResult>;
      if (json.error || !json.data) {
        setError("Not food. Try again.");
        return;
      }
      setResult(json.data);
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

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Spinner variant="white" size="lg" />
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

      <Footer
        centered
        copyright="SeeFood"
        links={[
          { label: "GitHub", href: github },
          { label: "Sign up on Render", href: renderSignupUrlWithUtms("footer_link") },
        ]}
      />
    </div>
  );
}
