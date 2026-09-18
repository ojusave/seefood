# SeeFood

Take a photo. A [Render Workflow](https://render.com/docs/workflows) labels it, then [Jev](https://docs.typesafe.ai/introduction) says **HOTDOG** or **NOT HOTDOG**.

Inspired by the SeeFood app from *Silicon Valley*.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ojusave/not-hotdog)

![SeeFood camera UI](docs/images/hero.png)

| HOTDOG | NOT HOTDOG |
| --- | --- |
| ![HOTDOG verdict](docs/images/hotdog.png) | ![NOT HOTDOG verdict](docs/images/not-hotdog.png) |

![Photo to workflow to Jev](docs/images/flow.png)

## What it is

1. The web app captures a photo.
2. It starts the `seeFood` task on a Render Workflow (TypeScript or Python).
3. `labelPhoto` runs a small ImageNet classifier.
4. `judgeHotdog` sends those labels to Jev (`Choice` + `Noul`).
5. The UI shows the verdict.

No database. No queue you operate. Render Workflows is the job runner.

## Repo layout

| Path | Role |
|---|---|
| `web/` | Next.js UI + API that triggers task runs |
| `workflow-ts/` | TypeScript workflow |
| `workflow-py/` | Python workflow |
| `render.yaml` | Blueprint: web + both workflows |

## Environment

Set these in the Render Dashboard (they are `sync: false` in the Blueprint):

| Variable | Service | Purpose |
|---|---|---|
| `TYPESAFE_API_KEY` | both workflows | Jev API key |
| `RENDER_API_KEY` | web | Trigger workflow runs |

Already set in `render.yaml`: `TS_TASK_ID`, `PY_TASK_ID`, `NEXT_PUBLIC_GITHUB_REPO`.

## Local

```bash
# workflows
cd workflow-ts && npm install && npm run fetch-model && npm run build
cd ../workflow-py && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python fetch_model.py

# web
cd ../web && npm install && npm run dev
```

Workflows still need `render workflows dev` plus `RENDER_API_KEY` and `TYPESAFE_API_KEY` to run end to end.

## Stack

- UI: Next.js + Render DDS
- Jobs: Render Workflows (`@renderinc/sdk` / `render`)
- Verdict: Jev via `TYPESAFE_API_KEY`
- Hosting: Render Blueprint
