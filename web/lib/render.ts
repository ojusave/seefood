export function renderSignupUrlWithUtms(
  content: string = "footer_link",
): string {
  const params = new URLSearchParams({
    utm_source: "github",
    utm_medium: "referral",
    utm_campaign: "ojus_demos",
    utm_content: content,
  });

  return `https://render.com/register?${params.toString()}`;
}

export function githubRepoUrl(): string {
  return process.env.NEXT_PUBLIC_GITHUB_REPO ?? "https://github.com/ojusave/seefood";
}

const DEPLOY_BUTTON = "https://render.com/images/deploy-to-render-button.svg";

export function deployButtonSrc(): string {
  return DEPLOY_BUTTON;
}

/** TypeScript stack: web + Node workflow Blueprint on main. */
export function deployTypescriptUrl(): string {
  return `https://render.com/deploy?repo=${githubRepoUrl()}`;
}

/** Python stack: web + Python workflow Blueprint on the python branch. */
export function deployPythonUrl(): string {
  return `https://render.com/deploy?repo=${githubRepoUrl()}/tree/python`;
}

/** Official Render Workflows docs. */
export function renderWorkflowsUrl(): string {
  return "https://render.com/docs/workflows";
}

/** Official TypeSafe Jev announcement. */
export function typeSafeJevUrl(): string {
  return "https://typesafe.ai/blog/introducing-system-one-models-and-jev";
}
