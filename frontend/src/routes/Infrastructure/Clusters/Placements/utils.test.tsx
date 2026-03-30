/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { PlacementDecision, PlacementDecisionApiVersion, PlacementDecisionKind } from '~/resources/placement-decision'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '~/resources/placement'
import {
  getPlacementsForApplicationSet,
  getPlacementsForCluster,
  PlacementLinkList,
  ClusterLinkList,
  ClusterSetLinkList,
} from './utils'

const placementUidAlpha = 'uid-placement-alpha'
const placementWithUid: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'placement-alpha',
    namespace: 'ns-alpha',
    uid: placementUidAlpha,
  },
  spec: {},
}

const placementDecisionForCluster = (clusterName: string, placementUid: string): PlacementDecision => ({
  apiVersion: PlacementDecisionApiVersion,
  kind: PlacementDecisionKind,
  metadata: {
    name: 'pd-1',
    namespace: 'ns-alpha',
    ownerReferences: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        name: 'placement-alpha',
        uid: placementUid,
      },
    ],
  },
  status: {
    decisions: [{ clusterName, reason: 'Scheduled' }],
  },
})

const mockPlacement1: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: 'Placement',
  metadata: {
    name: 'placement-1',
    namespace: 'placement-1-ns',
  },
  spec: {},
}
const mockPlacement2: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: 'Placement',
  metadata: {
    name: 'placement-2',
    namespace: 'placement-2-ns',
  },
  spec: {},
}
const mockPlacement3: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: 'Placement',
  metadata: {
    name: 'placement-3',
    namespace: 'placement-3-ns',
  },
  spec: {},
}
const mockPlacement4: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: 'Placement',
  metadata: {
    name: 'placement-4',
    namespace: 'placement-4-ns',
  },
  spec: {},
}

