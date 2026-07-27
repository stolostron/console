/* Copyright Contributors to the Open Cluster Management project */
import { Icon, Spinner } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { render, screen } from '@testing-library/react'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { RecoilRoot } from 'recoil'
import NodePoolsProgress, { getNodePoolsStatus, getNodePoolStatus } from './NodePoolsProgress'
import { ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../../resources'
import userEvent from '@testing-library/user-event'
import { ClusterImageSetK8sResource } from '@openshift-assisted/ui-lib/cim'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'

const mockClusterImageSet0: ClusterImageSetK8sResource = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'img4.11.8-x86-64',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.11.8-x86_64',
  },
}

describe('NodePoolsProgress getNodePoolStatus no status', () => {
  it('should return pending when no status exists', async () => {
    const result = getNodePoolStatus({})
    expect(result.type).toBe('pending')
    expect(result.isReady).toBe(false)
  })
})

describe('NodePoolsProgress getNodePoolStatus no conditions', () => {
  it('should return pending when status has no conditions', async () => {
    const result = getNodePoolStatus({ status: {} })
    expect(result.type).toBe('pending')
    expect(result.isReady).toBe(false)
  })
})

describe('NodePoolsProgress getNodePoolStatus conditions empty array', () => {
  it('should return pending when conditions is empty', async () => {
    const result = getNodePoolStatus({ status: { conditions: [] } })
    expect(result.type).toBe('pending')
    expect(result.isReady).toBe(false)
  })
})

describe('NodePoolsProgress getNodePoolStatus no Ready condition', () => {
  it('should return pending when no Ready condition exists', async () => {
    const result = getNodePoolStatus({
      status: {
        conditions: [{ reason: 'AsExpected', message: '', status: 'False', type: 'AutoscalingEnabled' }],
      },
    })
    expect(result.type).toBe('pending')
    expect(result.isReady).toBe(false)
  })
})

describe('NodePoolsProgress getNodePoolStatus Ready false', () => {
  it('should return pending when Ready is False', async () => {
    const result = getNodePoolStatus({
      status: {
        conditions: [{ reason: 'AsExpected', message: '', status: 'False', type: 'Ready' }],
      },
    })
    expect(result.type).toBe('pending')
    expect(result.isReady).toBe(false)
  })
})

describe('NodePoolsProgress getNodePoolStatus Ready true', () => {
  it('should return ok when Ready is True', async () => {
    const result = getNodePoolStatus({
      status: {
        conditions: [{ reason: 'AsExpected', message: '', status: 'True', type: 'Ready' }],
      },
    })
    expect(result.type).toBe('ok')
    expect(result.isReady).toBe(true)
    expect(result.statusText).toBe('Ready')
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
  it('should return spinner when any nodepool is pending', async () => {
    expect(getNodePoolsStatus(nps)).toEqual(<Spinner size="md" />)
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
  it('should return success icon when all nodepools ready', async () => {
    expect(getNodePoolsStatus(nps)).toEqual(
      <Icon status="success">
        <CheckCircleIcon />
      </Icon>
    )
  })
})

describe('NodePoolsProgress getNodePoolsStatus error', () => {
  const nps: any = [
    {
      metadata: { name: 'np1', namespace: 'np1' },
      status: {
        conditions: [
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'ValidReleaseImage', status: 'False', reason: 'InvalidImage', message: 'Bad image' },
        ],
      },
    },
    {
      metadata: { name: 'np2', namespace: 'np2' },
      status: {
        conditions: [{ type: 'Ready', status: 'True', reason: 'AsExpected' }],
      },
    },
  ]
  it('should return danger icon when any nodepool has error', async () => {
    expect(getNodePoolsStatus(nps)).toEqual(
      <Icon status="danger">
        <ExclamationCircleIcon />
      </Icon>
    )
  })
})

describe('NodePoolsProgress getNodePoolsStatus warning', () => {
  const nps: any = [
    {
      metadata: { name: 'np1', namespace: 'np1' },
      status: {
        conditions: [
          { type: 'Ready', status: 'True', reason: 'AsExpected' },
          { type: 'AllNodesHealthy', status: 'False', reason: 'Unhealthy', message: 'Node unhealthy' },
        ],
      },
    },
    {
      metadata: { name: 'np2', namespace: 'np2' },
      status: {
        conditions: [{ type: 'Ready', status: 'True', reason: 'AsExpected' }],
      },
    },
  ]
  it('should return warning icon when any nodepool has warning', async () => {
    expect(getNodePoolsStatus(nps)).toEqual(
      <Icon status="warning">
        <ExclamationTriangleIcon />
      </Icon>
    )
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
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={{}} />}>
              <Route
                path="*"
                element={<NodePoolsProgress nodePools={nodePools} clusterImages={[mockClusterImageSet0]} />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
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
