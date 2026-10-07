# Sofa Event Viewer

Shows a SofaScore event (score, period scores, incidents, box score, lineups, statistics, H2H) from any
backend: production, `master.dev` or a branch test env. Every section links its API request and shows the raw
JSON. Read-only.

## Install

Needs Node 24, pnpm and [just](https://github.com/casey/just) (`python3` for `just prod`).

```sh
just install
```

## Use

```sh
just dev    # http://localhost:3456, reloads on save
just prod   # builds and serves on port 8770 for everyone on your network; Ctrl+C stops it
```

- Set the backend in the top bar (`master.dev.sofascore.dev`, a branch host or a full `https://…/api/v1` URL).
- Open an event by id, sofascore.com match URL or customId, from the home page or the box in the top bar.
- The page URL carries the event and backend (`/event/?id=17126272&api=master.dev.sofascore.dev`), so you can
  share it as is or with **Copy link**.
