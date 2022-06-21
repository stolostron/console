/* Copyright Contributors to the Open Cluster Management project */
import { IResource, websocketMockCreateResourceEvent } from './websocket-mock'

Cypress.Commands.add('multiselect', { prevSubject: 'element' }, (subject: JQuery<HTMLElement>, text: string) => {
    cy.wrap(subject)
        .click()
        .get('.pf-c-check')
        .contains(text)
        .parent()
        .within(() => cy.get('[type="checkbox"]').check())
})

Cypress.Commands.add('login', () => {
    cy.exec('oc whoami -t').then((result) => {
        cy.setCookie('acm-access-token-cookie', result.stdout)
    })
    cy.exec('curl --insecure https://localhost:3000', { timeout: 120000 })
})

Cypress.Commands.add('createNamespace', (namespace: string) => {
    if (!Cypress.env('mock')) {
        cy.exec(`oc create namespace ${namespace}`)
        cy.exec(`oc label namespaces ${namespace} cypress=true`)
    } else {
        websocketMockCreateResourceEvent({ apiVersion: 'v1', kind: 'Namespace', metadata: { name: namespace } })
    }
})

Cypress.Commands.add('deleteNamespace', (namespace: string) => {
    if (!Cypress.env('mock')) {
        cy.exec(`oc delete namespace ${namespace}`)
    }
})

Cypress.Commands.add('mockWait', (alias: string) => {
    if (!Cypress.env('mock')) return
    cy.wait(`@${alias}`)
})

Cypress.Commands.add('mockResource', (resource: IResource) => {
    websocketMockCreateResourceEvent(resource)
})

Cypress.Commands.add('mockCreateResource', (resource: IResource, alias?: string) => {
    if (!Cypress.env('mock')) return

    let url = `/multicloud/apis/${resource.apiVersion}`
    if (resource.metadata.namespace) {
        url += `/namespaces/${resource.metadata.namespace}`
    }
    url += `/${resource.kind.toLowerCase()}s`

    cy.intercept('POST', url + '?dryRun=All', (req) => {
        req.reply({ statusCode: 200 })
        websocketMockCreateResourceEvent(resource)
    })

    const chainable = cy.intercept('POST', url, (req) => {
        // expect(req.body).to.contain(`name:${resource.metadata.name}`)
        req.reply({ statusCode: 201 })
        websocketMockCreateResourceEvent(resource)
    })
    if (alias) {
        chainable.as(alias)
    }
})
