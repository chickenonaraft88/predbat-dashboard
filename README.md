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
npm run test      # vitest
npm run test:watch     # vitest in watch mode
npm run test:coverage  # vitest with a coverage report
```

## Project layout

```
src/
  api/         # fetch client for Predbat's JSON API, types, connection state
  hooks/       # TanStack Query hooks wrapping the API client
  components/  # dashboard UI (connection bar, status cards, plan table/chart)
  test/        # test setup, MSW handlers, and shared render helpers
```

## Testing

Tests use [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/react) and [MSW](https://mswjs.io/) to mock Predbat's `/api/*` responses at the network level, so the real fetch client (`src/api/client.ts`) is exercised end to end rather than mocked itself. Tests live alongside the code they cover (`*.test.ts`/`*.test.tsx`).

When a test needs to observe a hook's state after an async update (e.g. after calling `refetch()`), render the hook through a small consumer component and assert on the DOM rather than using `renderHook()`'s `result.current` directly - see the comment in `src/hooks/usePredbat.test.tsx`. In this project's stack (React 19 + Testing Library + TanStack Query v5), `renderHook()` does not reliably propagate a query's post-refetch state back through `result.current`, even though the same update reaches any component actually rendering the hook.

CI (`.github/workflows/ci.yml`) runs lint, the production build (which typechecks), and the test suite on every push and pull request.

## Status

This is an early scaffold: connection handling, live status, and the plan table/chart are wired up. Not yet covered: the other views from Predbat's built-in web UI (entities, charts, config editor, log viewer, compare) - see `docs/web-interface.md` in batpred for what those look like today.
