/* Copyright Contributors to the Open Cluster Management project */

describe('acm page', () => {
    it('load page', () => {
        cy.visit(`/`)
        cy.get('.pf-c-page__main').contains('Red Hat', { timeout: 5 * 60 * 1000 })
    })
})

describe('cluster sets page', () => {
    it('navigate to clusters sets page', () => {
        cy.navigate('nav-clusters', 'subnav-cluster-sets')
    })
})
