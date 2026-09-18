"""Ask Jev whether ImageNet labels describe a hotdog."""

from __future__ import annotations

import os

from typesafe_sdk import Choice, Noul, TypeSafeClient

HOTDOG_CRITERIA = {
    "hotdog": "A hot dog: sausage in a bun, corn dog, or clearly a hotdog.",
    "not_hotdog": "Anything else, including other food, people, animals, or objects.",
}


def judge_labels(labels: list[dict]) -> dict:
    """Classify labels with Jev and return a JSON-serializable verdict."""
    api_key = os.environ.get("TYPESAFE_API_KEY")
    if not api_key:
        raise RuntimeError("TYPESAFE_API_KEY is not set")

    state = {
        "task": "Decide if a photo is a hotdog.",
        "image_labels": labels,
        "rule": "A hotdog is a sausage in a split bun. Similar foods (burger, taco, sandwich, pretzel) are not a hotdog.",
    }

    with TypeSafeClient() as client:
        response = client.system_one(
            state=state,
            questions={
                "verdict": Choice(
                    instructions="Is the photographed object a hotdog?",
                    criteria=HOTDOG_CRITERIA,
                ),
                "is_hotdog": Noul(
                    instructions="The photo shows a hotdog (sausage in a bun)."
                ),
            },
        )

    choice = response.choices["verdict"]
    noul = response.nouls["is_hotdog"]
    verdict = choice.choice
    probability = float(noul.noul)
    is_hotdog = verdict == "hotdog" and probability >= 0.45

    return {
        "verdict": "hotdog" if is_hotdog else "not_hotdog",
        "isHotdog": is_hotdog,
        "probability": probability,
        "confidence": float(choice.confidence),
        "probabilities": {k: float(v) for k, v in choice.probabilities.items()},
        "model": response.model,
        "labels": labels,
        "runtime": "python",
    }
