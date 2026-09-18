import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODEL_URL =
  "https://github.com/onnx/models/raw/main/validated/vision/classification/squeezenet/model/squeezenet1.1-7.onnx";

const root = dirname(fileURLToPath(import.meta.url));
const modelPath = join(root, "models", "squeezenet1.1-7.onnx");

await mkdir(dirname(modelPath), { recursive: true });

try {
  const existing = await stat(modelPath);
  if (existing.size > 1_000_000) {
    console.log(`model already present: ${modelPath}`);
    process.exit(0);
  }
} catch {
  // download below
}

console.log(`downloading ${MODEL_URL}`);
const response = await fetch(MODEL_URL, { redirect: "follow" });
if (!response.ok) {
  throw new Error(`download failed: ${response.status} ${response.statusText}`);
}
const bytes = Buffer.from(await response.arrayBuffer());
await writeFile(modelPath, bytes);
console.log(`saved ${modelPath} (${bytes.length} bytes)`);
