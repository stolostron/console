/* Copyright Contributors to the Open Cluster Management project */
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
    cy.exec(`oc create namespace ${namespace}`)
    cy.exec(`oc label namespaces ${namespace} cypress=true`)
})

Cypress.Commands.add('deleteNamespace', (namespace: string) => {
    cy.exec(`oc delete namespace ${namespace}`)
})

// Cypress.Commands.add('login', () => {
//     cy.visit(`/multicloud`, { failOnStatusCode: false })
//     cy.getCookie('acm-access-token-cookie').then((cookie) => {
//         if (!cookie) {
//             cy.get('button').click()
//             cy.contains('kube:admin').click()
//             cy.contains('Username').type('kubeadmin')
//             cy.contains('Password').type(Cypress.env('PASSWORD'))
//             cy.get('.pf-c-button').click()
//         }
//     })
// })
