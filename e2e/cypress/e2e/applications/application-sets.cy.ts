/* Copyright Contributors to the Open Cluster Management project */

describe('acm page', () => {
    it('load page', () => {
        cy.visit(`/`)
        cy.get('.pf-c-page__main').contains('Red Hat', { timeout: 5 * 60 * 1000 })
    })
})

describe('create application set', () => {
    it('navigate to create application set wizard', () => {
        cy.navigate('nav-applications')
        // cy.get('.pf-c-button').contains('Create application set').click()
    })
})
