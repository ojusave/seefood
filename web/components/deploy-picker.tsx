"use client";

import { useState } from "react";
import { Button } from "render-dds";
import {
  deployButtonSrc,
  deployPythonUrl,
  deployTypescriptUrl,
} from "@/lib/render";

export function DeployPicker() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="block">
        <img src={deployButtonSrc()} alt="Deploy to Render" height={32} />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 border border-border bg-background p-3 shadow-lg">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">SeeFood</p>
          <a href={deployTypescriptUrl()} className="mb-2 block" onClick={() => setOpen(false)}>
            <Button type="button" className="w-full">
              TypeScript
            </Button>
          </a>
          <a href={deployPythonUrl()} className="block" onClick={() => setOpen(false)}>
            <Button type="button" variant="outline" className="w-full">
              Python
            </Button>
          </a>
        </div>
      ) : null}
    </div>
  );
}
