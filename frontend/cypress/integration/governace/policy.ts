/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import { createPolicy, deletePolicy, editPolicy } from '../../support/policy-utils'

const randomHex = () =>
    `${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padEnd(6, '0')}`

describe('policy', () => {
    const name = `policy-${randomHex()}`
    const namespace = `cypress-${randomHex()}`

    it('create namespace', () => {
        cy.exec(`oc create namespace ${namespace}`)
        cy.exec(`oc label namespaces ${namespace} cypress=true`)
    })

    it('create policy ', () => {
        createPolicy(name, namespace)
    })

    it('edit policy ', () => {
        editPolicy(name)
    })

    it('delete policy ', () => {
        deletePolicy(name)
    })

    it('delete namespace', () => {
        cy.exec(`oc delete namespace ${namespace}`)
    })
})
