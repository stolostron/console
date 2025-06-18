/// <reference types="cypress" />
import YAML from 'yaml'
import { PlacementBindingType } from '../../wizards/common/resources/IPlacementBinding'
import { PlacementRuleApiGroup, PlacementRuleKind, PlacementRuleType } from '../../wizards/common/resources/IPlacementRule'
import { PolicySetApiGroup, PolicySetKind, PolicySetType } from '../../wizards/common/resources/IPolicySet'
import { RouteE } from '../../wizards/Routes'

describe('create policy set', () => {
    it('displays', () => {
        cy.visit(`http://localhost:3000/${RouteE.CreatePolicySet}`)
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
    })

    it('details', () => {
        cy.get('#name').type('my-policy-set')
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
        cy.get('#add-button').click()
        cy.get('#label-expressions').within(() => {
            cy.get('#key').click().get('#region').click()
            cy.get('#values').multiselect('us-east-1')
        })
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
                ...PlacementRuleType,
                metadata: { name: 'my-policy-set-placement', namespace: 'my-namespace-1' },
                spec: {
                    clusterSelector: {
                        matchExpressions: [{ key: 'region', operator: 'In', values: ['us-east-1'] }],
                    },
                    clusterConditions: [],
                },
            },
            {
                ...PlacementBindingType,
                metadata: { name: 'my-policy-set-placement', namespace: 'my-namespace-1' },
                placementRef: { apiGroup: PlacementRuleApiGroup, kind: PlacementRuleKind, name: 'my-policy-set-placement' },
                subjects: [{ apiGroup: PolicySetApiGroup, kind: PolicySetKind, name: 'my-policy-set' }],
            },
        ]

        cy.get('#yaml-editor').should('have.text', expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.contains('Submit').should('be.enabled')
    })
})
