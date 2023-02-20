/// <reference types="cypress" />

// import '../../commands'

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe('testing visiting cluster', () => {
  it('displays two todo items by default', () => {
    // Cypress.Cookies.defaults({
    //   preserve: ['_csrf', '_oauth_proxy', 'acm-access-token-cookie'],
    // })
    cy.visit('/multicloud/infrastructure/clusters')
  })
})
