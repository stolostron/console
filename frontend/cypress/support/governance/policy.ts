/* Copyright Contributors to the Open Cluster Management project */
export function createPolicy(name: string, namespace: string) {
    cy.visit(`/multicloud/governance/policies/create`)

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.get('#name').type(name)
        cy.get('#namespace').click().get(`#${namespace}`).click()
    })
    cy.contains('Next').click()

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.contains('Add policy template').click()
        cy.contains('Limit cluster admin roles').click()
    })
    cy.contains('Next').click()

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.contains('New placement').click()
        cy.get('#add-button').click()
        cy.get('#label-expressions').within(() => {
            cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
            cy.get('#values').multiselect('true')
        })
    })
    cy.contains('Next').click()

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.get('#categories').within(() => {})
        cy.get('#standards').within(() => {})
        cy.get('#controls').within(() => {})
    })
    cy.contains('Next').click()

    cy.get('#nav-toggle').click()
    cy.get('#yaml-switch').click({ force: true })
    cy.contains('Submit').click()

    cy.contains('Policies')
    cy.contains(name)
}

export function editPolicy(name: string) {
    cy.visit(`/multicloud/governance/policies`)
    cy.contains('Policies')
    cy.contains('td', name)
        .parent()
        .within(() => {
            cy.get('[type="checkbox"]').check()
            cy.get('button[type="button"]').eq(1).click()
            cy.wait(100)
            cy.contains('Edit').click()
        })
    cy.get('button').contains('Review').click()
    cy.get('button').contains('Submit').click()
    cy.contains('Policies')
    cy.contains(name)
}

export function deletePolicy(name: string) {
    cy.visit(`/multicloud/governance/policies`)
    cy.contains('Policies')
    cy.contains('td', name)
        .parent()
        .within(() => {
            cy.get('[type="checkbox"]').check()
            cy.get('button[type="button"]').eq(1).click()
            cy.wait(100)
            cy.contains('Delete').click()
        })
    cy.contains('Permanently delete policy')
    cy.contains('Delete').click()
    cy.contains('td', name).should('not.exist')
}
