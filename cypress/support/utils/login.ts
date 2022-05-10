/* Copyright Contributors to the Open Cluster Management project */
export function login() {
    cy.exec('oc whoami -t').then((result) => {
        cy.setCookie('acm-access-token-cookie', result.stdout)
    })
    cy.exec('curl --insecure https://localhost:3000', { timeout: 120000 })
}
