import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emits event/index.html, so any static file server (python -m http.server) can serve /event/.
  trailingSlash: true,
  // Stop `next dev` from writing AGENTS.md and CLAUDE.md when an AI agent runs it.
  agentRules: false,
  // New on every `next dev` start and `next build`; the browser wipes stored state when it changes.
  env: { NEXT_PUBLIC_RUN_ID: String(Date.now()) },
};

export default nextConfig;
