# Git Workflow and Branch Protection

## Protection goals
- Keep `prod` and `dev` stable.
- Require peer review before merging.
- Ensure CI (lint/tests) passes before merge.
- Block force pushes; require branches to be up to date.

## GitHub branch protection setup (UI)
1. Open the repository on GitHub.
2. Go to **Settings → Branches → Branch protection rules → Add rule**.
3. For **Branch name pattern**, enter `prod` and enable:
   - **Require a pull request before merging** (require approvals).
   - **Require status checks to pass before merging**; select CI checks (lint, test) once they exist.
   - **Require branches to be up to date before merging**.
   - **Do not allow bypassing above settings** (if available).
   - **Restrict who can push to matching branches** or **Block force pushes**.
   - Save the rule.
4. Repeat steps 2–3 for `dev`, with at least **1 approval** required. Status checks should mirror `prod`.

## Pull request expectations
- Create PRs from `feature/*` into `dev`; from `dev` into `prod` for releases.
- Keep PRs small, focused, and with passing checks before requesting review.
- Resolve review comments or discuss before merging.

## Status checks (to configure in CI)
- Lint: `npm run lint`.
- Tests: `npm test` (placeholder until tests exist).

## Force-push policy
- Never force-push to `prod` or `dev`.
- Force-push to personal feature branches only when safe and communicated.
