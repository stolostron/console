/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { RecoilRoot } from 'recoil' // eslint-disable-line @typescript-eslint/no-restricted-imports
import {
  ansibleJobState,
  clusterImageSetsState,
  agentMachinesState,
  agentsState,
  agentClusterInstallsState,
} from '../../../../../atoms' // eslint-disable-line @typescript-eslint/no-restricted-imports
import { NodePool } from '../../../../../resources'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { Provider } from '../../../../../ui-components'
import { DistributionField } from './DistributionField'

const baseCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'Test Cluster',
  namespace: 'test-ns',
  uid: 'uid-1234',
  status: ClusterStatus.ready,
  provider: Provider.aws,
  distribution: {
    ocp: {
      version: '4.14.6',
      availableUpdates: ['4.14.7', '4.15.0'],
      desiredVersion: '4.14.6',
      upgradeFailed: false,
    },
    displayVersion: 'OpenShift 4.14.6',
    isManagedOpenShift: false,
    upgradeInfo: {
      isUpgrading: false,
      isReadyUpdates: false,
      upgradePercentage: undefined,
      upgradeFailed: false,
      hooksInProgress: false,
      hookFailed: false,
      posthookDidNotRun: false,
      latestJob: {},
      currentVersion: '4.14.6',
      desiredVersion: '4.14.7',
      availableUpdates: ['4.14.7', '4.15.0'],
      isReadySelectChannels: false,
      isSelectingChannel: false,
      isUpgradeCuration: false,
    },
  },
  labels: {},
  consoleURL: 'https://console.test-cluster.example.com',
  hasAutomationTemplate: false,
  hive: { isHibernatable: false },
  isHive: false,
  isManaged: true,
  isCurator: false,
  isHostedCluster: false,
  isRegionalHubCluster: false,
  owner: {},
  isSNOCluster: false,
  isHypershift: false,
}

const readyNodePool: NodePool = {
  apiVersion: 'hypershift.openshift.io/v1beta1',
  kind: 'NodePool',
  metadata: { name: 'np-1', namespace: 'clusters' },
  spec: {
    clusterName: 'test-cluster',
    management: { upgradeType: 'Replace' },
    platform: {
      type: 'AWS',
      aws: {
        instanceType: 'm5.xlarge',
        instanceProfile: 'managed-node',
        rootVolume: { size: 120, type: 'gp3' },
        securityGroups: [],
        subnet: { id: 'subnet-abc' },
      },
    },
    release: { image: 'quay.io/openshift-release-dev/ocp-release:4.14.5-x86_64' },
    replicas: 3,
  },
  status: {
    version: '4.14.5',
    conditions: [{ type: 'Ready', status: 'True', reason: 'AsExpected', message: '' }],
  },
}

const RecoilDecorator = (Story: React.ComponentType) => (
  <RecoilRoot
    initializeState={({ set }) => {
      set(ansibleJobState, [])
      set(clusterImageSetsState, [])
      set(agentMachinesState, [])
      set(agentsState, [])
      set(agentClusterInstallsState, [])
    }}
  >
    <Story />
  </RecoilRoot>
)

const meta: Meta<typeof DistributionField> = {
  title: 'Infrastructure/Clusters/ManagedClusters/DistributionField',
  component: DistributionField,
  parameters: { layout: 'padded' },
  decorators: [RecoilDecorator],
}

export default meta
type Story = StoryObj<typeof meta>

export const DefaultVersion: Story = {
  args: {
    cluster: { ...baseCluster },
  },
}

export const NoDistribution: Story = {
  args: {
    cluster: { ...baseCluster, distribution: undefined },
  },
}

export const ClusterNotReady: Story = {
  args: {
    cluster: {
      ...baseCluster,
      status: ClusterStatus.offline,
    },
  },
}

export const MicroShift: Story = {
  args: {
    cluster: {
      ...baseCluster,
      provider: Provider.microshift,
      microshiftDistribution: { version: '4.16.0' },
    },
  },
}

