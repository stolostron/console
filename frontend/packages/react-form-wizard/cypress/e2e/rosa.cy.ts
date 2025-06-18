/// <reference types="cypress" />

describe('rosa wizard', () => {
    it('displays', () => {
        cy.visit('http://localhost:3000/?route=rosa')
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.get('h1').contains('Create ROSA cluster')
    })
})
