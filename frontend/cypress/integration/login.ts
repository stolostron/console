/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

describe('policy', () => {
    it('login', () => {
        cy.visit(`/multicloud`, { failOnStatusCode: false })
        cy.getCookie('acm-access-token-cookie').then((cookie) => {
            if (!cookie) {
                cy.get('button').click()
                cy.contains('kube:admin').click()
                cy.contains('Username').type('kubeadmin')
                cy.contains('Password').type(Cypress.env('PASSWORD'))
                cy.get('.pf-c-button').click()
            }
        })
    })
})
