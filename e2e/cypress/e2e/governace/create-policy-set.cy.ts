/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'

describe('create policy set', () => {
    const namespace: string = `cypress-${crypto.randomBytes(4).toString('hex')}`
    const name = `cypress-${crypto.randomBytes(4).toString('hex')}`

    before(() => {
        cy.createNamespace(namespace)
        cy.mockResource({
            apiVersion: 'cluster.open-cluster-management.io/v1',
            kind: 'ManagedCluster',
            metadata: { name: 'local-cluster', labels: { 'local-cluster': 'true' } },
        })
    })

    after(() => {
        cy.deleteNamespace(namespace)
    })

    it('load page', () => {
        cy.visit(`/multicloud/governance/policy-sets/create`)
        cy.get('.pf-c-page__main').contains('Create policy set', { timeout: 5 * 60 * 1000 })

        // it('details', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#name').type(name)
            cy.get('#namespace').click()
            cy.get('.pf-c-select__menu').within(() => {
                cy.get('.pf-m-search').type(`${namespace}`)
                cy.get('li').click()
            })
        })
        cy.contains('Next').click()

        // it('policies', () => {
        cy.contains('Next').click()

        // it('placement', () => {
        cy.get('.pf-c-wizard__main-body').within(() => {
            cy.get('#add-button').click()
            cy.get('#label-expressions').within(() => {
                cy.get('#key').click().get('#local-cluster').scrollIntoView().click()
                cy.get('#values').multiselect('true')
            })
        })
        cy.contains('Next').click()

        // it('review', () => {
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.mockCreateResource(
            {
                apiVersion: 'policy.open-cluster-management.io/v1beta1',
                kind: 'PolicySet',
                metadata: { name, namespace },
                spec: {},
            },
            'createPolicySet'
        )
        cy.mockCreateResource({
            apiVersion: 'apps.open-cluster-management.io/v1',
            kind: 'PlacementRule',
            metadata: { name: name + '-placement', namespace },
        })
        cy.mockCreateResource({
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PlacementBinding',
            metadata: { name: name + '-placement', namespace },
        })
        cy.contains('Submit').click()
        // cy.mockWait('@createPolicySet')

        // it('policy set page should show created policy set', () => {
        cy.contains('Governance')
        cy.contains('Policy sets')
        cy.contains(name)
    })
})
