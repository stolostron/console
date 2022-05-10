/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'

const namespace: string = `cypress-${crypto.randomBytes(4).toString('hex')}`
const name = `cypress-${crypto.randomBytes(4).toString('hex')}`

const policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: name,
        namespace: namespace,
        annotations: {
            'policy.open-cluster-management.io/categories': 'AC Access Control',
            'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
            'policy.open-cluster-management.io/controls': 'AC-3 Access Enforcement',
        },
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'IamPolicy',
                    metadata: { name: 'policy-limitclusteradmin' },
                    spec: {
                        severity: 'medium',
                        namespaceSelector: { include: ['*'], exclude: ['kube-*', 'openshift-*'] },
                        remediationAction: 'inform',
                        maxClusterRoleBindingUsers: 5,
                    },
                },
            },
        ],
    },
}

describe('delete policy', () => {
    before(() => {
        cy.createNamespace(namespace)
        cy.exec('echo $POLICY | oc apply -f -', { env: { POLICY: JSON.stringify(policy) } })
    })

    after(() => {
        cy.deleteNamespace(namespace)
    })

    it('policy page should contain policy', () => {
        cy.visit(`/multicloud/governance/policies`)
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
