# DevOps Setup (Linting, Formatting, Hooks)

## Requirements

- Node.js 18+
- npm

## Install tooling (one-time)

```bash
npm install
npm install --save-dev eslint prettier husky lint-staged
```

## ESLint

- Config: eslint.config.js (flat config for ESLint v9; Node globals, ES2022, recommended-equivalent rules)
- Editor note: ensure your editor picks up `eslint.config.js` (ESLint v9 no longer reads .eslintrc by default).
- Run manually:

```bash
npm run lint
```

## Prettier

- Config: .prettierrc / .prettierignore
- Run manually:

```bash
npm run format
```

## Husky + lint-staged (recommended)

1. Enable Husky hooks:

```bash
npx husky init
```

2. Create .husky/pre-commit with executable bit and add:

```bash
npx lint-staged
```

3. lint-staged config (already in package.json):

```json
{
  "*.js": "eslint",
  "*.{js,json,md}": "prettier --write"
}
```

## Expected package.json entries

- Scripts:
  - "lint": "eslint backend/\*_/_.js"
  - "format": "prettier --write "\*_/_.{js,json,md}""
- Dev dependencies: eslint, prettier, husky, lint-staged
- lint-staged block: see above

## Troubleshooting

- Hook not firing: ensure `npx husky init` ran and .husky/pre-commit is executable
- ESLint errors: fix or use `npm run lint -- --fix`
- Prettier conflicts: ensure only one formatter runs (disable editor format-on-save if needed)
