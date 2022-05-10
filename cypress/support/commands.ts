/* Copyright Contributors to the Open Cluster Management project */

Cypress.Commands.add('login', () => {
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

// before(() => {
//     cy.exec('oc whoami -t').then((result) => {
//         cy.setCookie('acm-access-token-cookie', result.stdout)
//     })
//     cy.exec('curl --insecure https://localhost:3000')
//     // cy.getCookie('acm-access-token-cookie').then((cookie) => {
//     //     if (!cookie) {
//     //         cy.get('button').click()
//     //         cy.contains('kube:admin').click()
//     //         cy.contains('Username').type('kubeadmin')
//     //         cy.contains('Password').type(Cypress.env('PASSWORD'))
//     //         cy.get('.pf-c-button').click()
//     //     }
//     // })
// })

Cypress.Commands.add('multiselect', { prevSubject: 'element' }, (subject: JQuery<HTMLElement>, text: string) => {
    cy.wrap(subject)
        .click()
        .get('.pf-c-check')
        .contains(text)
        .parent()
        .within(() => cy.get('[type="checkbox"]').check())
})
