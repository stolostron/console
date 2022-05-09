/* Copyright Contributors to the Open Cluster Management project */
export function createNamespace(namespace: string) {
    cy.exec(`oc create namespace ${namespace}`)
    cy.exec(`oc label namespaces ${namespace} cypress=true`)
}

export function deleteNamespace(namespace: string) {
    cy.exec(`oc delete namespace ${namespace}`)
}
