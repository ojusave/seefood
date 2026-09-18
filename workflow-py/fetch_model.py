"""Download a compact ImageNet ONNX classifier used at task runtime."""

from __future__ import annotations

from pathlib import Path
from urllib.request import urlretrieve

MODEL_URL = (
    "https://github.com/onnx/models/raw/main/validated/vision/classification/"
    "squeezenet/model/squeezenet1.1-7.onnx"
)
MODEL_PATH = Path(__file__).parent / "models" / "squeezenet1.1-7.onnx"


def main() -> None:
    """Fetch the ONNX weights if they are not already on disk."""
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 1_000_000:
        print(f"model already present: {MODEL_PATH}")
        return
    print(f"downloading {MODEL_URL}")
    urlretrieve(MODEL_URL, MODEL_PATH)
    print(f"saved {MODEL_PATH} ({MODEL_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
