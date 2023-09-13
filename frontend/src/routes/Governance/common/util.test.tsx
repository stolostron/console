/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { hasInformOnlyPolicies, getPolicyRemediation, resolveExternalStatus } from './util'
import { PolicyTableItem } from '../policies/Policies'
import { Policy, PolicyTemplate, REMEDIATION_ACTION } from '../../../resources'
import { cloneDeep } from 'lodash'

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
    expect(getPolicyRemediation(rootPolicy, [rootPolicy])).toEqual('enforce/informOnly')
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
    expect(getPolicyRemediation(rootPolicy, [rootPolicy])).toEqual('inform/enforce/informOnly')
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
    expect(getPolicyRemediation(rootPolicy, [rootPolicy])).toEqual('inform/informOnly')
  })

  const policy: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {},
    spec: {
      disabled: false,
      remediationAction: 'enforce',
    },
  }
  function getPolicyRemediationTestSetting(remediationActions: (string | undefined)[]) {
    const rootPolicy = cloneDeep(policy)
    const clusterA = cloneDeep(policy)
    const clusterB = cloneDeep(policy)
    const clusterC = cloneDeep(policy)
    rootPolicy.spec.remediationAction = remediationActions[0]
    clusterA.spec.remediationAction = remediationActions[1]
    clusterB.spec.remediationAction = remediationActions[2]
    clusterC.spec.remediationAction = remediationActions[3]
    return getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])
  }
  describe('Should be enforce when Root policy remediation is enforce', () => {
    // first element is expected and then rootpolicy, clusterA, clusterB, clusterC respectively
    test.each([
      [
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
      ],
      [
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
      ],
    ])('getPolicyRemediation with policies should be $expected', (expected, ...rest) => {
      expect(getPolicyRemediationTestSetting(rest)).toEqual(expected)
    })
  })
  describe('Should be inform/enforce (overridden) when Root policy remediation is inform and mixed cluster remediations', () => {
    test.each([
      [
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.INFORM,
      ],
      [
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
      ],
      [
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.INFORM,
      ],
    ])('getPolicyRemediation with policies should be $expected', (expected, ...rest) => {
      expect(getPolicyRemediationTestSetting(rest)).toEqual(expected)
    })
  })
  describe('Should be enforce (overridden) when Root policy = inform or undefined and all clusters = enforce', () => {
    test.each([
      [
        REMEDIATION_ACTION.ENFORCE_OVERRIDDEN,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
        REMEDIATION_ACTION.ENFORCE,
      ],
    ])('getPolicyRemediation with policies should be $expected', (expected, ...rest) => {
      expect(getPolicyRemediationTestSetting(rest)).toEqual(expected)
    })
  })
  describe('Should be inform when Root policy remediation = inform and All cluster remediations = inform', () => {
    test.each([
      [
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.INFORM,
        REMEDIATION_ACTION.INFORM,
      ],
    ])('getPolicyRemediation with policies should be $expected', (expected, ...rest) => {
      expect(getPolicyRemediationTestSetting(rest)).toEqual(expected)
    })
  })
  describe('Should follow template-remediation, all cluster remediations = undefined', () => {
    const rootPolicy = cloneDeep(policy)
    const clusterA = cloneDeep(policy)
    const clusterB = cloneDeep(policy)
    const clusterC = cloneDeep(policy)
    rootPolicy.spec.remediationAction = undefined
    clusterA.spec.remediationAction = undefined
    clusterB.spec.remediationAction = undefined
    clusterC.spec.remediationAction = undefined
    test('getPolicyRemediation should be inform when all template-remediations = inform', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(REMEDIATION_ACTION.INFORM)
    })
    test('getPolicyRemediation should be inform/enforce when template-remediations mixed', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.INFORM_ENFORCE
      )
    })
    test('getPolicyRemediation should be enforce when all template-remediations = enforce', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(REMEDIATION_ACTION.ENFORCE)
    })
  })
  describe('Should be enforce override or enforce, all cluster remediations = ENFORCE (overridden)', () => {
    const rootPolicy = cloneDeep(policy)
    const clusterA = cloneDeep(policy)
    const clusterB = cloneDeep(policy)
    const clusterC = cloneDeep(policy)
    rootPolicy.spec.remediationAction = undefined
    clusterA.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
    clusterB.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
    clusterC.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
    test('getPolicyRemediation should be inform when all template-remediations = inform', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be inform/enforce when template-remediations mixed', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be enforce when all template-remediations = enforce', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(REMEDIATION_ACTION.ENFORCE)
    })
    // This test should be the last in this describe
    test.each([
      [
        // rootpolicy remediation
        REMEDIATION_ACTION.INFORM,
        // 1 propagated remediation
        REMEDIATION_ACTION.INFORM,
        // 2 propagated remediation
        REMEDIATION_ACTION.INFORM,
        // 2 propagated remediation
        REMEDIATION_ACTION.INFORM,
      ],
      [
        // rootpolicy remediation
        REMEDIATION_ACTION.INFORM,
        // 1 propagated remediation
        REMEDIATION_ACTION.ENFORCE,
        // 2 propagated remediation
        REMEDIATION_ACTION.INFORM,
        // 2 propagated remediation
        REMEDIATION_ACTION.INFORM,
      ],
      [
        // rootpolicy remediation
        undefined,
        // 1 propagated remediation
        REMEDIATION_ACTION.ENFORCE,
        // 2 propagated remediation
        REMEDIATION_ACTION.ENFORCE,
        // 2 propagated remediation
        REMEDIATION_ACTION.ENFORCE,
      ],
      [
        // rootpolicy remediation
        undefined,
        // 1 propagated remediation
        undefined,
        // 2 propagated remediation
        REMEDIATION_ACTION.ENFORCE,
        // 2 propagated remediation
        REMEDIATION_ACTION.ENFORCE,
      ],
    ])('getPolicyRemediation should be informOnly when All template-remediations = informOnly', (...rest) => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM_ONLY,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM_ONLY,
            },
          },
        },
      ]
      rootPolicy.spec.remediationAction = rest[0]
      clusterA.spec.remediationAction = rest[1]
      clusterB.spec.remediationAction = rest[2]
      clusterC.spec.remediationAction = rest[3]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(REMEDIATION_ACTION.INFORM_ONLY)
    })
  })
  describe('Should be inform/enforce overriden or enforce, some cluster remediations = ENFORCE (overridden)', () => {
    const rootPolicy = cloneDeep(policy)
    const clusterA = cloneDeep(policy)
    const clusterB = cloneDeep(policy)
    const clusterC = cloneDeep(policy)
    rootPolicy.spec.remediationAction = undefined
    clusterA.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
    clusterB.spec.remediationAction = undefined
    clusterC.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
    test('getPolicyRemediation should be inform when all template-remediations = inform', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be inform/enforce when template-remediations mixed', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be enforce when all template-remediations = enforce', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(REMEDIATION_ACTION.ENFORCE)
    })
  })
  describe('Should be inform/enforce overriden or enforce, some cluster remediations = ENFORCE (overridden)', () => {
    const rootPolicy = cloneDeep(policy)
    const clusterA = cloneDeep(policy)
    const clusterB = cloneDeep(policy)
    const clusterC = cloneDeep(policy)
    rootPolicy.spec.remediationAction = undefined
    clusterA.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
    clusterB.spec.remediationAction = undefined
    clusterC.spec.remediationAction = undefined
    test('getPolicyRemediation should be inform when all template-remediations = inform', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be inform/enforce when template-remediations mixed', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(
        REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be enforce when all template-remediations = enforce', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
      ]
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual(REMEDIATION_ACTION.ENFORCE)
    })
  })
  describe('Should informOnly showed, all cluster remediations = ENFORCE (overridden)', () => {
    const rootPolicy = cloneDeep(policy)
    const clusterA = cloneDeep(policy)
    const clusterB = cloneDeep(policy)
    const clusterC = cloneDeep(policy)
    test('getPolicyRemediation should be enforce/informOnly override', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM_ONLY,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
      ]
      rootPolicy.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      clusterA.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
      clusterB.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB, clusterC])).toEqual('enforce/informOnly')
    })
    test('getPolicyRemediation should be inform/enforce when template-remediations mixed', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.ENFORCE,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM_ONLY,
            },
          },
        },
      ]
      rootPolicy.spec.remediationAction = REMEDIATION_ACTION.INFORM
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      clusterA.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
      clusterB.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB])).toEqual(
        REMEDIATION_ACTION.INFORMONLY_ENFORCE_OVERRIDDEN
      )
    })
    test('getPolicyRemediation should be inform/enfoce/informOnly (overriden)', () => {
      const rootPolicyTemplates: PolicyTemplate[] = [
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c1' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM,
            },
          },
        },
        {
          objectDefinition: {
            apiVersion: 'v1',
            kind: 'configurationpolicy',
            metadata: { name: 'c2' },
            spec: {
              remediationAction: REMEDIATION_ACTION.INFORM_ONLY,
            },
          },
        },
      ]
      rootPolicy.spec.remediationAction = REMEDIATION_ACTION.INFORM
      rootPolicy.spec['policy-templates'] = rootPolicyTemplates
      clusterA.spec.remediationAction = REMEDIATION_ACTION.ENFORCE
      clusterB.spec.remediationAction = REMEDIATION_ACTION.INFORM
      expect(getPolicyRemediation(rootPolicy, [clusterA, clusterB])).toEqual(
        REMEDIATION_ACTION.INFORM_INFORMONLY_ENFORCE_OVERRIDDEN
      )
    })
  })
})

describe('Test hasInformOnlyPolicies', () => {
  test('hasInformOnlyPolicies should be true', () => {
    const policyItem: PolicyTableItem = {
      policy: {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {},
        remediationResult: 'enforce/informOnly',
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
    expect(hasInformOnlyPolicies([policyItem])).toBe(true)
  })

  test('hasInformOnlyPolicies should be false', () => {
    const policyItem: PolicyTableItem = {
      policy: {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {},
        remediationResult: 'enforce',
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
    expect(hasInformOnlyPolicies([policyItem])).toBe(false)
  })
})
