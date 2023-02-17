/// <reference types="cypress" />
//
// Command library
// imported and executed by e2e support file at the start of each spec
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add('multiselect', { prevSubject: 'element' }, (subject: JQuery<HTMLElement>, text: string) => {
  cy.wrap(subject)
    .click()
    .get('.pf-c-check')
    .contains(text)
    .parent()
    .within(() => cy.get('[type="checkbox"]').check())
})

// Login
// cy.session & cacheAcrossSpecs option will preserve session cache (cookies) across specs
// 'local-user' is the session id for caching and restoring session
Cypress.Commands.add('login', () => {
  cy.session(
    'local-user',
    () => {
      cy.exec('oc whoami -t').then((result) => {
        cy.setCookie('acm-access-token-cookie', result.stdout)
      })
      cy.exec('curl --insecure https://localhost:3000', { timeout: 120000 })
    },
    { cacheAcrossSpecs: true }
  )
})

Cypress.Commands.add('createNamespace', (namespace: string) => {
  cy.exec(`oc create namespace ${namespace}`)
  cy.exec(`oc label namespaces ${namespace} cypress=true`)
})

Cypress.Commands.add('deleteNamespace', (namespace: string) => {
  cy.exec(`oc delete namespace ${namespace}`)
})
