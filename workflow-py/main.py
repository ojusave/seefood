"""SeeFood workflow: label a photo, then ask Jev if it is a hotdog."""

from __future__ import annotations

from render import Retry, TaskContext, Workflows

from jev import judge_labels
from vision import label_image

app = Workflows()


@app.task(name="labelPhoto", timeout_seconds=120, plan="flex")
def label_photo(_ctx: TaskContext, image_base64: str) -> list[dict]:
    """Return top ImageNet labels for a photo."""
    return label_image(image_base64)


@app.task(
    name="judgeHotdog",
    timeout_seconds=60,
    plan="flex",
    retry=Retry(max_retries=2, wait_duration_ms=1000, backoff_scaling=2.0),
)
def judge_hotdog(_ctx: TaskContext, labels: list[dict]) -> dict:
    """Ask Jev whether the labels describe a hotdog."""
    return judge_labels(labels)


@app.task(name="seeFood", timeout_seconds=180, plan="flex")
async def see_food(ctx: TaskContext, image_base64: str) -> dict:
    """Label a photo, then judge hotdog vs not hotdog with Jev."""
    labels = await ctx.run(label_photo, image_base64)
    return await ctx.run(judge_hotdog, labels)


if __name__ == "__main__":
    app.start()
