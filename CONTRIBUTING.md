# Contributing to RetroHub

Thanks for helping improve RetroHub! This guide explains how to propose changes and keep quality high.

## How to Report Bugs

- Open an issue with a clear title and description.
- Include steps to reproduce, expected vs actual behavior, and environment details.
- Add logs or screenshots when helpful.

## How to Suggest Features

- Open an issue labeled `enhancement`.
- Describe the user problem, proposed solution, and alternatives considered.

## Workflow

1. Create a branch from `develop`:
   - `feature/<name>` for new features
   - `fix/<name>` for bug fixes
   - `chore/<name>` for maintenance
2. Commit using Conventional Commits (see `docs/COMMIT_CONVENTIONS.md`).
3. Keep PRs focused and small; rebase onto `develop` before opening a PR.
4. Open a PR to `develop` and fill out the template.

## Code Style

- JavaScript: follow ESLint/Prettier configuration in the repo.
- Use single quotes and semicolons; 2-space indentation.
- Prefer small, pure functions and clear naming.
- Add brief comments only when intent is non-obvious.

## Tests and Quality Checks

- Run `npm run lint` at the root before pushing.
- Add or update tests when changing logic (placeholder until tests are added).
- Ensure `node scripts/health-check.js` passes when services are running.

## Documentation

- Update relevant docs (README, SETUP, API_TESTING, ARCHITECTURE) when behavior or setup changes.
- Keep examples platform-agnostic or note OS-specific steps.

## Pull Request Expectations

- Describe what changed and why.
- Link related issues (e.g., `closes #123`).
- Confirm checkboxes in the PR template (lint, tests, docs, branch up to date).
- Be responsive to review comments; request another review after addressing feedback.

## Code Review

- Aim for correctness, clarity, and security.
- Look for error handling, input validation, and logging where appropriate.
- Prefer incremental improvements over large rewrites.
