/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'

const namespace: string = `default`
const policySetName = `cypress-${crypto.randomBytes(4).toString('hex')}`

describe('create policy set', () => {
    it('navigate to policy-set wizard', () => {
        cy.navigate('nav-governance', 'subnav-policy-sets')
        cy.get('.pf-c-button').contains('Create policy set').click()
    })

    it('details', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#name').type(policySetName)
            cy.get('#namespace').click()
            cy.get('.pf-c-select__menu').within(() => {
                cy.get('.pf-m-search').type(`${namespace}`)
                cy.get('li').click()
            })
        })
        cy.contains('Next').click()
    })

    it('policies', () => {
        cy.contains('Next').click()
    })

    it('placement', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#add-button').click()
            cy.get('#label-expressions').within(() => {
                cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
                cy.get('#values').multiselect('true')
            })
        })
        cy.contains('Next').click()
    })

    it('review', () => {
        cy.get('#yaml-switch').click({ force: true })
        cy.contains('Submit').click()
    })

    it('policy set details page', () => {
        cy.contains('Governance')
        cy.contains('Policy sets')
        cy.contains(policySetName)
    })
})
