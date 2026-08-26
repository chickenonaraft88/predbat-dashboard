# Predbat Dashboard

A standalone web dashboard for [Predbat](https://github.com/springfall2008/batpred), talking directly to Predbat's built-in JSON API instead of running inside Home Assistant's ingress frontend.

## Stack

- [Vite](https://vite.dev/) + React + TypeScript, no server component - it ships as static files.
- [TanStack Query](https://tanstack.com/query) for polling Predbat's API (matches Predbat's own poll-based update model).
- [Recharts](https://recharts.org/) for the plan chart.
- [Tailwind CSS v4](https://tailwindcss.com/) for styling, with light/dark support following the OS theme.

## Talking to Predbat

Predbat exposes a small JSON API (see `apps/predbat/web.py` in batpred) that this dashboard reads from directly in the browser:

- `GET /api/ping` - liveness check
- `GET /api/status` - whether Predbat is currently calculating
- `GET /api/plan_data` - the current plan, yesterday's plan, and baseline comparison, with a conditional-fetch mode (`{unchanged: true}`) so polling is cheap
- `GET /api/state?entity_id=...` - a single entity's state/attributes

By default Predbat does not send CORS headers on these routes, so a dashboard served from a different origin can't call them from the browser. Enable it on the Predbat side with a `web_cors_origins` entry in `apps.yaml`:

```yaml
web_cors_origins:
  - "http://localhost:5173"
```

(see the batpred docs, `docs/apps-yaml.md`, "Web interface" section).

The dashboard's target Predbat URL is set from the connection bar at the top of the page and stored in the browser's `localStorage` - there is no backend and no build-time configuration needed to point it at a different instance.

## Development

```bash
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # typecheck + production build to dist/
npm run lint      # oxlint
```

## Project layout

```
src/
  api/         # fetch client for Predbat's JSON API, types, connection state
  hooks/       # TanStack Query hooks wrapping the API client
  components/  # dashboard UI (connection bar, status cards, plan table/chart)
```

## Status

This is an early scaffold: connection handling, live status, and the plan table/chart are wired up. Not yet covered: the other views from Predbat's built-in web UI (entities, charts, config editor, log viewer, compare) - see `docs/web-interface.md` in batpred for what those look like today.
