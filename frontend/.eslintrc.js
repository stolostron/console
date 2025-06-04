/* Copyright Contributors to the Open Cluster Management project */
module.exports = {
  root: true,
  extends: ['@stolostron/eslint-config'],
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
  ],
}
