"""Turn a JPEG into ImageNet top labels with a local ONNX classifier."""

from __future__ import annotations

import base64
import io
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).parent
MODEL_PATH = ROOT / "models" / "squeezenet1.1-7.onnx"
LABELS_PATH = ROOT / "imagenet_classes.txt"

_session: ort.InferenceSession | None = None
_labels: list[str] | None = None
_input_name: str | None = None

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def _load() -> tuple[ort.InferenceSession, str, list[str]]:
    global _session, _labels, _input_name
    if _session is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"missing classifier at {MODEL_PATH}; run python fetch_model.py"
            )
        _session = ort.InferenceSession(
            str(MODEL_PATH), providers=["CPUExecutionProvider"]
        )
        _input_name = _session.get_inputs()[0].name
    if _labels is None:
        _labels = LABELS_PATH.read_text(encoding="utf-8").splitlines()
    assert _input_name is not None
    return _session, _input_name, _labels


def _preprocess(image_base64: str) -> np.ndarray:
    raw = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(raw)).convert("RGB").resize((224, 224))
    array = np.asarray(image).astype(np.float32) / 255.0
    array = (array - IMAGENET_MEAN) / IMAGENET_STD
    return np.transpose(array, (2, 0, 1))[None, ...]


def label_image(image_base64: str, top_k: int = 5) -> list[dict[str, float | str]]:
    """Return the top ImageNet labels for a base64 JPEG/PNG."""
    session, input_name, labels = _load()
    tensor = _preprocess(image_base64)
    logits = session.run(None, {input_name: tensor})[0][0]
    logits = logits.astype(np.float64)
    logits = logits - logits.max()
    exp = np.exp(logits)
    probs = exp / exp.sum()
    order = np.argsort(probs)[::-1][:top_k]
    return [
        {"label": labels[int(i)] if int(i) < len(labels) else str(int(i)), "score": float(probs[int(i)])}
        for i in order
    ]
