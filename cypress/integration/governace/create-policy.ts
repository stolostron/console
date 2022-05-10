/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'

describe('create policy', () => {
    const namespace: string = `cypress-${crypto.randomBytes(4).toString('hex')}`
    const name = `cypress-${crypto.randomBytes(4).toString('hex')}`

    before(() => {
        cy.createNamespace(namespace)
    })

    after(() => {
        cy.deleteNamespace(namespace)
    })

    it('load page', () => {
        cy.visit(`/multicloud/governance/policies/create`)
        cy.get('.pf-c-page__main').contains('Create policy', { timeout: 5 * 60 * 1000 })
    })

    it('details', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#name').type(name)
            cy.get('#namespace').click().get(`#${namespace}`).click()
        })
        cy.contains('Next').click()
    })

    it('templates', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.contains('Add policy template').click()
            cy.contains('Limit cluster admin roles').click()
        })
        cy.contains('Next').click()
    })

    it('placement', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.contains('New placement').click()
            cy.get('#add-button').click()
            cy.get('#label-expressions').within(() => {
                cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
                cy.get('#values').multiselect('true')
            })
        })
        cy.contains('Next').click()
    })

    it('annotations', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#categories').within(() => {})
            cy.get('#standards').within(() => {})
            cy.get('#controls').within(() => {})
        })
        cy.contains('Next').click()
    })

    it('review', () => {
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.contains('Submit').click()
    })

    it('policy details page should show created policy set', () => {
        cy.url().should('include', name)
        cy.contains(name)
    })
})
