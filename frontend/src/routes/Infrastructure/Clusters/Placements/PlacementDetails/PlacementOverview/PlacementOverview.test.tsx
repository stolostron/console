/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  placementBindingsState,
  placementDecisionsState,
  policiesState,
  policySetsState,
  gitOpsClustersState,
} from '../../../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockList } from '../../../../../../lib/nock-util'
import { waitForText } from '../../../../../../lib/test-util'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
} from '../../../../../../resources/application-set'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../../../../../../resources/placement'
import {
  PlacementDecision,
  PlacementDecisionApiVersion,
  PlacementDecisionKind,
} from '../../../../../../resources/placement-decision'
import {
  PlacementBinding,
  PlacementBindingApiVersion,
  PlacementBindingKind,
} from '../../../../../../resources/placement-binding'
import { Policy, PolicyApiVersion, PolicyKind } from '../../../../../../resources/policy'
import { PolicySet, PolicySetApiVersion, PolicySetKind } from '../../../../../../resources/policy-set'
import { GitOpsCluster, GitOpsClusterApiVersion, GitOpsClusterKind } from '../../../../../../resources/gitops-cluster'
import { PlacementDetailsContext } from '../PlacementDetails'
import PlacementOverviewPageContent from './PlacementOverview'

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'test-placement',
    namespace: 'default',
    uid: 'uid-placement-1',
  },
  spec: {
    clusterSets: ['cluster-set-1', 'cluster-set-2'],
  },
  status: {
    conditions: [
      {
        type: 'PlacementSatisfied',
        status: 'True',
        lastTransitionTime: '2026-03-23T15:16:57Z',
        message: 'All cluster decisions scheduled',
        reason: 'AllDecisionsScheduled',
      },
      {
        type: 'PlacementMisconfigured',
        status: 'False',
        lastTransitionTime: '2026-03-23T15:16:57Z',
        message: 'Placement configurations check pass',
        reason: 'Succeedconfigured',
      },
    ],
    numberOfSelectedClusters: 5,
  },
}

const mockPlacementDecision: PlacementDecision = {
  apiVersion: PlacementDecisionApiVersion,
  kind: PlacementDecisionKind,
  metadata: {
    name: 'test-placement-decision-1',
    namespace: 'default',
    uid: 'uid-pd-1',
    ownerReferences: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        name: 'test-placement',
        uid: 'uid-placement-1',
      },
    ],
  },
  status: {
    decisions: [
      { clusterName: 'cluster-east', reason: 'Scheduled' },
      { clusterName: 'cluster-west', reason: 'Scheduled' },
    ],
  },
}

const mockPlacementBinding: PlacementBinding = {
  apiVersion: PlacementBindingApiVersion,
  kind: PlacementBindingKind,
  metadata: {
    name: 'test-binding',
    namespace: 'default',
    uid: 'uid-binding-1',
  },
  placementRef: {
    apiGroup: 'cluster.open-cluster-management.io',
    kind: PlacementKind,
    name: 'test-placement',
  },
  subjects: [
    { apiGroup: 'policy.open-cluster-management.io', kind: PolicyKind, name: 'test-policy' },
    { apiGroup: 'policy.open-cluster-management.io', kind: PolicySetKind, name: 'test-policyset' },
  ],
}

const mockPolicy: Policy = {
  apiVersion: PolicyApiVersion,
  kind: PolicyKind,
  metadata: {
    name: 'test-policy',
    namespace: 'default',
    uid: 'uid-policy-1',
  },
  spec: {
    disabled: false,
  },
}

const mockPolicySet: PolicySet = {
  apiVersion: PolicySetApiVersion,
  kind: PolicySetKind,
  metadata: {
    name: 'test-policyset',
    namespace: 'default',
    uid: 'uid-policyset-1',
  },
  spec: {
    description: '',
    policies: ['test-policy'],
  },
}

const mockGitOpsCluster: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: {
    name: 'test-gitops',
    namespace: 'default',
    uid: 'uid-gitops-1',
  },
  spec: {
    placementRef: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      name: 'test-placement',
    },
  },
}

const mockPlacementWithPredicates: Placement = {
  ...mockPlacement,
  spec: {
    ...mockPlacement.spec,
    predicates: [
      {
        requiredClusterSelector: {
          labelSelector: {
            matchLabels: { cloud: 'Amazon' },
            matchExpressions: [{ key: 'region', operator: 'In', values: ['us-east-1'] }],
          },
        },
      },
    ],
  },
}

