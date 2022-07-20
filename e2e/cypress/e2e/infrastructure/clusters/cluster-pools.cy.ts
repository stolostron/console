/* Copyright Contributors to the Open Cluster Management project */

describe('acm page', () => {
    it('load page', () => {
        cy.visit(`/`)
        cy.get('.pf-c-page__main').contains('Red Hat', { timeout: 5 * 60 * 1000 })
    })
})

describe('cluster pools page', () => {
    it('navigate to clusters pools page', () => {
        cy.navigate('nav-clusters', 'subnav-cluster-pools')
    })
})
