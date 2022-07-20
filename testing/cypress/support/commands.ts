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
    if (Cypress.env('mock')) return

    cy.exec('oc whoami -t').then((result) => {
        cy.setCookie('acm-access-token-cookie', result.stdout)
    })
    cy.exec('curl --insecure https://localhost:3000', { timeout: 120000 })
})

Cypress.Commands.add('navigate', (nav: string, subNav?: string) => {
    cy.get('#page-sidebar').then((c) => {
        if (c.hasClass('pf-m-collapsed')) {
            cy.get('#nav-toggle').click()
        }
    })
    cy.get(`#${nav}`).click()
    if (subNav) {
        cy.get(`#${subNav}`).click()
    }
    cy.get('#page-sidebar').then((c) => {
        if (!c.hasClass('pf-m-collapsed')) {
            cy.get('#nav-toggle').click()
        }
    })
})
