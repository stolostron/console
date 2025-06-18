/// <reference types="cypress" />

describe('argo wizard', () => {
    it('displays', () => {
        cy.visit('http://localhost:3000/?route=argo-cd-create')
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.get('h1').contains('Create application set')
    })

    it('details', () => {
        cy.get('#name').type('my-application-set')
        cy.get('#namespace').click().get('#server-1').click()
        cy.contains('Next').click()
    })

    // it('template', () => {
    //     cy.get('#template').within(() => {
    //         cy.get('#destination').type('my-destination')
    //     })
    //     cy.contains('Next').click()
    // })

    // it('sync policy', () => {
    //     cy.contains('Next').click()
    // })

    // it('cluster placement', () => {
    //     cy.contains('Next').click()
    // })

    // it('review', () => {
    //     cy.contains('Submit').should('be.enabled')
    // })
})
