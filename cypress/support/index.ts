/* Copyright Contributors to the Open Cluster Management project */
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
    Cypress.Cookies.defaults({
        preserve: ['_csrf', '_oauth_proxy', 'acm-access-token-cookie'],
    })
    cy.login()
})
