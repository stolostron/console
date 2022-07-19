/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'
import { IResource } from '../../support/websocket-mock'

describe('policy set', () => {
    const namespace: string = `cypress-${crypto.randomBytes(4).toString('hex')}`
    const policySetName = `cypress-${crypto.randomBytes(4).toString('hex')}`

    after(() => {
        cy.deleteNamespace(namespace)
    })

    it('create policy set', () => {
        cy.createNamespace(namespace)
        cy.mockResource({
            apiVersion: 'cluster.open-cluster-management.io/v1',
            kind: 'ManagedCluster',
            metadata: { name: 'local-cluster', labels: { 'local-cluster': 'true' } },
        })

        cy.visit(`/multicloud/governance/policy-sets/create`)
        cy.get('.pf-c-page__main').contains('Create policy set', { timeout: 5 * 60 * 1000 })

        // Policy Set Details
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#name').type(policySetName)
            cy.get('#namespace').click()
            cy.get('.pf-c-select__menu').within(() => {
                cy.get('.pf-m-search').type(`${namespace}`)
                cy.get('li').click()
            })
        })
        cy.contains('Next').click()

        // Policy Set Policies
        cy.contains('Next').click()

        // Policy Set Placement
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#add-button').click()
            cy.get('#label-expressions').within(() => {
                cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
                cy.get('#values').multiselect('true')
            })
        })
        cy.contains('Next').click()

        // Policy Set Review
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.mockCreateResource(
            {
                apiVersion: 'policy.open-cluster-management.io/v1beta1',
                kind: 'PolicySet',
                metadata: { name: policySetName, namespace },
                spec: {},
            } as IResource,
            { alias: 'createPolicySet' }
        )
        cy.mockCreateResource({
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'PlacementRule',
            metadata: { name: policySetName + '-placement', namespace },
        })
        cy.mockCreateResource({
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PlacementBinding',
            metadata: { name: policySetName + '-placement', namespace },
        })
        cy.contains('Submit').click()
        // cy.mockWait('@createPolicySet')

        // it('policy set page should show created policy set', () => {
        cy.contains('Governance')
        cy.contains('Policy sets')
        cy.contains(policySetName)
    })
})
