/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import { createNamespace, deleteNamespace } from '../../support/governance/namespace'
import { createPolicy } from '../../support/governance/policy'
import { createPolicySet } from '../../support/governance/policy-set'
import { login } from '../../support/utils/login'
import { randomHex } from '../../support/utils/random-hex'

describe('policy set', () => {
    const policy1Name = `policy-${randomHex()}`
    const policySetName = `policy-set-${randomHex()}`
    const namespace = `cypress-${randomHex()}`
    it('login', () => login())
    it('create namespace', () => createNamespace(namespace))
    it('create policies', () => createPolicy(policy1Name, namespace))
    it('create policy set', () => createPolicySet(policySetName, namespace))
    it('delete namespace', () => deleteNamespace(namespace))
})
