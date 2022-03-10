/* Copyright Contributors to the Open Cluster Management project */
// ***********************************************************
// This example support/index.js is processed and
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
// Alternatively you can use CommonJS syntax:
// require('./commands')
import './commands'

beforeEach(() => {
    Cypress.Cookies.defaults({
        preserve: ['_csrf', '_oauth_proxy', 'acm-access-token-cookie'],
    })
})

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-cy attribute.
             * @example cy.dataCy('greeting')
             */
            multiselect(value: string): Chainable<Element>
            login(): Chainable<Element>
        }
    }
}
