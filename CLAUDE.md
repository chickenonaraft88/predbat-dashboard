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
