/* Copyright Contributors to the Open Cluster Management project */
export function createPolicySet(name, namespace) {
    cy.visit(`/multicloud/governance/policy-sets/create`)

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.get('#name').type(name)
        cy.get('#namespace').click().get(`#${namespace}`).click()
    })
    cy.contains('Next').click()

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.get('#policies').within(() => {
            cy.get('[type="checkbox"]').first().check()
        })
    })
    cy.contains('Next').click()

    cy.get('.pf-c-wizard__main-body').within(() => {
        cy.get('#add-button').click()
        cy.get('#label-expressions').within(() => {
            cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
            cy.get('#values').multiselect('true')
        })
    })
    cy.contains('Next').click()

    cy.get('#nav-toggle').click()
    cy.get('#yaml-switch').click({ force: true })
    cy.contains('Submit').click()

    cy.contains('Policy sets')
}
