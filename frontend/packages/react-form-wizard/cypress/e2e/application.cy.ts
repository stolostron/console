/// <reference types="cypress" />

describe('application wizard', () => {
    it('displays', () => {
        cy.visit('http://localhost:3000/?route=application')
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.get('h1').contains('Create application')
    })
})
