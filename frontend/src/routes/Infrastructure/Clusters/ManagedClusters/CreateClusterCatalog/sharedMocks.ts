/* Copyright Contributors to the Open Cluster Management project */

import {
  MultiClusterEngine,
  MultiClusterEngineApiVersion,
  MultiClusterEngineKind,
  ManagedClusterAddOn,
} from '../../../../../resources'

export const mockMultiClusterEngine: MultiClusterEngine = {
  apiVersion: MultiClusterEngineApiVersion,
  kind: MultiClusterEngineKind,
  spec: {
    availabilityConfig: 'High',
    imagePullSecret: 'multiclusterhub-operator-pull-secret',
    overrides: {
      components: [
        { enabled: true, name: 'hypershift-local-hosting' },
        {
          enabled: true,
          name: 'hypershift',
        },
      ],
    },
    targetNamespace: 'multicluster-engine',
    tolerations: [],
  },
  metadata: {
    name: 'multiclusterengine',
    generation: 2,
  },
  status: {
    conditions: [
      {
        reason: 'ManagedClusterAddOnLeaseUpdated',
        status: 'True',
      },
    ],
  },
}

export const mockMultiClusterEngineWithHypershiftDisabled: MultiClusterEngine = {
  ...mockMultiClusterEngine,
  spec: {
    ...mockMultiClusterEngine.spec,
    overrides: {
      ...mockMultiClusterEngine.spec?.overrides,
      components: [
        { enabled: false, name: 'hypershift-local-hosting' },
        { enabled: false, name: 'hypershift' },
      ],
    },
  },
} as MultiClusterEngine

export const mockManagedClusterAddOn: Map<string, ManagedClusterAddOn[]> = new Map([
  [
    'local-cluster',
    [
      {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ManagedClusterAddOn',
        metadata: {
          name: 'hypershift-addon',
          namespace: 'local-cluster',
        },
        status: {
          conditions: [
            {
              lastTransitionTime: undefined,
              message: 'application-manager add-on is available.',
              reason: 'ManagedClusterAddOnLeaseUpdated',
              status: 'True',
              type: 'Available',
            },
          ],
        },
      } as ManagedClusterAddOn,
    ],
  ],
])
