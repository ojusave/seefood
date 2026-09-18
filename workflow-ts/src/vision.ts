import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ort from "onnxruntime-node";
import sharp from "sharp";

export type ImageLabel = { label: string; score: number };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL_PATH = join(ROOT, "models", "squeezenet1.1-7.onnx");
const LABELS_PATH = join(ROOT, "imagenet-classes.txt");

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let sessionPromise: Promise<ort.InferenceSession> | undefined;
let labelsPromise: Promise<string[]> | undefined;

function loadSession(): Promise<ort.InferenceSession> {
  sessionPromise ??= ort.InferenceSession.create(MODEL_PATH);
  return sessionPromise;
}

function loadLabels(): Promise<string[]> {
  labelsPromise ??= readFile(LABELS_PATH, "utf8").then((text) => text.split("\n").filter(Boolean));
  return labelsPromise;
}

async function preprocess(imageBase64: string): Promise<ort.Tensor> {
  const buffer = Buffer.from(imageBase64, "base64");
  const { data } = await sharp(buffer)
    .rotate()
    .removeAlpha()
    .resize(224, 224, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const float = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i += 1) {
    const r = data[i * 3] / 255;
    const g = data[i * 3 + 1] / 255;
    const b = data[i * 3 + 2] / 255;
    float[i] = (r - MEAN[0]) / STD[0];
    float[224 * 224 + i] = (g - MEAN[1]) / STD[1];
    float[2 * 224 * 224 + i] = (b - MEAN[2]) / STD[2];
  }
  return new ort.Tensor("float32", float, [1, 3, 224, 224]);
}

/** Return the top ImageNet labels for a base64 JPEG/PNG. */
export async function labelImage(imageBase64: string, topK = 5): Promise<ImageLabel[]> {
  const [session, labels] = await Promise.all([loadSession(), loadLabels()]);
  const inputName = session.inputNames[0];
  const tensor = await preprocess(imageBase64);
  const result = await session.run({ [inputName]: tensor });
  const output = result[session.outputNames[0]];
  const logits = output.data as Float32Array;
  const max = Math.max(...logits);
  const exp = Array.from(logits, (value) => Math.exp(value - max));
  const sum = exp.reduce((acc, value) => acc + value, 0);
  const ranked = exp
    .map((value, index) => ({ index, score: value / sum }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return ranked.map(({ index, score }) => ({
    label: labels[index] ?? String(index),
    score,
  }));
}
