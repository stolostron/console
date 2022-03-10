/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

describe('setup', () => {
    it('oc delete namespace cypress', () => {
        cy.exec('oc delete namespace cypress || true')
    })

    it('oc create namespace cypress', () => {
        cy.exec('oc create namespace cypress')
    })
})
