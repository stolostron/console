/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { PlacementSection, PlacementSelector } from './PlacementSection'
import { PlacementKind } from '../common/resources/IPlacement'
import { PlacementBindingKind } from '../common/resources/IPlacementBinding'

let mockResources: any[] = []
const mockUpdate = jest.fn()
const mockSetFooterContent = jest.fn()
const mockSetHasInputs = jest.fn()
const mockValidate = jest.fn()
let mockSettings: Record<string, string> = {}
let mockEditMode = 'create'
let mockDisplayMode = 0

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

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: () => mockSettings,
  useSharedAtoms: () => ({ settingsState: 'settingsState' }),
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

jest.mock('./Placement', () => ({
  Placement: (props: any) => <div id="placement-component" data-feature={props.showPlacementPreview} />,
  Placements: (props: any) => <div id="placements-component" data-feature={props.showPlacementPreview} />,
}))

jest.mock('./PlacementBinding', () => ({
  PlacementBindings: () => <div id="placement-bindings" />,
}))

jest.mock('../../NavigationPath', () => ({
  NavigationPath: { clusterSets: '/cluster-sets' },
}))

jest.mock('@patternfly-labs/react-form-wizard', () => ({
  DisplayMode: { Step: 0, StepsHidden: 1 },
  EditMode: { Create: 'create', Edit: 'edit' },
  useData: () => ({ update: mockUpdate }),
  useDisplayMode: () => mockDisplayMode,
  useEditMode: () => mockEditMode,
  useItem: () => mockResources,
  useSetFooterContent: () => mockSetFooterContent,
  useSetHasInputs: () => mockSetHasInputs,
  useValidate: () => mockValidate,
  Section: ({ children, label }: any) => <div id={`section-${label}`}>{children}</div>,
  Sync: () => null,
  WizDetailsHidden: ({ children }: any) => <>{children}</>,
  WizItemSelector: ({ children }: any) => <div id="item-selector">{children}</div>,
  WizSingleSelect: ({ label }: any) => <div id={`single-select-${label}`} />,
}))

const defaultProps = {
  bindingSubjectKind: 'Policy',
  bindingSubjectApiGroup: 'policy.open-cluster-management.io',
  existingPlacements: [],
  existingClusterSets: [],
  existingClusterSetBindings: [],
  clusters: [],
}

