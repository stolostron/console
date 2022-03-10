/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

describe('delete policy', () => {
    it('displays', () => {
        cy.visit(`/multicloud/governance/policies`)
        cy.login()
    })

    it('verify', () => {
        cy.contains('Policies')
        cy.contains('td', 'cypress-policy')
            .parent()
            .within(() => {
                cy.get('[type="checkbox"]').check()
                cy.get('button[type="button"]').eq(1).click()
                cy.wait(100)
                cy.contains('Delete').click()
            })
        cy.contains('Permanently delete policy')
        cy.contains('Delete').click()
        cy.contains('td', 'cypress-policy').should('not.exist')
    })
})