export const UpgradeAvailable: Story = {
  args: {
    cluster: {
      ...baseCluster,
      isHostedCluster: false,
      isHypershift: false,
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isReadyUpdates: true,
          availableUpdates: ['4.14.7', '4.15.0', '4.15.1'],
        },
      },
    },
  },
}

export const UpgradeAvailableHypershift: Story = {
  args: {
    cluster: {
      ...baseCluster,
      isHypershift: true,
      isHostedCluster: true,
      hypershift: {
        agent: false,
        hostingNamespace: 'clusters',
        secretNames: [],
        nodePools: [readyNodePool as any],
      },
      distribution: {
        ...baseCluster.distribution!,
        ocp: {
          ...baseCluster.distribution!.ocp!,
          version: '4.14.6',
        },
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isReadyUpdates: false,
          versionAvailableUpdates: [
            { version: '4.14.7', image: 'quay.io/openshift-release-dev/ocp-release:4.14.7-x86_64' },
            { version: '4.15.0', image: 'quay.io/openshift-release-dev/ocp-release:4.15.0-x86_64' },
          ],
        },
      },
    },
    resource: 'managedclusterpage',
  },
}

export const UpgradeAvailableHypershiftNodepool: Story = {
  args: {
    cluster: {
      ...baseCluster,
      isHypershift: true,
      isHostedCluster: true,
      hypershift: {
        agent: false,
        hostingNamespace: 'clusters',
        secretNames: [],
        nodePools: [readyNodePool as any],
      },
      distribution: {
        ...baseCluster.distribution!,
        ocp: {
          ...baseCluster.distribution!.ocp!,
          version: '4.14.6',
        },
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isReadyUpdates: false,
        },
      },
    },
    nodepool: readyNodePool,
    resource: 'nodepool',
  },
}

export const UpgradeFailed: Story = {
  args: {
    cluster: {
      ...baseCluster,
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          upgradeFailed: true,
          desiredVersion: '4.15.0',
        },
      },
    },
  },
}

export const UpgradeInProgressOCP: Story = {
  args: {
    cluster: {
      ...baseCluster,
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isUpgrading: true,
          desiredVersion: '4.15.0',
          upgradePercentage: '45%',
        },
      },
    },
  },
}

export const UpgradeInProgressHypershift: Story = {
  args: {
    cluster: {
      ...baseCluster,
      isHypershift: true,
      isHostedCluster: true,
      hypershift: {
        agent: false,
        hostingNamespace: 'clusters',
        secretNames: [],
        nodePools: [],
        isUpgrading: true,
        upgradePercentage: '60%',
      },
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isUpgrading: false,
        },
      },
    },
    hostedCluster: {
      apiVersion: 'hypershift.openshift.io/v1beta1',
      kind: 'HostedCluster',
      metadata: { name: 'test-cluster', namespace: 'clusters' },
      spec: {
        release: { image: 'quay.io/openshift-release-dev/ocp-release:4.15.0-x86_64' },
        channel: 'stable-4.15',
      },
    } as any,
  },
}

export const PosthookDidNotRun: Story = {
  args: {
    cluster: {
      ...baseCluster,
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          posthookDidNotRun: true,
        },
      },
    },
  },
}

export const AnsiblePrehookInProgress: Story = {
  args: {
    cluster: {
      ...baseCluster,
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isUpgradeCuration: true,
          hooksInProgress: true,
          latestJob: { step: 'prehook' as any },
        },
      },
    },
  },
}

export const AnsiblePosthookFailed: Story = {
  args: {
    cluster: {
      ...baseCluster,
      distribution: {
        ...baseCluster.distribution!,
        upgradeInfo: {
          ...baseCluster.distribution!.upgradeInfo!,
          isUpgradeCuration: true,
          hookFailed: true,
          prehooks: { hasHooks: true, inProgress: false, success: true, failed: false },
          posthooks: { hasHooks: true, inProgress: false, success: false, failed: true },
          latestJob: {
            step: 'posthook' as any,
            conditionMessage: 'Posthook job timed out after 900s',
          },
        },
      },
    },
  },
}
