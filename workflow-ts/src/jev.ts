import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type { ImageLabel } from "./vision.js";

export type HotdogResult = {
  verdict: "hotdog" | "not_hotdog";
  isHotdog: boolean;
  probability: number;
  confidence: number;
  probabilities: Record<string, number>;
  model: string;
  labels: ImageLabel[];
  runtime: "typescript";
};

/** Classify ImageNet labels with Jev and return a JSON-serializable verdict. */
export async function judgeLabels(labels: ImageLabel[]): Promise<HotdogResult> {
  if (!process.env.TYPESAFE_API_KEY) {
    throw new Error("TYPESAFE_API_KEY is not set");
  }

  const client = new TypeSafeClient();
  const response = await client.systemOne({
    state: {
      task: "Decide if a photo is a hotdog.",
      image_labels: labels,
      rule: "A hotdog is a sausage in a split bun. Similar foods (burger, taco, sandwich, pretzel) are not a hotdog.",
    },
    questions: {
      verdict: choice("Is the photographed object a hotdog?", {
        hotdog: "A hot dog: sausage in a bun, corn dog, or clearly a hotdog.",
        not_hotdog: "Anything else, including other food, people, animals, or objects.",
      }),
      is_hotdog: noul("The photo shows a hotdog (sausage in a bun)."),
    },
  });

  const verdictChoice = response.answers.verdict.choice;
  const probability = response.answers.is_hotdog.noul;
  const isHotdog = verdictChoice === "hotdog" && probability >= 0.45;

  return {
    verdict: isHotdog ? "hotdog" : "not_hotdog",
    isHotdog,
    probability,
    confidence: response.answers.verdict.confidence,
    probabilities: response.answers.verdict.probabilities,
    model: response.model,
    labels,
    runtime: "typescript",
  };
}
