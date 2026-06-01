# ESLint Config

`@stolostron/eslint-config` — Shared flat ESLint configuration for stolostron projects.

## Structure

- `index.mjs` — Primary config (ESLint flat config format)
- `index.js` — Legacy CJS wrapper

## Plugins Included

TypeScript, React, Jest, jsx-a11y, i18n-json, Prettier, and unicorn.

## Usage

This package has no build or test scripts. Changes here affect linting across the entire frontend and all workspace packages. After modifying, run `npm run lint` from the frontend or repo root to verify.
