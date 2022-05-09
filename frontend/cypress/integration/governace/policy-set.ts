/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import { createNamespace, deleteNamespace } from '../../support/governance/namespace'
import { createPolicy } from '../../support/governance/policy'
import { createPolicySet } from '../../support/governance/policy-set'
import { randomHex } from '../../support/utils/random-hex'

describe('policy set', () => {
    const policy1Name = `policy-${randomHex()}`
    const policySetName = `policy-set-${randomHex()}`
    const namespace = `cypress-${randomHex()}`

    it('create namespace', () => {
        createNamespace(namespace)
    })

    it('create policies', () => {
        createPolicy(policy1Name, namespace)
    })

    it('create policy set', () => {
        createPolicySet(policySetName, namespace)
    })

    it('delete namespace', () => {
        deleteNamespace(namespace)
    })
})
