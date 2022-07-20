/* Copyright Contributors to the Open Cluster Management project */
import '@cypress/code-coverage/support'
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
    cy.visit(`/`)
    cy.get('.pf-c-page__main').contains('Red Hat', { timeout: 5 * 60 * 1000 })
})