describe('PlacementSection', () => {
  beforeEach(() => {
    mockResources = []
    mockSettings = {}
    mockEditMode = 'create'
    mockDisplayMode = 0
    mockUpdate.mockReset()
    mockSetFooterContent.mockReset()
  })

  it('renders the placement section with empty resources', () => {
    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('section-Placement')).toBeInTheDocument()
  })

  it('renders Placement component when one placement exists', () => {
    mockResources = [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('placement-component')).toBeInTheDocument()
  })

  it('renders advanced view when multiple placements exist', () => {
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'p1', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementKind,
        metadata: { name: 'p2', namespace: 'default' },
        spec: {},
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('placements-component')).toBeInTheDocument()
    expect(screen.getByTestId('placement-bindings')).toBeInTheDocument()
  })

  it('passes showPlacementPreview when enhancedPlacement is enabled', () => {
    mockSettings = { enhancedPlacement: 'enabled' }
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    const placement = screen.getByTestId('placement-component')
    expect(placement).toHaveAttribute('data-feature', 'true')
  })

  it('renders existing placement selector when only binding exists', () => {
    mockResources = [
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('single-select-Placement')).toBeInTheDocument()
  })

  it('auto-creates placement binding when single placement exists without binding', () => {
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(mockUpdate).toHaveBeenCalled()
    const binding = mockResources.find((r) => r.kind === PlacementBindingKind)
    expect(binding).toBeDefined()
    expect(binding.placementRef.kind).toBe(PlacementKind)
  })

  it('hides placement selector in edit mode with existing resources', () => {
    mockEditMode = 'edit'
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default', uid: 'existing-uid' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.queryByText('How do you want to select clusters?')).not.toBeInTheDocument()
  })

  it('shows placement selector in edit mode without existing resources', () => {
    mockEditMode = 'edit'
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByText('How do you want to select clusters?')).toBeInTheDocument()
  })

  it('detects advanced mode with multiple placement bindings', () => {
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'p1', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'b1', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'p1' },
        subjects: [],
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'b2', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'p1' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('placements-component')).toBeInTheDocument()
    expect(screen.getByTestId('placement-bindings')).toBeInTheDocument()
  })

  it('detects advanced mode with multiple predicates', () => {
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'p1', namespace: 'default' },
        spec: {
          predicates: [{ requiredClusterSelector: {} }, { requiredClusterSelector: {} }],
        },
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'b1', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'p1' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('placements-component')).toBeInTheDocument()
  })

  it('filters namespaced placements by namespace', () => {
    mockResources = [
      {
        kind: 'Policy',
        metadata: { name: 'test-policy', namespace: 'ns1' },
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'ns1' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'existing' },
        subjects: [],
      },
    ]

    const existingPlacements = [
      { metadata: { name: 'p-ns1', namespace: 'ns1' } },
      { metadata: { name: 'p-ns2', namespace: 'ns2' } },
    ]

    render(<PlacementSection {...defaultProps} existingPlacements={existingPlacements as any} />)

    expect(screen.getByTestId('section-Placement')).toBeInTheDocument()
  })

  it('filters cluster set bindings by namespace', () => {
    mockResources = [
      {
        kind: 'Policy',
        metadata: { name: 'test-policy', namespace: 'ns1' },
      },
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'ns1' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'ns1' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(
      <PlacementSection
        {...defaultProps}
        existingClusterSets={[{ metadata: { name: 'cs1' } }] as any}
        existingClusterSetBindings={
          [
            { metadata: { namespace: 'ns1' }, spec: { clusterSet: 'cs1' } },
            { metadata: { namespace: 'ns2' }, spec: { clusterSet: 'cs2' } },
          ] as any
        }
      />
    )

    expect(screen.getByTestId('placement-component')).toBeInTheDocument()
  })

  it('sets footer content when enhancedPlacement is enabled with single placement', () => {
    mockSettings = { enhancedPlacement: 'enabled' }
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(mockSetFooterContent).toHaveBeenCalled()
  })

  it('renders review step content when displayMode is not Step and enhancedPlacement enabled', () => {
    mockSettings = { enhancedPlacement: 'enabled' }
    mockDisplayMode = 1
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByTestId('section-Placement')).toBeInTheDocument()
  })

  it('renders review step with label expressions and tolerations', () => {
    mockSettings = { enhancedPlacement: 'enabled' }
    mockDisplayMode = 1
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
                },
              },
            },
          ],
          tolerations: [{ key: 'dedicated', operator: 'Equal', value: 'gpu', effect: 'NoSchedule' }],
        },
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    const { usePlacementDebug } = jest.requireMock('./usePlacementDebug')
    usePlacementDebug.mockReturnValue({
      matched: ['c1'],
      notMatched: [],
      totalClusters: 1,
      matchedCount: 1,
      loading: false,
      error: undefined,
    })

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByText('Label expressions and tolerations')).toBeInTheDocument()
    expect(screen.getByText('env In')).toBeInTheDocument()
    expect(screen.getByText('dedicated')).toBeInTheDocument()
    expect(screen.getByText('gpu')).toBeInTheDocument()
    expect(screen.getByText('NoSchedule')).toBeInTheDocument()

    usePlacementDebug.mockReturnValue({
      matched: [],
      notMatched: [],
      totalClusters: 0,
      matchedCount: undefined,
      loading: false,
      error: undefined,
    })
  })

  it('renders review step error alert when debug has error', () => {
    mockSettings = { enhancedPlacement: 'enabled' }
    mockDisplayMode = 1
    mockResources = [
      {
        kind: PlacementKind,
        metadata: { name: 'test', namespace: 'default' },
        spec: {},
      },
      {
        kind: PlacementBindingKind,
        metadata: { name: 'test-binding', namespace: 'default' },
        placementRef: { apiGroup: 'cluster.open-cluster-management.io', kind: PlacementKind, name: 'test' },
        subjects: [],
      },
    ]

    const { usePlacementDebug } = jest.requireMock('./usePlacementDebug')
    usePlacementDebug.mockReturnValue({
      matched: [],
      notMatched: [],
      totalClusters: 0,
      matchedCount: undefined,
      loading: false,
      error: new Error('Server error'),
    })

    render(<PlacementSection {...defaultProps} />)

    expect(screen.getByText('Unable to determine cluster matches.')).toBeInTheDocument()

    usePlacementDebug.mockReturnValue({
      matched: [],
      notMatched: [],
      totalClusters: 0,
      matchedCount: undefined,
      loading: false,
      error: undefined,
    })
  })
})

describe('PlacementSelector', () => {
  beforeEach(() => {
    mockResources = [
      {
        kind: 'Policy',
        metadata: { name: 'test-policy', namespace: 'default' },
      },
    ]
    mockUpdate.mockReset()
  })

  it('renders toggle group with new and existing placement options', () => {
    render(
      <PlacementSelector
        placementCount={0}
        placementBindingCount={0}
        bindingSubjectKind="Policy"
        bindingSubjectApiGroup="policy.open-cluster-management.io"
      />
    )

    expect(screen.getByText('New placement')).toBeInTheDocument()
    expect(screen.getByText('Existing placement')).toBeInTheDocument()
  })

  it('renders no placement option when allowNoPlacement is true', () => {
    render(
      <PlacementSelector
        placementCount={0}
        placementBindingCount={0}
        bindingSubjectKind="Policy"
        bindingSubjectApiGroup="policy.open-cluster-management.io"
        allowNoPlacement
      />
    )

    expect(screen.getByText('No placement')).toBeInTheDocument()
  })

  it('shows helper text when no placement is selected and allowNoPlacement', () => {
    render(
      <PlacementSelector
        placementCount={0}
        placementBindingCount={0}
        bindingSubjectKind="Policy"
        bindingSubjectApiGroup="policy.open-cluster-management.io"
        allowNoPlacement
      />
    )

    expect(
      screen.getByText('Do not add a placement if you want to place this policy using policy set placement.')
    ).toBeInTheDocument()
  })

  it('highlights new placement toggle when placement exists', () => {
    render(
      <PlacementSelector
        placementCount={1}
        placementBindingCount={1}
        bindingSubjectKind="Policy"
        bindingSubjectApiGroup="policy.open-cluster-management.io"
      />
    )

    expect(screen.getByText('New placement')).toBeInTheDocument()
  })

  it('highlights existing placement toggle when only binding exists', () => {
    render(
      <PlacementSelector
        placementCount={0}
        placementBindingCount={1}
        bindingSubjectKind="Policy"
        bindingSubjectApiGroup="policy.open-cluster-management.io"
      />
    )

    expect(screen.getByText('Existing placement')).toBeInTheDocument()
  })
})
