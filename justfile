set shell := ["bash", "-euo", "pipefail", "-c"]

port := "8770"

# List the recipes
default:
    @just --list

# Install dependencies
install:
    pnpm install

# Dev server with hot reload on http://localhost:3456 (this PC only)
dev:
    pnpm dev

# Build the static site and serve it to everyone on NetBird and the office LAN (Ctrl+C stops it)
prod:
    pnpm build
    @echo "Serving on http://$(ip -4 -o addr show wt0 | awk '{print $4}' | cut -d/ -f1):{{port}} (NetBird) and :{{port}} on every other interface"
    python3 -m http.server {{port}} --bind 0.0.0.0 --directory out

# Lint and format
check:
    pnpm lint
    pnpm format
