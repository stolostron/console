/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { getInformOnlyPolicies, getPolicyRemediation, resolveExternalStatus } from './util'
import { Policy } from '../../../resources'
import { PolicyTableItem } from '../policies/Policies'

describe('Test resolveExternalStatus', () => {
  const mockPolicyWithManagers = (managers: string[]): Policy => {
    return {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {
        name: 'mock-policy',
        namespace: 'test',
        managedFields: managers.map((m) => ({ manager: m })),
      },
      spec: {
        disabled: false,
      },
    }
  }

  test.each([
    { managers: [], expected: false },
    { managers: ['kubectl'], expected: false },
    { managers: ['argocd-controller'], expected: true },
    { managers: ['argocd-application-controller'], expected: true },
    { managers: ['multicluster-operators-subscription'], expected: true },
    { managers: ['multicluster-operators-subscription-controller'], expected: false },
    { managers: ['kubectl', 'argocd-controller'], expected: true },
    { managers: ['multicluster-operators-subscription', 'kubectl'], expected: true },
  ])('resolveExternalStatus with managers $managers should be $expected', ({ managers, expected }) => {
    const policy = mockPolicyWithManagers(managers)
    expect(resolveExternalStatus(policy)).toEqual(expected)
  })
})

describe('Test getPolicyRemediation', () => {
  test('getPolicyRemediation should be enforce when all template-remediations = enforce', () => {
    const rootPolicy: Policy = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {},
      spec: {
        disabled: false,
        remediationAction: 'enforce',
        'policy-templates': [
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-informonly',
              },
              spec: {
                remediationAction: 'informOnly',
              },
            },
          },
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-enforce',
              },
              spec: {
                remediationAction: 'enforce',
              },
            },
          },
        ],
      },
    }
    expect(getPolicyRemediation(rootPolicy)).toEqual('enforce/informOnly')
  })

  test('getPolicyRemediation should be inform/enforce/informOnly', () => {
    const rootPolicy: Policy = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {},
      spec: {
        disabled: false,
        'policy-templates': [
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-informonly',
              },
              spec: {
                remediationAction: 'informOnly',
              },
            },
          },
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-enforce',
              },
              spec: {
                remediationAction: 'enforce',
              },
            },
          },
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-inform',
              },
              spec: {
                remediationAction: 'inform',
              },
            },
          },
        ],
      },
    }
    expect(getPolicyRemediation(rootPolicy)).toEqual('inform/enforce/informOnly')
  })

  test('getPolicyRemediation should be inform/informOnly', () => {
    const rootPolicy: Policy = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'Policy',
      metadata: {},
      spec: {
        disabled: false,
        remediationAction: 'inform',
        'policy-templates': [
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-informonly',
              },
              spec: {
                remediationAction: 'informOnly',
              },
            },
          },
          {
            objectDefinition: {
              apiVersion: 'policy.open-cluster-management.io/v1',
              kind: 'ConfigurationPolicy',
              metadata: {
                name: 'test-policy-enforce',
              },
              spec: {
                remediationAction: 'enforce',
              },
            },
          },
        ],
      },
    }
    expect(getPolicyRemediation(rootPolicy)).toEqual('inform/informOnly')
  })
})

describe('Test getInformOnlyPolicies', () => {
  test('getInformOnlyPolicies should be true', () => {
    const policyItem: PolicyTableItem = {
      policy: {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {},
        spec: {
          disabled: false,
          remediationAction: 'enforce',
          'policy-templates': [
            {
              objectDefinition: {
                apiVersion: 'policy.open-cluster-management.io/v1',
                kind: 'ConfigurationPolicy',
                metadata: {
                  name: 'test-policy-informonly',
                },
                spec: {
                  remediationAction: 'informOnly',
                },
              },
            },
            {
              objectDefinition: {
                apiVersion: 'policy.open-cluster-management.io/v1',
                kind: 'ConfigurationPolicy',
                metadata: {
                  name: 'test-policy-enforce',
                },
                spec: {
                  remediationAction: 'enforce',
                },
              },
            },
          ],
        },
      },
      source: 'Local',
    }
    expect(getInformOnlyPolicies([policyItem])).toBe(true)
  })

  test('getInformOnlyPolicies should be false', () => {
    const policyItem: PolicyTableItem = {
      policy: {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {},
        spec: {
          disabled: false,
          remediationAction: 'enforce',
          'policy-templates': [
            {
              objectDefinition: {
                apiVersion: 'policy.open-cluster-management.io/v1',
                kind: 'ConfigurationPolicy',
                metadata: {
                  name: 'test-policy-informonly',
                },
                spec: {
                  remediationAction: 'inform',
                },
              },
            },
            {
              objectDefinition: {
                apiVersion: 'policy.open-cluster-management.io/v1',
                kind: 'ConfigurationPolicy',
                metadata: {
                  name: 'test-policy-enforce',
                },
                spec: {
                  remediationAction: 'enforce',
                },
              },
            },
          ],
        },
      },
      source: 'Local',
    }
    expect(getInformOnlyPolicies([policyItem])).toBe(false)
  })
})
