/// <reference types="cypress" />
import YAML from 'yaml'
import { PlacementApiGroup, PlacementKind, PlacementType } from '../../wizards/common/resources/IPlacement'
import { PlacementBindingType } from '../../wizards/common/resources/IPlacementBinding'
import { PolicySetApiGroup, PolicySetKind, PolicySetType } from '../../wizards/common/resources/IPolicySet'
import { RouteE } from '../../wizards/Routes'

describe('edit policy set', () => {
    it('displays', () => {
        cy.visit(`http://localhost:3000/${RouteE.EditPolicySet1}`)
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
    })

    it('details', () => {
        // cy.get('#name').should('be.disabled')
        cy.get('#name').should('have.attr', 'readonly')
        // cy.get('#namespace').should('be.disabled')
        cy.contains('Next').click()
    })

    it('policies', () => {
        cy.get('#policies').within(() => {
            cy.get('[type="checkbox"]').check()
        })
        cy.contains('Next').click()
    })

    it('placement', () => {
        cy.contains('Next').click()
    })

    it('review', () => {
        const expected = [
            {
                ...PolicySetType,
                metadata: { name: 'my-policy-set', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
                spec: { policies: ['my-policy-1', 'my-policy-2', 'my-policy-1000'] },
            },
            {
                ...PlacementType,
                metadata: { name: 'my-policy-set-placement-1', namespace: 'my-namespace-1', uid: '00000000-0000-0000-0000-000000000000' },
                spec: {
                    clusterSets: ['my-cluster-set-1'],
                    predicates: [
                        {
                            requiredClusterSelector: {
                                labelSelector: {
                                    matchExpressions: [
                                        { key: 'cloud', operator: 'In', values: ['Microsoft'] },
                                        { key: 'vendor', operator: 'In', values: ['OpenShift'] },
                                        { key: 'region', operator: 'In', values: ['east', 'west'] },
                                        { key: 'environment', operator: 'NotIn', values: ['Production'] },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
            {
                ...PlacementBindingType,
                metadata: {
                    name: 'my-policy-set-placement-1-binding',
                    namespace: 'my-namespace-1',
                    uid: '00000000-0000-0000-0000-000000000000',
                },
                placementRef: { apiGroup: PlacementApiGroup, kind: PlacementKind, name: 'my-policy-set-placement-1' },
                subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
            },
        ]

        cy.get('#yaml-editor').should('have.text', expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.contains('Submit').should('be.enabled')
    })
})
