/* Copyright Contributors to the Open Cluster Management project */

import { Spinner } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { render, screen } from '@testing-library/react'
import * as CIM from '@openshift-assisted/ui-lib/cim'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { RecoilRoot } from 'recoil'
import NodePoolsProgress, { getNodePoolsStatus, getNodePoolStatus } from './NodePoolsProgress'
import { ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../../resources'
import userEvent from '@testing-library/user-event'

const t = (string: string) => {
  return string
}

const mockClusterImageSet0: CIM.ClusterImageSetK8sResource = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'img4.11.8-x86-64',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.11.8-x86_64',
  },
}

const resultPending = {
  icon: <InProgressIcon color="currentColor" noVerticalAlign={false} size="sm" />,
  text: 'Not ready',
  type: 'pending',
}

const resultOK = {
  icon: <CheckCircleIcon color="#3e8635" noVerticalAlign={false} size="sm" />,
  text: 'Ready',
  type: 'ok',
}

describe('NodePoolsProgress getNodePoolStatus no status', () => {
  it('should call getNodePoolStatus no status', async () => {
    expect(
      getNodePoolStatus(
        {
          spec: {
            clusterName: 'myNodePool',
            replicas: 1,
            management: { upgradeType: 'InPlace' },
            platform: { type: 'Agent' },
            release: {
              image: 'somerandomimage',
            },
          },
        },
        t
      )
    ).toEqual(resultPending)
  })
})

describe('NodePoolsProgress getNodePoolStatus no conditions', () => {
  it('should call getNodePoolStatus no conditions', async () => {
    expect(
      getNodePoolStatus(
        {
          spec: {
            clusterName: 'myNodePool',
            replicas: 1,
            management: { upgradeType: 'InPlace' },
            platform: { type: 'Agent' },
            release: {
              image: 'somerandomimage',
            },
          },
          status: {},
        },
        t
      )
    ).toEqual(resultPending)
  })
})

describe('NodePoolsProgress getNodePoolStatus conditions empty array', () => {
  it('should call getNodePoolStatus empty array', async () => {
    expect(
      getNodePoolStatus(
        {
          spec: {
            clusterName: 'myNodePool',
            replicas: 1,
            management: { upgradeType: 'InPlace' },
            platform: { type: 'Agent' },
            release: {
              image: 'somerandomimage',
            },
          },
          status: { conditions: [] },
        },
        t
      )
    ).toEqual(resultPending)
  })
})

describe('NodePoolsProgress getNodePoolStatus no Ready condition', () => {
  it('should call getNodePoolStatus no Ready condition', async () => {
    expect(
      getNodePoolStatus(
        {
          spec: {
            clusterName: 'myNodePool',
            replicas: 1,
            management: { upgradeType: 'InPlace' },
            platform: { type: 'Agent' },
            release: {
              image: 'somerandomimage',
            },
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2022-08-31T18:55:05Z',
                observedGeneration: 3,
                reason: 'AsExpected',
                message: '',
                status: 'False',
                type: 'AutoscalingEnabled',
              },
            ],
          },
        },
        t
      )
    ).toEqual(resultPending)
  })
})

describe('NodePoolsProgress getNodePoolStatus Ready false', () => {
  it('should call getNodePoolStatus Ready false', async () => {
    expect(
      getNodePoolStatus(
        {
          spec: {
            clusterName: 'myNodePool',
            replicas: 1,
            management: { upgradeType: 'InPlace' },
            platform: { type: 'Agent' },
            release: {
              image: 'somerandomimage',
            },
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2022-08-31T18:55:05Z',
                observedGeneration: 3,
                reason: 'AsExpected',
                message: '',
                status: 'False',
                type: 'Ready',
              },
            ],
          },
        },
        t
      )
    ).toEqual(resultPending)
  })
})

describe('NodePoolsProgress getNodePoolStatus Ready true', () => {
  it('should call getNodePoolStatus Ready true', async () => {
    expect(
      getNodePoolStatus(
        {
          spec: {
            clusterName: 'myNodePool',
            replicas: 1,
            management: { upgradeType: 'InPlace' },
            platform: { type: 'Agent' },
            release: {
              image: 'somerandomimage',
            },
          },
          status: {
            conditions: [
              {
                lastTransitionTime: '2022-08-31T18:55:05Z',
                observedGeneration: 3,
                reason: 'AsExpected',
                message: '',
                status: 'True',
                type: 'Ready',
              },
            ],
          },
        },
        t
      )
    ).toEqual(resultOK)
  })
})

