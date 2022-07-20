/* Copyright Contributors to the Open Cluster Management project */

describe('acm page', () => {
    it('load page', () => {
        cy.visit(`/`)
        cy.get('.pf-c-page__main').contains('Red Hat', { timeout: 5 * 60 * 1000 })
    })
})

describe('create credential', () => {
    it('navigate to create credential wizard', () => {
        cy.navigate('nav-credentials')
        // cy.get('.pf-c-button').contains('Create credential').click()
    })
})
