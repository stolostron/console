/* Copyright Contributors to the Open Cluster Management project */

import { Button } from '@patternfly/react-core'
import { action } from '@storybook/addon-actions'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
// Storybook decorator must bootstrap Recoil and seed configMapsState; shared-recoil requires an existing provider.
import { RecoilRoot } from 'recoil' // eslint-disable-line @typescript-eslint/no-restricted-imports
import { configMapsState } from '../../../../../atoms' // eslint-disable-line @typescript-eslint/no-restricted-imports
import { ConfigMap, NodePool } from '../../../../../resources'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { HypershiftUpgradeModal } from './HypershiftUpgradeModal'

const supportedVersionsConfigMap: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'supported-versions',
    namespace: 'hypershift',
  },
  data: {
    'supported-versions': JSON.stringify({
      versions: ['4.16', '4.15', '4.14', '4.13'],
    }),
  },
}

const mockClusterName = 'prod-hosted-cluster-01-primary-compute-nodes-a1-np-cluster-64chx'

const mockControlPlane: Cluster = {
  name: mockClusterName,
  displayName: 'Production Hosted Cluster 01',
  namespace: 'clusters',
  uid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.14.6',
      availableUpdates: ['4.14.7', '4.15.0', '4.15.1'],
      desiredVersion: '4.14.6',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: {
    'cluster.open-cluster-management.io/clusterset': 'default',
    cloud: 'hypershift',
  },
  nodes: undefined,
  kubeApiServer: 'https://api.prod-hosted-cluster-01.example.com:6443',
  consoleURL: 'https://console-openshift-console.apps.prod-hosted-cluster-01.example.com',
  hasAutomationTemplate: false,
  hive: {
    isHibernatable: true,
    secrets: { installConfig: '' },
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [],
    secretNames: ['prod-hc-01-ssh-key', 'prod-hc-01-pull-secret'],
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  isHostedCluster: true,
  isHypershift: true,
  isSNOCluster: false,
  isRegionalHubCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
}

const mockNodepools: NodePool[] = [
  {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'prod-hosted-cluster-01-worker-pool-1-primary-compute-nodes-a1-np',
      namespace: 'clusters',
    },
    spec: {
      clusterName: mockClusterName,
      management: { upgradeType: 'Replace' },
      platform: {
        type: 'AWS',
        aws: {
          instanceType: 'm5.xlarge',
          instanceProfile: 'openshift-managed-node',
          rootVolume: { size: 120, type: 'gp3' },
          securityGroups: [],
          subnet: { id: 'subnet-0123456789abcdef' },
        },
      },
      release: { image: 'quay.io/openshift-release-dev/ocp-release:4.14.6-x86_64' },
      replicas: 3,
    },
    status: { version: '4.14.5' },
  },
  {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'prod-hosted-cluster-01-worker-pool-2',
      namespace: 'clusters',
    },
    spec: {
      clusterName: mockClusterName,
      management: { upgradeType: 'InPlace' },
      platform: {
        type: 'AWS',
        aws: {
          instanceType: 'm5.2xlarge',
          instanceProfile: 'openshift-managed-node',
          rootVolume: { size: 120, type: 'gp3' },
          securityGroups: [],
          subnet: { id: 'subnet-fedcba9876543210' },
        },
      },
      release: { image: 'quay.io/openshift-release-dev/ocp-release:4.14.6-x86_64' },
      replicas: 2,
    },
    status: { version: '4.14.4' },
  },
  {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'prod-hosted-cluster-01-infra-pool',
      namespace: 'clusters',
    },
    spec: {
      clusterName: mockClusterName,
      management: { upgradeType: 'Replace' },
      platform: {
        type: 'AWS',
        aws: {
          instanceType: 'm5.large',
          instanceProfile: 'openshift-managed-node',
          rootVolume: { size: 100, type: 'gp3' },
          securityGroups: [],
          subnet: { id: 'subnet-abcdef0123456789' },
        },
      },
      release: { image: 'quay.io/openshift-release-dev/ocp-release:4.14.6-x86_64' },
      replicas: 2,
    },
    status: { version: '4.14.6' },
  },
]

