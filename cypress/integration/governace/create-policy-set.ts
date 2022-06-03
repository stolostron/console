/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'

describe('create policy set', () => {
    const namespace: string = `cypress-${crypto.randomBytes(4).toString('hex')}`
    const name = `cypress-${crypto.randomBytes(4).toString('hex')}`

    // const mockedPolling: unknown[] = []

    before(() => {
        cy.createNamespace(namespace)
        // cy.intercept({ method: 'GET', url: '/socket.io' }, { fixture: 'polling.json' })
        // cy.intercept({ method: 'GET', url: '/socket.io' }, (req, res) => {
        //     if (mockedPolling.length) {
        //         return mockedPolling.pop()
        //     }
        // })
    })

    after(() => {
        cy.deleteNamespace(namespace)
    })

    it('load page', () => {
        cy.visit(`/multicloud/governance/policy-sets/create`)
        cy.get('.pf-c-page__main').contains('Create policy set', { timeout: 5 * 60 * 1000 })
    })

    it('details', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#name').type(name)
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
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.contains('Submit').click()
        // mockedPolling.push({ event: 'ADDED', object: { kind: 'PoliycSet' } })
    })

    it('policy set page should show created policy set', () => {
        cy.contains('Governance')
        cy.contains('Policy sets')
        cy.contains(name)
    })
})
