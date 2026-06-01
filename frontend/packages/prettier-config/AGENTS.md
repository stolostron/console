# Prettier Config

`@stolostron/prettier-config` — Shared Prettier configuration for stolostron projects.

## Structure

- `index.json` — Configuration file

## Settings

- Print width: 120
- Tab width: 2
- No semicolons
- Single quotes
- Trailing commas: ES5

## Usage

This package has no build or test scripts. It is referenced by other packages via `"prettier": "@stolostron/prettier-config"` in their `package.json`. Changes here affect formatting across the entire frontend and all workspace packages.
