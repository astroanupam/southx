import type { NextConfig } from "next";

// Static export: the whole app is plain files that GitHub Pages can serve.
// When deployed under https://<user>.github.io/<repo>/, the workflow sets NEXT_PUBLIC_BASE_PATH=/<repo>.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;