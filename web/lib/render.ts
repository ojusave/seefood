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

export function deployToRenderUrl(): string {
  return `https://render.com/deploy?repo=${githubRepoUrl()}`;
}
