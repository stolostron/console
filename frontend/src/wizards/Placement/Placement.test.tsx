/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { Placement, Placements, PlacementPredicate, PredicateSummary } from './Placement'
import { PlacementDebugState } from './usePlacementDebug'

let mockPlacement: any = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: { name: 'test-placement', namespace: 'default' },
  spec: {},
}

let mockResources: any[] = []
const mockUpdate = jest.fn()
const mockSetFooterContent = jest.fn()
let mockEditMode = 'create'

jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts) {
        return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, String(v)), key)
      }
      return key
    },
  }),
}))

jest.mock('../../hooks/useValidation', () => ({
  useValidation: () => ({ validateKubernetesResourceName: jest.fn() }),
}))

jest.mock('../common/useLabelValuesMap', () => ({
  useLabelValuesMap: () => ({}),
}))

jest.mock('./usePlacementDebug', () => ({
  usePlacementDebug: jest.fn(() => ({
    matched: [],
    notMatched: [],
    totalClusters: 0,
    matchedCount: undefined,
    loading: false,
    error: undefined,
  })),
}))

jest.mock('./MatchedClustersModal', () => ({
  MatchedClustersModal: () => null,
}))

jest.mock('./MatchExpression', () => ({
  MatchExpression: () => <div id="match-expression" />,
  MatchExpressionCollapsed: () => <div id="match-expression-collapsed" />,
  MatchExpressionSummary: ({ expression }: any) => <div id="match-expression-summary">{expression?.key}</div>,
}))

jest.mock('@patternfly-labs/react-form-wizard', () => ({
  DisplayMode: { Step: 0, StepsHidden: 1 },
  EditMode: { Create: 'create', Edit: 'edit' },
  useData: () => ({ update: mockUpdate }),
  useDisplayMode: () => 0,
  useEditMode: () => mockEditMode,
  useItem: () => mockPlacement ?? mockResources,
  useSetFooterContent: () => mockSetFooterContent,
  WizArrayInput: ({ children, label }: any) => <div id={`array-input-${label}`}>{children}</div>,
  WizCheckbox: ({ label }: any) => <div id={`checkbox-${label}`} />,
  WizCustomWrapper: ({ label, value, children }: any) => (
    <div id={`custom-wrapper-${label}`}>
      <span id="custom-wrapper-value">{value}</span>
      {children}
    </div>
  ),
  WizKeyValue: ({ label }: any) => <div id={`key-value-${label}`} />,
  WizLabelSelect: ({ label }: any) => <div id={`label-select-${label}`} />,
  WizMultiSelect: ({ label }: any) => <div id={`multi-select-${label}`} />,
  WizNumberInput: ({ label }: any) => <div id={`number-input-${label}`} />,
  WizTextInput: ({ label, id }: any) => <div id={`text-input-${id || label}`} />,
}))

describe('Placements', () => {
  beforeEach(() => {
    mockEditMode = 'create'
    mockResources = [
      {
        kind: 'Policy',
        metadata: { name: 'test-policy', namespace: 'default' },
      },
    ]
  })

  it('renders the placements wrapper with array input', () => {
    render(<Placements clusterSets={[]} clusterSetBindings={[]} bindingKind="Policy" clusters={[]} />)

    expect(screen.getByTestId('array-input-Placements')).toBeInTheDocument()
  })

  it('filters namespace cluster set names from bindings', () => {
    mockResources = [
      {
        kind: 'Policy',
        metadata: { name: 'test-policy', namespace: 'default' },
      },
    ]

    render(
      <Placements
        clusterSets={[{ metadata: { name: 'cs1' } }]}
        clusterSetBindings={[
          { metadata: { namespace: 'default' }, spec: { clusterSet: 'cs1' } },
          { metadata: { namespace: 'other' }, spec: { clusterSet: 'cs2' } },
        ]}
        bindingKind="Policy"
        clusters={[]}
      />
    )

    expect(screen.getByTestId('array-input-Placements')).toBeInTheDocument()
  })

  it('returns empty cluster set names when no source found', () => {
    mockResources = [{ kind: 'Other', metadata: { name: 'test', namespace: 'default' } }]

    render(<Placements clusterSets={[]} clusterSetBindings={[]} bindingKind="Policy" clusters={[]} />)

    expect(screen.getByTestId('array-input-Placements')).toBeInTheDocument()
  })

  it('renders in edit mode with default collapsed', () => {
    mockEditMode = 'edit'

    render(<Placements clusterSets={[]} clusterSetBindings={[]} bindingKind="Policy" clusters={[]} />)

    expect(screen.getByTestId('array-input-Placements')).toBeInTheDocument()
  })
})

