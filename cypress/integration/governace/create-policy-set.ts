/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import crypto from 'crypto'
import { CyHttpMessages } from 'cypress/types/net-stubbing'

describe('create policy set', () => {
    const namespace: string = `cypress-${crypto.randomBytes(4).toString('hex')}`
    const name = `cypress-${crypto.randomBytes(4).toString('hex')}`

    const sid = 'qKNAdUvgaMqOq4-ZAAAf'
    const mockedPollingQueue: any[] = [
        `0{"sid":"${sid}","upgrades":[""],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}`,
        `40{"sid":"${sid}"}`,
    ]

    beforeEach(() => {
        if (process.env.CYPRESS_MODE === 'mock') {
            cy.intercept({ method: 'POST', url: '/socket.io/?*' }, (req: CyHttpMessages.IncomingHttpRequest) => {
                req.reply('ok')
            })
            cy.intercept({ method: 'GET', url: '/socket.io/?*' }, (req: CyHttpMessages.IncomingHttpRequest) => {
                async function handleResponse() {
                    let count = 20 * 1000
                    while (true) {
                        if (mockedPollingQueue.length) {
                            const pollItem = mockedPollingQueue.shift()
                            switch (typeof pollItem) {
                                case 'string':
                                    req.reply(pollItem)
                                    break
                                case 'object':
                                    req.reply('42' + JSON.stringify(pollItem))
                                    break
                            }

                            break
                        }
                        await new Promise((resolve) => setTimeout(resolve, 500))
                        count -= 500
                        if (count == 0) {
                            req.reply('2')
                            break
                        }
                    }
                }

                return handleResponse()
            })
        }
    })

    before(() => {
        cy.createNamespace(namespace)
        mockedPollingQueue.push(['ADDED', { apiVersion: 'v1', kind: 'Namespace', metadata: { name: namespace } }])
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
        cy.mockCreateResource({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: namespace } })
        cy.contains('Submit').click()
    })

    it('policy set page should show created policy set', () => {
        cy.contains('Governance')
        cy.contains('Policy sets')
        cy.contains(name)
    })
})
