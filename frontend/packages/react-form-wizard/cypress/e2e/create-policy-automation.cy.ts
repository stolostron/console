/// <reference types="cypress" />
import YAML from 'yaml'
import { PolicyAutomationType } from '../../wizards/common/resources/IPolicyAutomation'
import { RouteE } from '../../wizards/Routes'

describe('edit policy automation', () => {
    it('displays', () => {
        cy.visit(`http://localhost:3000/${RouteE.CreatePolicyAutomation}`)
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
    })

    it('credentials', () => {
        cy.get('#secret').within(() => {
            cy.get('.pf-v5-c-input-group > div').click()
            cy.get('#my-ansible-creds').click()
        })
    })

    it('jobs', () => {
        cy.get('#job').within(() => {
            cy.get('.pf-v5-c-input-group > div').within(() => {
                cy.contains('Select the ansible job').click()
            })
            cy.get('#job1').click()
        })
    })

    it('extra_vars', () => {
        cy.get('#add-button').click()
        cy.get('#key-1').type('abc')
        cy.get('#value-1').type('123')
    })

    it('mode', () => {
        cy.get('#mode').within(() => {
            cy.get('.pf-v5-c-input-group > div').click()
            cy.get('#Disabled').click()
        })
        cy.contains('Next').click()
    })

    it('review', () => {
        const expected = [
            {
                ...PolicyAutomationType,
                metadata: {
                    name: 'my-policy-policy-automation',
                    namespace: 'my-namespace',
                },
                spec: {
                    policyRef: 'my-policy',
                    mode: 'disabled',
                    automationDef: {
                        name: 'job1',
                        secret: 'my-ansible-creds',
                        type: 'AnsibleJob',
                        extra_vars: {
                            abc: '123',
                        },
                    },
                },
            },
        ]

        cy.get('#yaml-editor').should('have.text', expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.contains('Submit').should('be.enabled')
    })
})