describe('NodePoolsProgress getNodePoolsStatus pending', () => {
  const nps: any = [
    {
      metadata: {
        uid: '53d85cf8-ad72-4464-892a-f3b8be5162cb',
        name: 'np1',
        namespace: 'np1',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-08-31T18:55:05Z',
            observedGeneration: 3,
            reason: 'AsExpected',
            status: 'False',
            type: 'Ready',
          },
        ],
      },
    },
    {
      metadata: {
        name: 'np2',
        namespace: 'np2',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-08-31T18:55:05Z',
            observedGeneration: 3,
            reason: 'AsExpected',
            status: 'True',
            type: 'Ready',
          },
        ],
      },
    },
    {
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-08-31T18:55:05Z',
            observedGeneration: 3,
            reason: 'AsExpected',
            status: 'True',
            type: 'Ready',
          },
        ],
      },
    },
  ]
  it('should process nodepools', async () => {
    expect(getNodePoolsStatus(nps, t)).toEqual(<Spinner size="md" />)
  })
})

describe('NodePoolsProgress getNodePoolsStatus ready', () => {
  const nps: any = [
    {
      metadata: {
        name: 'np2',
        namespace: 'np2',
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-08-31T18:55:05Z',
            observedGeneration: 3,
            reason: 'AsExpected',
            status: 'True',
            type: 'Ready',
          },
        ],
      },
    },
  ]
  it('should process nodepools', async () => {
    expect(getNodePoolsStatus(nps, t)).toEqual(<CheckCircleIcon color="#3e8635" />)
  })
})

describe('NodePoolsProgress', () => {
  const nodePools: any = [
    {
      apiVersion: 'hypershift.openshift.io/v1alpha1',
      kind: 'NodePool',
      metadata: {
        annotations: {
          'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
          'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
        },
        creationTimestamp: '2022-08-31T18:55:05Z',
        labels: {
          'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
        },
        name: 'feng-hypershift-test',
        namespace: 'clusters',
        uid: '53d85cf8-ad72-4464-892a-f3b8be5162cb',
      },
      spec: {
        autoScaling: {
          min: 1,
          max: 1,
        },
        clusterName: 'feng-hypershift-test',
        management: {
          autoRepair: true,
          replace: {
            rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
            strategy: 'RollingUpdate',
          },
          upgradeType: 'Replace',
        },
        platform: {
          aws: {
            instanceProfile: 'feng-hypershift-test-mjhpv-worker',
            instanceType: 't3.large',
            rootVolume: { size: 35, type: 'gp3' },
            securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
            subnet: { id: 'subnet-067d3045daf35213d' },
          },
          type: 'AWS',
        },
        release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
        replicas: 1,
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-08-31T19:02:51Z',
            observedGeneration: 1,
            reason: 'AsExpected',
            status: 'True',
            type: 'Ready',
          },
        ],
        version: '4.10.15',
      },
    },
    {
      apiVersion: 'hypershift.openshift.io/v1alpha1',
      kind: 'NodePool',
      metadata: {
        annotations: {
          'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
          'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
        },
        creationTimestamp: '2022-08-31T18:55:05Z',
        labels: {
          'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
        },
        name: 'feng-hypershift-test-false',
        namespace: 'clusters',
      },
      spec: {
        clusterName: 'feng-hypershift-test',
        management: {
          autoRepair: false,
          replace: {
            rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
            strategy: 'RollingUpdate',
          },
          upgradeType: 'Replace',
        },
        platform: {
          aws: {
            instanceProfile: 'feng-hypershift-test-mjhpv-worker',
            instanceType: 't3.large',
            rootVolume: { size: 35, type: 'gp3' },
            securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
            subnet: { id: 'subnet-067d3045daf35213d' },
          },
          type: 'AWS',
        },
        release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
        replicas: 1,
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-08-31T19:02:51Z',
            observedGeneration: 1,
            reason: 'AsExpected',
            type: 'Ready',
          },
        ],
        version: '4.10.15',
      },
    },
  ]
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <RecoilRoot>
        <NodePoolsProgress nodePools={nodePools} clusterImages={[mockClusterImageSet0]} />
      </RecoilRoot>
    )
  })
  it('should show all cluster pool names and button', () => {
    userEvent.click(
      screen.getByRole('button', {
        name: /cluster node pools/i,
      })
    )
    expect(screen.queryByText('feng-hypershift-test')).toBeInTheDocument()
    expect(screen.queryByText('feng-hypershift-test-false')).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /add node pool/i,
      })
    ).toBeTruthy()
  })
})
