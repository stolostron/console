/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

describe('create policy set', () => {
    it('displays', () => {
        cy.visit(`/multicloud/governance/policy-sets/create`)
        cy.login()
    })

    it('details', () => {
        cy.get('#name').type('cypress-policy-set')
        cy.get('#namespace').click().get('#cypress').click()
        cy.contains('Next').click()
    })

    it('policies', () => {
        cy.get('#policies').within(() => {
            cy.get('[type="checkbox"]').first().check()
        })
        cy.contains('Next').click()
    })

    it('placement', () => {
        cy.get('#add-button').click()
        cy.get('#label-expressions').within(() => {
            cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
            cy.get('#values').multiselect('true')
        })
        cy.contains('Next').click()
    })

    it('review', () => {
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.contains('Submit').click()
        cy.contains('Policy sets')
    })

    it('verify', () => {
        cy.contains('cypress-policy-set')
    })
})
