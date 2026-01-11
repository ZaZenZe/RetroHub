# Commit Message Conventions

We use Conventional Commits to keep history readable and automate releases.

## Format

```
<type>(<scope>): <subject>
```

- Use lowercase for type and scope.
- Scope is optional but recommended (service, module, doc section).
- Subject is imperative, present tense, no period.

## Types

- feat: add a new feature
- fix: bug fix
- docs: documentation-only changes
- style: formatting/style changes (no logic)
- refactor: code change that neither fixes a bug nor adds a feature
- test: add or update tests
- chore: tooling, configs, deps, CI/CD

## Examples

- feat(auth): add user registration endpoint
- fix(db): resolve MongoDB connection timeout
- docs(readme): update installation instructions
- chore(deps): update dependencies

## Template

```
<type>(<scope>): <short summary>

[optional body explaining what and why]
[optional footer for breaking changes or issues]
```

## When to use each type

- feat: new capability visible to users or APIs
- fix: user-visible bug or functional defect
- docs: README, ADRs, guides, comments
- style: formatting/lint/prettier changes only
- refactor: internal changes improving structure/perf without new behavior
- test: new or updated tests
- chore: dependency bumps, CI, build, tooling, housekeeping

## Footers

- breaking changes: prefix with `BREAKING CHANGE:` and describe impact
- issues: reference with `Closes #123` or `Refs #123` as appropriate
