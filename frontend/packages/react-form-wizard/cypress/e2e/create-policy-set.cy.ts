/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />
import YAML from 'yaml'
import { PlacementBindingType } from '../../wizards/common/resources/IPlacementBinding'
import { PlacementApiGroup, PlacementKind, PlacementType } from '../../wizards/common/resources/IPlacement'
import { PolicySetApiGroup, PolicySetKind, PolicySetType } from '../../wizards/common/resources/IPolicySet'
import { RouteE } from '../../wizards/Routes'

describe('create policy set', () => {
    it('displays', () => {
        cy.visit(`http://localhost:3000/${RouteE.CreatePolicySet}`)
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
    })

    it('details', () => {
        cy.get('#name').type('my-policy-set', { delay: 200 })
        cy.get('#namespace').click().get('#my-namespace-1').click()
        cy.contains('Next').click()
    })

    it('policies', () => {
        cy.get('#policies').within(() => {
            cy.get('[type="checkbox"]').check()
        })
        cy.contains('Next').click()
    })

    it('placement', () => {
        cy.contains('New placement').click()

        // set label expression key
        cy.get('#key').click()
        cy.get('#region').click()

        // set label expression value
        cy.get('#values').click()
        cy.get('#us-east-1').click()

        cy.contains('Next').click()
    })

    it('review', () => {
        const expected = [
            {
                ...PolicySetType,
                metadata: { name: 'my-policy-set', namespace: 'my-namespace-1' },
                spec: { description: '', policies: ['my-policy-1', 'my-policy-2'] },
            },
            {
                ...PlacementType,
                metadata: { name: 'my-policy-set-placement', namespace: 'my-namespace-1' },
                spec: {
                    predicates: [
                        {
                            requiredClusterSelector: {
                                labelSelector: {
                                    matchExpressions: [{ key: 'region', operator: 'In', values: ['us-east-1'] }],
                                },
                            },
                        },
                    ],
                },
            },
            {
                ...PlacementBindingType,
                metadata: { name: 'my-policy-set-placement', namespace: 'my-namespace-1' },
                placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-policy-set-placement' },
                subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
            },
        ]

        console.log(expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.get('#yaml-editor').should('have.text', expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.contains('Submit').should('be.enabled')
    })
})
