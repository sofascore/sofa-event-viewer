import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emits event/index.html, so any static file server (python -m http.server) can serve /event/.
  trailingSlash: true,
};

export default nextConfig;
