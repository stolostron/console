/* Copyright Contributors to the Open Cluster Management project */
import './commands'
import { IResource, setupWebsocketMock } from './websocket-mock'

declare global {
    namespace Cypress {
        interface Chainable {
            multiselect(value: string): Chainable<Element>
            login(): Chainable<void>
            createNamespace(namespace: string): Chainable<void>
            deleteNamespace(namespace: string): Chainable<void>
            mockWait(alias: string): Chainable<void>
            mockResource(resource: IResource): Chainable<void>
            mockCreateResource(resource: IResource, opts?: { alias?: string }): Chainable<void>
        }
    }
}

before(() => {
    Cypress.Cookies.defaults({
        preserve: ['_csrf', '_oauth_proxy', 'acm-access-token-cookie'],
    })
    cy.login()
})

beforeEach(setupWebsocketMock)
