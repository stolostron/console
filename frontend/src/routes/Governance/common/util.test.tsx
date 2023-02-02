/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { resolveExternalStatus } from './util'
import { Policy } from '../../../resources'

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