describe('Placement', () => {
  beforeEach(() => {
    mockPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test-placement', namespace: 'default' },
      spec: {},
    }
    mockEditMode = 'create'
    mockSetFooterContent.mockReset()
  })

  it('renders basic placement fields', () => {
    render(<Placement namespaceClusterSetNames={['cluster-set-1']} clusters={[]} />)

    expect(screen.getByTestId('text-input-name')).toBeInTheDocument()
    expect(screen.getByTestId('multi-select-Cluster sets')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-Set a limit on the number of clusters selected')).toBeInTheDocument()
  })

  it('hides name when hideName is true', () => {
    render(<Placement namespaceClusterSetNames={[]} clusters={[]} hideName />)

    expect(screen.queryByTestId('text-input-name')).not.toBeInTheDocument()
  })

  it('shows cluster set warning alert when no cluster sets and alertTitle provided', () => {
    render(
      <Placement
        namespaceClusterSetNames={[]}
        clusters={[]}
        alertTitle="No cluster sets available"
        alertContent={<span>Please create a cluster set</span>}
      />
    )

    expect(screen.getByText('No cluster sets available')).toBeInTheDocument()
    expect(screen.getByText('Please create a cluster set')).toBeInTheDocument()
  })

  it('does not show alert when cluster sets are present', () => {
    render(<Placement namespaceClusterSetNames={['my-set']} clusters={[]} alertTitle="No cluster sets available" />)

    expect(screen.queryByText('No cluster sets available')).not.toBeInTheDocument()
  })

  it('does not render feature flag UI when showPlacementPreview is false', () => {
    render(<Placement namespaceClusterSetNames={[]} clusters={[]} />)

    expect(screen.queryByTestId('custom-wrapper-Matched by Placement')).not.toBeInTheDocument()
  })

  it('renders WizCustomWrapper when showPlacementPreview is true', () => {
    render(<Placement namespaceClusterSetNames={[]} clusters={[]} showPlacementPreview />)

    expect(screen.getByTestId('custom-wrapper-Matched by Placement')).toBeInTheDocument()
    expect(screen.getByTestId('custom-wrapper-value')).toHaveTextContent('-')
  })

  it('shows matched count when placementDebugState has matches', () => {
    const debugState: PlacementDebugState = {
      matched: ['c1', 'c2'],
      notMatched: ['c3'],
      totalClusters: 3,
      matchedCount: 2,
      loading: false,
      error: undefined,
    }

    render(
      <Placement namespaceClusterSetNames={[]} clusters={[]} showPlacementPreview placementDebugState={debugState} />
    )

    expect(screen.getByTestId('custom-wrapper-value')).toHaveTextContent('Matched by Placement: 2 of 3 clusters')
  })

  it('shows no-match message when matchedCount is 0', () => {
    const debugState: PlacementDebugState = {
      matched: [],
      notMatched: ['c1'],
      totalClusters: 1,
      matchedCount: 0,
      loading: false,
      error: undefined,
    }

    render(
      <Placement namespaceClusterSetNames={[]} clusters={[]} showPlacementPreview placementDebugState={debugState} />
    )

    expect(screen.getByTestId('custom-wrapper-value')).toHaveTextContent(
      'No clusters match the current placement criteria'
    )
  })

  it('shows error alert when placementDebugState has error', () => {
    const debugState: PlacementDebugState = {
      matched: [],
      notMatched: [],
      totalClusters: 0,
      matchedCount: undefined,
      loading: false,
      error: new Error('500 Internal Server Error'),
    }

    render(
      <Placement namespaceClusterSetNames={[]} clusters={[]} showPlacementPreview placementDebugState={debugState} />
    )

    expect(screen.getByText('Unable to determine cluster matches.')).toBeInTheDocument()
  })

  it('does not show alert when cluster has clusterSets in spec', () => {
    mockPlacement.spec = { clusterSets: ['my-set'] }

    render(<Placement namespaceClusterSetNames={[]} clusters={[]} alertTitle="No cluster sets available" />)

    expect(screen.queryByText('No cluster sets available')).not.toBeInTheDocument()
  })

  it('sets footer content when owning debug UI', () => {
    render(<Placement namespaceClusterSetNames={[]} clusters={[]} showPlacementPreview />)

    expect(mockSetFooterContent).toHaveBeenCalled()
  })

  it('renders numberOfClusters checkbox and number input', () => {
    mockPlacement.spec = { numberOfClusters: 3 }

    render(<Placement namespaceClusterSetNames={[]} clusters={[]} />)

    expect(screen.getByTestId('checkbox-Set a limit on the number of clusters selected')).toBeInTheDocument()
    expect(screen.getByTestId('number-input-Limit the number of clusters selected')).toBeInTheDocument()
  })

  it('renders with readonly name when placement has uid', () => {
    mockPlacement.metadata.uid = 'abc-123'

    render(<Placement namespaceClusterSetNames={[]} clusters={[]} />)

    expect(screen.getByTestId('text-input-name')).toBeInTheDocument()
  })

  it('renders predicate section with custom rootPath', () => {
    render(<PlacementPredicate rootPath="spec.predicates.0." clusters={[]} />)

    expect(screen.getByTestId('key-value-Label selectors')).toBeInTheDocument()
  })
})

