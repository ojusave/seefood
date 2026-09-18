# SeeFood

Take a photo. **Render Workflows** labels it, then **TypeSafe Jev** says HOTDOG or NOT HOTDOG.

<a href="https://render.com/docs/workflows?utm_source=github&utm_medium=referral&utm_campaign=ojus_demos&utm_content=readme_workflows" target="_blank" rel="noopener noreferrer"><img alt="Render Workflows" src="https://img.shields.io/badge/Render-Workflows-6D3BC6?logo=render&logoColor=white" /></a>
<a href="https://typesafe.ai/blog/introducing-system-one-models-and-jev" target="_blank" rel="noopener noreferrer"><img alt="TypeSafe Jev" src="https://img.shields.io/badge/TypeSafe-Jev-252525" /></a>

| Example | Code and deploy | Try |
| --- | --- | --- |
| TypeScript | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ojusave/seefood) | <a href="https://seefood-6wov.onrender.com" target="_blank" rel="noopener noreferrer">Live app</a> |
| Python | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ojusave/seefood/tree/python) | Same UI, Python workflow |

Each example deploys its own web service and workflow. They share the SeeFood UI.

![SeeFood](docs/images/hero.png)

## How it works

Jev is text-only. It never sees the photo.

1. The web app sends the image to the `seeFood` workflow.
2. **`labelPhoto`** runs a local ImageNet SqueezeNet ONNX model on the workflow instance and returns top labels (`hotdog`, `bagel`, …).
3. **`judgeHotdog`** sends those labels to Jev. Jev returns `hotdog` or `not_hotdog`.
4. The UI shows **HOTDOG** or **NOT HOTDOG**, plus the live Render task tree.

![Workflow](docs/images/flow.png)

| HOTDOG | NOT HOTDOG |
| --- | --- |
| ![HOTDOG](docs/images/hotdog.png) | ![NOT HOTDOG](docs/images/not-hotdog.png) |

## Deploy

The Blueprint creates a web service and a workflow. Enter a **Render API key** on the web service and a **TypeSafe API key** on the workflow when prompted.

- TypeScript: `render.yaml` on `main` (`web` + `workflow-ts`)
- Python: `render.yaml` on the `python` branch (`web` + `workflow-py`)

## Related

<a href="https://github.com/ojusave/beat-jev" target="_blank" rel="noopener noreferrer">Beat Jev</a> · <a href="https://github.com/ojusave/route-lab" target="_blank" rel="noopener noreferrer">Route Lab</a>
