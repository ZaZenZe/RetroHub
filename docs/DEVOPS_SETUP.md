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

- Config: .eslintrc.json (extends eslint:recommended, Node env, ES2022)
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
  - "lint": "eslint backend/**/\*.js frontend/**/\*.js server.js"
  - "format": "prettier --write \"\*_/_.{js,json,md}\""
- Dev dependencies: eslint, prettier, husky, lint-staged
- lint-staged block: see above

## Troubleshooting

- Hook not firing: ensure `npx husky init` ran and .husky/pre-commit is executable
- ESLint errors: fix or use `npm run lint -- --fix`
- Prettier conflicts: ensure only one formatter runs (disable editor format-on-save if needed)
