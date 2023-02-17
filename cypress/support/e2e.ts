// ***********************************************************
// Previously the supportFile option defaulted to cypress/support/index.js.
// Now the e2e.supportFile option defaults to cypress/support/e2e.{js,jsx,ts,tsx}
// and the component.supportFile option defaults to cypress/support/component.
// {js,jsx,ts,tsx}.
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      multiselect(value: string): Chainable<Element>
      login(): Chainable<void>
      createNamespace(namespace: string): Chainable<void>
      deleteNamespace(namespace: string): Chainable<void>
    }
  }
}

before(() => {
  cy.login()
})
// Alternatively you can use CommonJS syntax:
// require('./commands')
