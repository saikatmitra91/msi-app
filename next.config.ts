import type { NextConfig } from "next";

// We deploy to GitHub Pages today (see ADR-0001). When/if we move to a host
// that supports SSR (Vercel, Fly, etc.) we drop `output: "export"` and remove
// basePath/assetPrefix.
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGithubPagesBuild = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGithubPagesBuild && repo
    ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` }
    : {}),
};

export default nextConfig;