describe('PlacementPredicate', () => {
  it('renders label and claim expression inputs', () => {
    render(<PlacementPredicate clusters={[]} />)

    expect(screen.getByTestId('key-value-Label selectors')).toBeInTheDocument()
    expect(screen.getByText('Label expressions')).toBeInTheDocument()
    expect(screen.getByTestId('array-input-Cluster claim expressions')).toBeInTheDocument()
  })
})

describe('PredicateSummary', () => {
  it('shows expand message when no selectors or expressions', () => {
    mockPlacement = { requiredClusterSelector: {} }

    render(<PredicateSummary />)

    expect(screen.getByText('Expand to enter expression')).toBeInTheDocument()
  })

  it('renders label selectors', () => {
    mockPlacement = {
      requiredClusterSelector: {
        labelSelector: {
          matchLabels: { env: 'prod', region: 'us-east' },
          matchExpressions: [],
        },
        claimSelector: { matchExpressions: [] },
      },
    }

    render(<PredicateSummary />)

    expect(screen.getByText('env=prod')).toBeInTheDocument()
    expect(screen.getByText('region=us-east')).toBeInTheDocument()
    expect(screen.getByText('Label selectors')).toBeInTheDocument()
  })

  it('renders label expressions', () => {
    mockPlacement = {
      requiredClusterSelector: {
        labelSelector: {
          matchLabels: {},
          matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
        },
        claimSelector: { matchExpressions: [] },
      },
    }

    render(<PredicateSummary />)

    expect(screen.getByText('Label expressions')).toBeInTheDocument()
    expect(screen.getByTestId('match-expression-summary')).toHaveTextContent('env')
  })

  it('renders claim expressions', () => {
    mockPlacement = {
      requiredClusterSelector: {
        labelSelector: { matchLabels: {}, matchExpressions: [] },
        claimSelector: {
          matchExpressions: [{ key: 'platform', operator: 'In', values: ['AWS'] }],
        },
      },
    }

    render(<PredicateSummary />)

    expect(screen.getByText('Cluster claim expressions')).toBeInTheDocument()
  })
})
