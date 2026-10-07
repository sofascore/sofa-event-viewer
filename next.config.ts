import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emits event/index.html, so any static file server (python -m http.server) can serve /event/.
  trailingSlash: true,
  // Stop `next dev` from writing AGENTS.md and CLAUDE.md when an AI agent runs it.
  agentRules: false,
};

export default nextConfig;
