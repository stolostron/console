/* Copyright Contributors to the Open Cluster Management project */
import './commands'

declare global {
    namespace Cypress {
        interface Chainable {
            login(): Chainable<void>
            navigate(nav: string, subNav?: string): void
            multiselect(value: string): Chainable<Element>
        }
    }
}

before(() => {
    Cypress.Cookies.defaults({
        preserve: ['_csrf', '_oauth_proxy', 'acm-access-token-cookie'],
    })
    cy.login()
})