type OverviewComponentProps = {
  placement?: Placement
  placementDecisions?: PlacementDecision[]
  placementBindings?: PlacementBinding[]
  policies?: Policy[]
  policySets?: PolicySet[]
  gitOpsClusters?: GitOpsCluster[]
}

function OverviewComponent({
  placement = mockPlacement,
  placementDecisions = [],
  placementBindings: bindings = [],
  policies: pols = [],
  policySets: polSets = [],
  gitOpsClusters: gcs = [],
}: OverviewComponentProps) {
  const context: PlacementDetailsContext = { placement }
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(placementDecisionsState, placementDecisions)
        snapshot.set(placementBindingsState, bindings)
        snapshot.set(policiesState, pols)
        snapshot.set(policySetsState, polSets)
        snapshot.set(gitOpsClustersState, gcs)
      }}
    >
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path="*" element={<PlacementOverviewPageContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

function nockAppSetList(namespace = 'default', appSets: ApplicationSet[] = []) {
  return nockList({ apiVersion: ApplicationSetApiVersion, kind: ApplicationSetKind, metadata: { namespace } }, appSets)
}

describe('PlacementOverview page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders placement details', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('Details')
    await waitForText('test-placement')
    await waitForText('default')
  })

  test('renders cluster sets as links', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('cluster-set-1,')
    await waitForText('cluster-set-2')
  })

  test('renders selected clusters count', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('5')
  })

  test('renders without cluster sets', async () => {
    const placementNoSets: Placement = {
      ...mockPlacement,
      spec: {},
    }
    nockAppSetList()
    render(<OverviewComponent placement={placementNoSets} />)
    await waitForText('test-placement')
    await waitForText('Details')
  })

  test('renders conditions table', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('Conditions')
    await waitForText('PlacementSatisfied')
    await waitForText('PlacementMisconfigured')
    await waitForText('AllDecisionsScheduled')
    await waitForText('All cluster decisions scheduled')
  })

  test('renders empty conditions state', async () => {
    const placementNoConditions: Placement = {
      ...mockPlacement,
      status: { conditions: [], numberOfSelectedClusters: 0 },
    }
    nockAppSetList()
    render(<OverviewComponent placement={placementNoConditions} />)
    await waitForText('No conditions')
  })

  test('renders last updated timestamp when PlacementSatisfied condition exists', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('Last updated')
  })

  test('renders dash for last updated when no conditions', async () => {
    const placementNoStatus: Placement = {
      ...mockPlacement,
      status: undefined,
    }
    nockAppSetList()
    render(<OverviewComponent placement={placementNoStatus} />)
    await waitForText('-', true)
  })

  test('renders filters as None when no predicates', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('Filters')
    await waitForText('None')
  })

  test('renders filters with predicates in code block', async () => {
    nockAppSetList()
    render(<OverviewComponent placement={mockPlacementWithPredicates} />)
    await waitForText(/cloud=Amazon/, true)
  })

  test('renders placement decisions table', async () => {
    nockAppSetList()
    render(<OverviewComponent placementDecisions={[mockPlacementDecision]} />)
    await waitForText('PlacementDecisions')
    await waitForText('test-placement-decision-1')
    await waitForText('cluster-east,')
    await waitForText('cluster-west')
  })

  test('renders empty placement decisions state', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('No placement decisions')
  })

  test('renders Governance section when policies exist', async () => {
    nockAppSetList()
    render(
      <OverviewComponent
        placementBindings={[mockPlacementBinding]}
        policies={[mockPolicy]}
        policySets={[mockPolicySet]}
      />
    )
    await waitForText('Governance')
    await waitForText('test-policy')
    await waitForText('test-policyset')
    expect(screen.getByText('Policy')).toBeInTheDocument()
    expect(screen.getByText('PolicySet')).toBeInTheDocument()
  })

  test('renders System section when GitOpsClusters exist', async () => {
    nockAppSetList()
    render(<OverviewComponent gitOpsClusters={[mockGitOpsCluster]} />)
    await waitForText('System')
    await waitForText('test-gitops')
  })

  test('hides Used in sections when no related resources', async () => {
    nockAppSetList()
    render(<OverviewComponent />)
    await waitForText('Used in', true)
    expect(screen.queryByText('Governance')).not.toBeInTheDocument()
    expect(screen.queryByText('Applications')).not.toBeInTheDocument()
    expect(screen.queryByText('System')).not.toBeInTheDocument()
  })
})
