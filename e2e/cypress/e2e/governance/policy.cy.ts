/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'

const namespace: string = `test`
const name = `cypress-${crypto.randomBytes(4).toString('hex')}`

describe('acm page', () => {
    it('load page', () => {
        cy.visit(`/`)
        cy.get('.pf-c-page__main').contains('Red Hat', { timeout: 5 * 60 * 1000 })
    })
})

describe('create policy', () => {
    it('navigate to policy wizard', () => {
        cy.navigate('nav-governance', 'subnav-policies')
        cy.get('.pf-c-button').contains('Create policy').click()
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
        cy.get('#yaml-switch').click({ force: true })
        cy.contains('Submit').click()
    })

    it('policy details page', () => {
        cy.url().should('include', name)
        cy.contains(name)
    })
})

describe('edit policy', () => {
    it('navigate to policy page', () => {
        cy.navigate('nav-governance', 'subnav-policies')
    })
    // before(() => {
    //     cy.createNamespace(namespace)
    //     cy.exec('echo $POLICY | oc apply -f -', { env: { POLICY: JSON.stringify(policy) } })
    // })

    // after(() => {
    //     cy.deleteNamespace(namespace)
    // })

    // it('load page', () => {
    //     cy.visit(`/multicloud/governance/policies`)
    //     cy.get('.pf-c-page__main').contains('Governance', { timeout: 5 * 60 * 1000 })
    // })

    it('policy page should contain policy', () => {
        cy.contains('Policies')
        cy.get('.pf-c-search-input__text-input').type(name)
        cy.contains(name)
    })

    it('edit policy', () => {
        cy.contains('td', name)
            .parent()
            .within(() => {
                cy.get('[type="checkbox"]').check()
                cy.get('button[type="button"]').eq(1).click()
                cy.contains('Edit').click()
            })
        cy.get('button').contains('Review').click()
        cy.get('button').contains('Submit').click()
    })

    it('policy page should contain policy', () => {
        cy.contains('Policies')
        cy.get('.pf-c-search-input__text-input').type(name)
        cy.contains(name)
    })
})

describe('delete policy', () => {
    it('navigate to policy page', () => {
        cy.navigate('nav-governance', 'subnav-policies')
    })

    // before(() => {
    //     cy.createNamespace(namespace)
    //     cy.exec('echo $POLICY | oc apply -f -', { env: { POLICY: JSON.stringify(policy) } })
    // })

    // after(() => {
    //     cy.deleteNamespace(namespace)
    // })

    it('policy page should contain policy', () => {
        cy.contains('Policies')
        cy.get('.pf-c-search-input__text-input').type(name)
        cy.contains(name)
    })

    it('delete policy', () => {
        cy.contains('td', name)
            .parent()
            .within(() => {
                cy.get('[type="checkbox"]').check()
                cy.get('button[type="button"]').eq(1).click()
                cy.contains('Delete').click()
            })
        cy.contains('Permanently delete policy')
        cy.contains('Delete').click()
    })

    it('policy page should not contain policy', () => {
        cy.contains('td', name).should('not.exist')
    })
})
