/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Placement, PlacementApiVersionBeta } from '~/resources/placement'
import { getPlacementsForApplicationSet, PlacementLinkList } from './utils'

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
})
