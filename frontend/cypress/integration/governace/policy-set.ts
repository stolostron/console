/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import { createPolicy, createPolicySet } from '../../support/policy-utils'

const randomHex = () =>
    `${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padEnd(6, '0')}`

describe('create policy set', () => {
    const policy1Name = `policy-${randomHex()}`
    const policy2Name = `policy-${randomHex()}`
    const policySetName = `policy-set-${randomHex()}`
    const namespace = `cypress-${randomHex()}`

    it('create namespace', () => {
        cy.exec(`oc create namespace ${namespace}`)
        cy.exec(`oc label namespaces ${namespace} cypress=true`)
    })

    it('create policies', () => {
        createPolicy(policy1Name, namespace)
        createPolicy(policy2Name, namespace)
    })

    it('create policy set', () => {
        createPolicySet(policySetName, namespace)
    })

    it('delete namespace', () => {
        cy.exec(`oc delete namespace ${namespace}`)
    })
})
