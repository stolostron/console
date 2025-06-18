/// <reference types="cypress" />
import YAML from 'yaml'
import { PolicyAutomationType } from '../../wizards/common/resources/IPolicyAutomation'
import { RouteE } from '../../wizards/Routes'

describe('edit policy automation', () => {
    it('displays', () => {
        cy.visit(`http://localhost:3000/${RouteE.EditPolicyAutomation}`)
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
    })

    it('jobs', () => {
        cy.get('#job').within(() => {
            cy.get('.pf-v5-c-input-group > div').within(() => {
                cy.contains('job1').click()
            })
            cy.get('#job2').click()
        })
    })

    it('mode', () => {
        cy.get('#mode').within(() => {
            cy.get('.pf-v5-c-input-group > div').click()
            cy.get('#Once').click()
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
                    mode: 'once',
                    automationDef: {
                        name: 'job2',
                        secret: 'my-ansible-creds',
                        type: 'AnsibleJob',
                    },
                },
            },
        ]

        cy.get('#yaml-editor').should('have.text', expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.contains('Submit').should('be.enabled')
        cy.contains('Back').should('be.enabled')
        cy.contains('Back').click()
    })

    it('mode', () => {
        cy.get('#mode').within(() => {
            cy.get('.pf-v5-c-input-group > div').click()
            cy.get('#EveryEvent').click()
        })
        cy.get('#spec-delayafterrunseconds-form-group').within(() => {
            cy.get('[aria-label="Plus"]').click().click().click()
        })
        cy.get('#spec-delayafterrunseconds-form-group').within(() => {
            cy.get('[aria-label="Minus"]').click()
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
                    mode: 'everyEvent',
                    automationDef: {
                        name: 'job2',
                        secret: 'my-ansible-creds',
                        type: 'AnsibleJob',
                    },
                    delayAfterRunSeconds: 2,
                },
            },
        ]

        cy.get('#yaml-editor').should('have.text', expected.map((doc) => YAML.stringify(doc)).join('---\n'))
        cy.contains('Submit').should('be.enabled')
    })
})
