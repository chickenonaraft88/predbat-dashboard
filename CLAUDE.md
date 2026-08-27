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

## Dark mode and mobile layout

- **Dark mode follows the OS preference.** `useSystemTheme()` (mounted once, at the app root in `App.tsx`) watches `matchMedia('(prefers-color-scheme: dark)')` and toggles Tailwind's class-based `dark` variant on `<html>` accordingly - components' `dark:` classes need nothing further. `useIsDarkMode()` is the read side (a component that needs to know the *current* theme in JS, not just in CSS - e.g. to pick a colour to hand to an inline `style`) - it watches the same `.dark` class via a `MutationObserver`, so it stays correct however the class got there (OS preference today, a manual toggle if one gets added later).
- **Predbat's literal state/rate colours need `cellBackground()` (`src/lib/planColors.ts`), not the raw hex, wherever they're painted as an inline `style` background.** Inline styles always win over CSS classes, so a `dark:` class can't rescue them. Predbat's white/near-white tones (`#FFFFFF` idle, `#EEEEEE` FrzChrg) mean "nothing special happening" rather than a real signal, and read as a jarring bright box against a dark table if painted verbatim - `cellBackground(hex, isDark)` swaps just those for a neutral dark-surface tone in dark mode, leaving every meaningfully-coloured tone (Chrg green, Exp yellow, a hot rate band, ...) untouched in both themes.
- **The Plan table has two layouts, chosen by viewport width, not a responsive reflow of one table.** `PlanTable` (`src/components/PlanTable.tsx`) is a thin wrapper that calls `useMediaQuery('(max-width: 767px)')` once and renders either `DesktopPlanTable` (the data grid) or `PlanTableMobile` (`src/components/PlanTableMobile.tsx`, a two-line card per slot with tap-to-expand for the columns that don't fit) - never both. Keep it that way rather than merging them behind CSS `hidden`/`md:hidden` classes: both layouts render interactive elements (override menu buttons, in particular) with the same accessible names, so mounting both at once would make `getByRole`/`getByTestId` queries in tests ambiguous, and would double up real interactive elements in production. Shared pure logic (`activePlanOverride`, `findOverrideValue`, `PLAN_OVERRIDE_ITEMS`) lives in `src/lib/planOverrides.ts` so both layouts can import it without either importing the other's component module.
- Tests that need to force one branch or the other mock `window.matchMedia` with `vi.spyOn` (see `PlanTable.test.tsx`'s "mobile layout switch" describe block, or `useSystemTheme.test.tsx`) - `src/test/setup.ts` polyfills `matchMedia` as "never matches" by default (jsdom doesn't implement it at all), so existing tests default to the desktop/light branch unless they override it.

## Keep PRs small and self-contained

Prefer several small, reviewable PRs over one large one. A PR should do one thing - a feature, a fix, a docs update, a tooling change - not several unrelated things bundled together. If a task naturally splits (e.g. "add a feature" and "document the convention that feature establishes"), open it as separate PRs, stacking the dependent one on the branch that introduces what it depends on (`head` = the new branch, `base` = the branch it builds on, not `main`) rather than folding everything into a single diff. This keeps each PR reviewable on its own and keeps the "why" of each change legible in its own commit/PR history.
