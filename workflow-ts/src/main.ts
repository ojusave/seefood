import { task, type TaskContext } from "@renderinc/sdk/workflows";
import { judgeLabels } from "./jev.js";
import { labelImage, type ImageLabel } from "./vision.js";

const labelPhoto = task(
  { name: "labelPhoto", timeoutSeconds: 120, plan: "flex" },
  async function labelPhoto(_ctx: TaskContext, imageBase64: string): Promise<ImageLabel[]> {
    return labelImage(imageBase64);
  },
);

const judgeHotdog = task(
  {
    name: "judgeHotdog",
    timeoutSeconds: 60,
    plan: "flex",
    retry: { maxRetries: 2, waitDurationMs: 1000, backoffScaling: 2 },
  },
  async function judgeHotdog(_ctx: TaskContext, labels: ImageLabel[]) {
    return judgeLabels(labels);
  },
);

task(
  { name: "seeFood", timeoutSeconds: 180, plan: "flex" },
  async function seeFood(ctx: TaskContext, imageBase64: string) {
    const labels = await ctx.run(labelPhoto, imageBase64);
    return ctx.run(judgeHotdog, labels);
  },
);
