/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

describe('create policy set', () => {
    it('displays', () => {
        cy.visit(`/multicloud/governance/policies/create`)
        cy.login()
    })

    it('details', () => {
        cy.get('#details').within(() => {
            cy.get('#name').type('cypress-policy')
            cy.get('#namespace').click().get('#test').click()
        })
        cy.contains('Next').click()
    })

    it('templates', () => {
        cy.get('#templates').within(() => {
            cy.contains('Add policy template').click()
            cy.contains('Limit cluster admin roles').click()
        })
        cy.contains('Next').click()
    })

    it('placement', () => {
        cy.get('#placement').within(() => {
            cy.contains('New placement').click()
            cy.get('#add-button').click()
            cy.get('#label-expressions').within(() => {
                cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
                cy.get('#values').multiselect('true')
            })
        })
        cy.contains('Next').click()
    })

    it('policy annotations', () => {
        cy.get('#categories').within(() => {})
        cy.get('#standards').within(() => {})
        cy.get('#controls').within(() => {})
        cy.contains('Next').click()
    })

    it('review', () => {
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.contains('Submit').click()
    })

    it('verify', () => {
        cy.contains('Policies')
        cy.contains('cypress-policy')
    })
})
