# About the support directory

Cypress automatically creates an example support file for each configured testing type (e2e.ts, component.ts), which has several commented out examples.

This file runs before every single spec file. We do this purely as a convenience mechanism so you don't have to import this file.

By default Cypress will automatically include type-specific support files. For E2E, the default is cypress/support/e2e.{js,jsx,ts,tsx}, and for Component Testing cypress/support/component.{js,jsx,ts,tsx}.

The support file is a great place to put reusable behavior such as custom commands or global overrides that you want applied and available to all of your spec files.

The initial imported support file can be configured to another file or turned off completely using the supportFile configuration. From your support file you can import or require other files to keep things organized.

You can define behaviors in a before or beforeEach within any of the cypress/support files:

```
beforeEach(() => {
  cy.log('I run before every test in every spec file!!!!!!')
})
```

Documentation here: https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Support-file
