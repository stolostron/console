/* Copyright Contributors to the Open Cluster Management project */
/// <reference types="cypress" />

import { createNamespace, deleteNamespace } from '../../support/governance/namespace'
import { createPolicy, deletePolicy, editPolicy } from '../../support/governance/policy'
import { randomHex } from '../../support/utils/random-hex'

describe('policy', () => {
    const name = `policy-${randomHex()}`
    const namespace = `cypress-${randomHex()}`
    it('create namespace', () => createNamespace(namespace))
    it('create policy ', () => createPolicy(name, namespace))
    it('edit policy ', () => editPolicy(name))
    it('delete policy ', () => deletePolicy(name))
    it('delete namespace', () => deleteNamespace(namespace))
})