describe('Placement utils', () => {
  describe('getPlacementsForCluster', () => {
    const clusterName = 'managed-cluster-east'

    test('returns empty array when no placement decision selects the cluster', () => {
      expect(
        getPlacementsForCluster(
          clusterName,
          [placementWithUid],
          [placementDecisionForCluster('other-cluster', placementUidAlpha)]
        )
      ).toEqual([])
    })

    test('returns empty array when owner reference uid does not match any placement', () => {
      expect(
        getPlacementsForCluster(
          clusterName,
          [placementWithUid],
          [placementDecisionForCluster(clusterName, 'unknown-uid')]
        )
      ).toEqual([])
    })

    test('returns placements whose uid matches the PlacementDecision owner reference when the cluster is selected', () => {
      expect(
        getPlacementsForCluster(
          clusterName,
          [placementWithUid, mockPlacement1],
          [placementDecisionForCluster(clusterName, placementUidAlpha)]
        )
      ).toEqual([placementWithUid])
    })
  })

  test('getPlacementsForApplicationSet', () => {
    const mockAppSetData = {
      refreshTime: 1774290222745,
      application: {
        name: 'layne-testing',
        namespace: 'openshift-gitops',
        app: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: {
            creationTimestamp: '2026-03-23T15:16:57Z',
            generation: 1,
            name: 'layne-testing',
            namespace: 'openshift-gitops',
            resourceVersion: '413629',
            uid: 'a85e2484-8383-47e0-8504-eb42547a788d',
          },
          spec: {},
          status: {},
        },
        isArgoApp: false,
        isAppSet: true,
        isOCPApp: false,
        isFluxApp: false,
        clusterList: ['weekly-managed'],
        placement: {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: {
            creationTimestamp: '2026-03-23T15:16:57Z',
            generation: 1,
            name: 'layne-testing-placement',
            uid: '52554d53-bab2-41c8-9c65-52f152802d95',
            resourceVersion: '410880',
            namespace: 'openshift-gitops',
          },
          spec: {
            tolerations: [
              {
                key: 'cluster.open-cluster-management.io/unreachable',
                operator: 'Exists',
              },
              {
                key: 'cluster.open-cluster-management.io/unavailable',
                operator: 'Exists',
              },
            ],
            clusterSets: ['default'],
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [
                      {
                        key: 'cloud',
                        operator: 'In',
                        values: ['Amazon'],
                      },
                    ],
                  },
                },
              },
            ],
          },
          status: {
            conditions: [
              {
                type: 'PlacementMisconfigured',
                status: 'False',
                lastTransitionTime: '2026-03-23T15:16:57Z',
                message: 'Placement configurations check pass',
                reason: 'Succeedconfigured',
              },
              {
                type: 'PlacementSatisfied',
                status: 'True',
                lastTransitionTime: '2026-03-23T15:16:57Z',
                message: 'All cluster decisions scheduled',
                reason: 'AllDecisionsScheduled',
              },
            ],
            decisionGroups: [
              {
                clusterCount: 2,
                decisionGroupIndex: 0,
                decisionGroupName: '',
                decisions: ['layne-testing-placement-decision-1'],
              },
            ],
            numberOfSelectedClusters: 2,
          },
        },
        metadata: {
          creationTimestamp: '2026-03-23T15:16:57Z',
          generation: 1,
          name: 'layne-testing',
          namespace: 'openshift-gitops',
          resourceVersion: '413629',
          uid: 'a85e2484-8383-47e0-8504-eb42547a788d',
        },
      },
      appData: {
        subscription: null,
        relatedKinds: [
          'applicationset',
          'placement',
          'cluster',
          'service',
          'deployment',
          'replicaset',
          'pod',
          'endpointslice',
        ],
      },
      topology: {},
    }
    const placements = getPlacementsForApplicationSet(mockAppSetData)
    expect(placements).toMatchSnapshot()
  })

  test('PlacementLinkList display one Placement', () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PlacementLinkList placementsForCluster={[mockPlacement1]} />
        </MemoryRouter>
      </RecoilRoot>
    )
  })

  test('PlacementLinkList display Placements and click show more', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PlacementLinkList placementsForCluster={[mockPlacement1, mockPlacement2, mockPlacement3, mockPlacement4]} />
        </MemoryRouter>
      </RecoilRoot>
    )

    // find and click show more button
    await userEvent.click(screen.getByRole('button', { name: /1 more/i }))

    expect(screen.getByText('placement-4')).toBeInTheDocument()
  })

  describe('ClusterLinkList', () => {
    test('renders dash when clusterNames is empty', () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterLinkList clusterNames={[]} />
          </MemoryRouter>
        </RecoilRoot>
      )
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    test('renders all cluster names when 3 or fewer', () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterLinkList clusterNames={['cluster-a', 'cluster-b']} />
          </MemoryRouter>
        </RecoilRoot>
      )
      expect(screen.getByText('cluster-a,')).toBeInTheDocument()
      expect(screen.getByText('cluster-b')).toBeInTheDocument()
    })

    test('shows first 3 clusters and show more button when more than 3', async () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterLinkList clusterNames={['c1', 'c2', 'c3', 'c4', 'c5']} />
          </MemoryRouter>
        </RecoilRoot>
      )

      expect(screen.getByText('c1,')).toBeInTheDocument()
      expect(screen.getByText('c2,')).toBeInTheDocument()
      expect(screen.getByText('c3')).toBeInTheDocument()
      expect(screen.queryByText('c4')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /2 more/i }))

      expect(screen.getByText('c4,')).toBeInTheDocument()
      expect(screen.getByText('c5')).toBeInTheDocument()
    })

    test('clicking show less collapses the list', async () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterLinkList clusterNames={['c1', 'c2', 'c3', 'c4']} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await userEvent.click(screen.getByRole('button', { name: /1 more/i }))
      expect(screen.getByText('c4')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /show less/i }))
      expect(screen.queryByText('c4')).not.toBeInTheDocument()
    })
  })

  describe('ClusterSetLinkList', () => {
    test('renders dash when clusterSets is empty', () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterSetLinkList clusterSets={[]} />
          </MemoryRouter>
        </RecoilRoot>
      )
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    test('renders all cluster set names when 3 or fewer', () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterSetLinkList clusterSets={['set-a', 'set-b', 'set-c']} />
          </MemoryRouter>
        </RecoilRoot>
      )
      expect(screen.getByText('set-a,')).toBeInTheDocument()
      expect(screen.getByText('set-b,')).toBeInTheDocument()
      expect(screen.getByText('set-c')).toBeInTheDocument()
    })

    test('shows first 3 cluster sets and show more button when more than 3', async () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterSetLinkList clusterSets={['s1', 's2', 's3', 's4', 's5']} />
          </MemoryRouter>
        </RecoilRoot>
      )

      expect(screen.getByText('s1,')).toBeInTheDocument()
      expect(screen.getByText('s2,')).toBeInTheDocument()
      expect(screen.getByText('s3')).toBeInTheDocument()
      expect(screen.queryByText('s4')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /2 more/i }))

      expect(screen.getByText('s4,')).toBeInTheDocument()
      expect(screen.getByText('s5')).toBeInTheDocument()
    })

    test('clicking show less collapses the list', async () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <ClusterSetLinkList clusterSets={['s1', 's2', 's3', 's4']} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await userEvent.click(screen.getByRole('button', { name: /1 more/i }))
      expect(screen.getByText('s4')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /show less/i }))
      expect(screen.queryByText('s4')).not.toBeInTheDocument()
    })
  })
})