const mockAvailableUpdates: Record<string, string> = {
  '4.14.7': 'quay.io/openshift-release-dev/ocp-release:4.14.7-x86_64',
  '4.14.8': 'quay.io/openshift-release-dev/ocp-release:4.14.8-x86_64',
  '4.15.0': 'quay.io/openshift-release-dev/ocp-release:4.15.0-x86_64',
  '4.15.1': 'quay.io/openshift-release-dev/ocp-release:4.15.1-x86_64',
  '4.15.2': 'quay.io/openshift-release-dev/ocp-release:4.15.2-x86_64',
  '4.16.0': 'quay.io/openshift-release-dev/ocp-release:4.16.0-x86_64',
}

const RecoilDecorator = (Story: React.ComponentType<any>) => (
  <RecoilRoot
    initializeState={({ set }) => {
      set(configMapsState, [supportedVersionsConfigMap])
    }}
  >
    <Story />
  </RecoilRoot>
)

const meta: Meta<typeof HypershiftUpgradeModal> = {
  title: 'Infrastructure/Clusters/ManagedClusters/HypershiftUpgradeModal',
  component: HypershiftUpgradeModal,
  parameters: {
    layout: 'padded',
  },
  decorators: [RecoilDecorator],
  argTypes: {
    open: { control: 'boolean', description: 'Whether the modal is open' },
    close: { action: 'close', description: 'Called when the modal is closed' },
  },
}

export default meta

type Story = StoryObj<typeof meta>

function HypershiftUpgradeModalWithToggle(args: {
  open?: boolean
  close?: () => void
  controlPlane: Cluster
  nodepools: NodePool[]
  availableUpdates: Record<string, string>
}) {
  const [open, setOpen] = useState(args.open ?? true)
  const handleClose = () => {
    setOpen(false)
    args.close?.()
  }
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary">
        Open upgrade modal
      </Button>
      <HypershiftUpgradeModal {...args} open={open} close={handleClose} />
    </>
  )
}

export const Default: Story = {
  args: {
    open: true,
    close: action('close'),
    controlPlane: mockControlPlane,
    nodepools: mockNodepools,
    availableUpdates: mockAvailableUpdates,
  },
  render: (args) => (
    <HypershiftUpgradeModalWithToggle
      {...args}
      controlPlane={args.controlPlane}
      nodepools={args.nodepools}
      availableUpdates={args.availableUpdates}
    />
  ),
}

export const SingleNodePool: Story = {
  args: {
    open: true,
    close: action('close'),
    controlPlane: { ...mockControlPlane, displayName: 'Single pool cluster' },
    nodepools: [mockNodepools[0]],
    availableUpdates: mockAvailableUpdates,
  },
  render: (args) => (
    <HypershiftUpgradeModalWithToggle
      {...args}
      controlPlane={args.controlPlane}
      nodepools={args.nodepools}
      availableUpdates={args.availableUpdates}
    />
  ),
}

export const NoAvailableUpdates: Story = {
  args: {
    open: true,
    close: action('close'),
    controlPlane: mockControlPlane,
    nodepools: mockNodepools,
    availableUpdates: {},
  },
  render: (args) => (
    <HypershiftUpgradeModalWithToggle
      {...args}
      controlPlane={args.controlPlane}
      nodepools={args.nodepools}
      availableUpdates={args.availableUpdates}
    />
  ),
}

export const ClosedByDefault: Story = {
  args: {
    open: false,
    close: action('close'),
    controlPlane: mockControlPlane,
    nodepools: mockNodepools,
    availableUpdates: mockAvailableUpdates,
  },
  render: (args) => (
    <HypershiftUpgradeModalWithToggle
      {...args}
      open={false}
      controlPlane={args.controlPlane}
      nodepools={args.nodepools}
      availableUpdates={args.availableUpdates}
    />
  ),
}
