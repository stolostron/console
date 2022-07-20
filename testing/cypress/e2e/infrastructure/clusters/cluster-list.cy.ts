/* Copyright Contributors to the Open Cluster Management project */

describe('cluster list page', () => {
    it('navigate to clusters list page', () => {
        cy.navigate('nav-clusters', 'subnav-cluster-list')
    })
})
