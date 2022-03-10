/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

describe('cleanup', () => {
    it('oc delete namespace cypress', () => {
        cy.exec('oc delete namespace cypress')
    })
})
