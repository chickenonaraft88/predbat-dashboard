# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A standalone dashboard for [Predbat](https://github.com/springfall2008/batpred), built with Vite + React + TypeScript + TanStack Query. It talks directly to Predbat's `/api/*` JSON routes from the browser - there is no backend of its own. See `README.md` for the stack, API surface, and development commands.

## UI changes need a screenshot in the PR

Before opening or updating a PR for any change that affects rendered UI - layout, styling, a new or changed view, a component's visible behavior - capture a screenshot and make sure reviewers can actually see it in the PR, not just in your own terminal:

1. Run the dev server (`npm run dev`) and drive it with Playwright to capture the affected view(s). Chromium is pre-installed in the Claude Code remote environment at `/opt/pw-browsers/chromium` - launch with `executablePath: '/opt/pw-browsers/chromium'` rather than downloading a browser.
2. Commit the screenshot(s) into the PR branch under `docs/screenshots/<short-name>.png`.
3. Embed it in the PR description with a fully-qualified URL so it renders inline for reviewers:
   `![description](https://raw.githubusercontent.com/<owner>/predbat-dashboard/<branch>/docs/screenshots/<name>.png)`
   A relative markdown path does not reliably render in a PR body - use the `raw.githubusercontent.com` URL pinned to this PR's branch, since there is no direct image-upload API available for PR descriptions.
4. Skip this for changes with no visible effect - pure logic, types, config, docs, or hook scripts.

Not every PR needs a new screenshot: if a change doesn't touch anything on screen, say so instead of manufacturing one.

## Testing strategy

New code needs tests. The stack:

- **Runner**: [Vitest](https://vitest.dev/) - it shares config with Vite (`vite.config.ts`'s `test` block), no separate transform pipeline needed. Tests live alongside the code they cover (`*.test.ts`/`*.test.tsx`), not in a parallel `tests/` tree.
- **Components**: [React Testing Library](https://testing-library.com/react) (`@testing-library/react` + `jest-dom` + `user-event`). Assert on rendered output/behavior, not implementation details.
- **API mocking**: [MSW](https://mswjs.io/) (`src/test/msw/`) intercepts Predbat's `/api/*` responses at the network level, so `src/api/client.ts`'s real `fetch` calls are exercised end to end rather than mocking the client itself away. Add new default handlers there; override per-test with `server.use(...)`.
- **Providers**: use `renderWithProviders`/`TestProviders` from `src/test/renderWithProviders.tsx` (fresh `QueryClient` + fixed connection) instead of hand-rolling provider wrappers per test.

**Do not use bare `renderHook()`'s `result.current` to observe a hook's state after an awaited async update** (e.g. after calling `refetch()`). In this stack (React 19 + Testing Library + TanStack Query v5) it does not reliably propagate the update back through `result.current` - it just never updates, not merely slowly - even though the same update reaches any component actually rendering the hook. Instead render the hook through a small consumer component and assert on the DOM (`render` + `screen` + `waitFor`); see `src/hooks/usePredbat.test.tsx` for the pattern.

CI (`.github/workflows/ci.yml`) runs `lint`, `build` (typechecks via `tsc -b`), and `test` on every push and pull request - a PR isn't done until all three are green.

## Keep PRs small and self-contained

Prefer several small, reviewable PRs over one large one. A PR should do one thing - a feature, a fix, a docs update, a tooling change - not several unrelated things bundled together. If a task naturally splits (e.g. "add a feature" and "document the convention that feature establishes"), open it as separate PRs, stacking the dependent one on the branch that introduces what it depends on (`head` = the new branch, `base` = the branch it builds on, not `main`) rather than folding everything into a single diff. This keeps each PR reviewable on its own and keeps the "why" of each change legible in its own commit/PR history.
