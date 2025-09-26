/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { subscriptionOperatorsState } from '../atoms'
import { KubevirtProviderAlert } from './KubevirtProviderAlert'
import { SubscriptionOperator, SubscriptionOperatorApiVersion, SubscriptionOperatorKind } from '../resources'

// Mock react-i18next with more realistic translations
jest.mock('../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Handle pluralization for cluster counts
      if (key.includes('{{count}}') && options?.count !== undefined) {
        return key.replace('{{count}}', options.count.toString())
      }
      // Return translation keys as-is for testing
      return key
    },
  }),
}))

// Mock shared-recoil
jest.mock('../shared-recoil', () => ({
  useSharedSelectors: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    localHubNameState: 'mockLocalHubNameState',
  })),
}))

// Mock useLocalHubName hook directly
jest.mock('../hooks/use-local-hub', () => ({
  useLocalHubName: jest.fn(() => 'local-cluster'),
}))

// Mock useClusterVersion hook
jest.mock('../hooks/use-cluster-version', () => ({
  useClusterVersion: jest.fn(() => ({
    version: undefined,
    isLoading: false,
    error: undefined,
  })),
}))

// Mock operatorCheck
jest.mock('../lib/operatorCheck', () => ({
  SupportedOperator: {
    kubevirt: 'kubevirt-hyperconverged',
  },
  useOperatorCheck: jest.fn(),
}))

// Mock useVirtualMachineDetection
jest.mock('../hooks/useVirtualMachineDetection', () => ({
  useVirtualMachineDetection: jest.fn(() => ({
    hasVirtualMachines: false,
    isLoading: false,
    error: undefined,
    virtualMachines: [],
  })),
}))

// Mock useFleetSearchPoll for the useClustersWithVirtualMachines hook
jest.mock('@stolostron/multicluster-sdk', () => ({
  useFleetSearchPoll: jest.fn(() => [[], true, undefined, jest.fn()]), // [data, loaded, error, refetch]
}))

// Mock useAllClusters
jest.mock('../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters', () => ({
  useAllClusters: jest.fn(() => []),
}))

// Mock useMultiClusterHubConsoleUrl
jest.mock('../lib/ocp-utils', () => ({
  useMultiClusterHubConsoleUrl: jest.fn(() => '/console'),
}))

// Mock search utils
jest.mock('../lib/search-utils', () => ({
  handleSemverOperatorComparison: jest.fn(),
}))

// Mock doc util
jest.mock('../lib/doc-util', () => ({
  DOC_LINKS: {
    VIRTUALIZATION_DOC_BASE_PATH: '/virtualization-docs',
  },
}))

import { useSharedSelectors } from '../shared-recoil'
import { SupportedOperator, useOperatorCheck } from '../lib/operatorCheck'
import { useFleetSearchPoll } from '@stolostron/multicluster-sdk'
import { useAllClusters } from '../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { useLocalHubName } from '../hooks/use-local-hub'
import { useClusterVersion } from '../hooks/use-cluster-version'
import { useMultiClusterHubConsoleUrl } from '../lib/ocp-utils'
import { handleSemverOperatorComparison } from '../lib/search-utils'

const mockUseSharedSelectors = useSharedSelectors as jest.MockedFunction<typeof useSharedSelectors>
const mockUseOperatorCheck = useOperatorCheck as jest.MockedFunction<typeof useOperatorCheck>
const mockUseFleetSearchPoll = useFleetSearchPoll as jest.MockedFunction<typeof useFleetSearchPoll>
const mockUseAllClusters = useAllClusters as jest.MockedFunction<typeof useAllClusters>
const mockUseLocalHubName = useLocalHubName as jest.MockedFunction<typeof useLocalHubName>
const mockUseClusterVersion = useClusterVersion as jest.MockedFunction<typeof useClusterVersion>
const mockUseMultiClusterHubConsoleUrl = useMultiClusterHubConsoleUrl as jest.MockedFunction<
  typeof useMultiClusterHubConsoleUrl
>
const mockHandleSemverOperatorComparison = handleSemverOperatorComparison as jest.MockedFunction<
  typeof handleSemverOperatorComparison
>

// Helper function to create minimal cluster objects for testing
const createMockCluster = (name: string, distribution: any) => ({
  name,
  uid: `${name}-uid`,
  status: 'Ready' as any,
  hasAutomationTemplate: false,
  hive: {
    isHibernatable: false,
  },
  isHive: false,
  isManaged: true,
  isCurator: false,
  isHostedCluster: false,
  isRegionalHubCluster: false,
  owner: {},
  isSNOCluster: false,
  isHypershift: false,
  distribution,
})

describe('KubevirtProviderAlert', () => {
  const mockKubevirtOperator: SubscriptionOperator = {
    apiVersion: SubscriptionOperatorApiVersion,
    kind: SubscriptionOperatorKind,
    metadata: {
      name: 'kubevirt-hyperconverged',
      namespace: 'openshift-cnv',
    },
    spec: {
      name: 'kubevirt-hyperconverged',
    },
    status: {
      installedCSV: 'kubevirt-hyperconverged-operator.v4.12.0',
      conditions: [
        {
          type: 'Available',
          status: 'True',
        },
      ],
    },
  }

  const defaultProps = {
    component: 'alert' as const,
  }

  const renderKubevirtProviderAlert = (props = {}, operators: SubscriptionOperator[] = []) => {
    mockUseSharedSelectors.mockReturnValue({
      kubevirtOperatorSubscriptionsValue: operators,
    } as any)

    return render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionOperatorsState, operators)
        }}
      >
        <MemoryRouter>
          <KubevirtProviderAlert {...defaultProps} {...{ variant: 'search', ...props }} />
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Set up default mock returns
    mockUseClusterVersion.mockReturnValue({
      version: undefined,
      isLoading: false,
      error: undefined,
    })

    mockUseAllClusters.mockReturnValue([])
    mockUseLocalHubName.mockReturnValue('local-cluster')
    mockUseMultiClusterHubConsoleUrl.mockReturnValue('/console')
    mockUseFleetSearchPoll.mockReturnValue([[], true, undefined, jest.fn()])
  })

  it('should render alert when operator is not installed and variant is provided', () => {
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: false,
      pending: false,
      version: undefined,
    })

    // Mock cluster version for hub >= 4.20
    mockUseClusterVersion.mockReturnValue({
      version: '4.20.1',
      isLoading: false,
      error: undefined,
    })
    mockHandleSemverOperatorComparison.mockReturnValue(false) // version is NOT less than 4.20

    renderKubevirtProviderAlert({ variant: 'search' })

    expect(screen.getByText('Centrally manage VMs with Fleet Virtualization')).toBeInTheDocument()
    expect(screen.getByText('Edit MultiClusterHub')).toBeInTheDocument()
  })

  it('should render alert with clusterDetails variant when operator is not installed', () => {
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: false,
      pending: false,
      version: undefined,
    })

    // Mock cluster version for hub >= 4.20
    mockUseClusterVersion.mockReturnValue({
      version: '4.20.1',
      isLoading: false,
      error: undefined,
    })
    mockHandleSemverOperatorComparison.mockReturnValue(false) // version is NOT less than 4.20

    renderKubevirtProviderAlert({ variant: 'clusterDetails' })

    expect(screen.getByText('Centrally manage VMs with Fleet Virtualization')).toBeInTheDocument()
    expect(
      screen.getByText(
        'To automatically install the recommended operators for managing your VMs in this cluster, enable the OpenShift Virtualization integration on your MultiClusterHub.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Edit MultiClusterHub')).toBeInTheDocument()
  })

  it('should not render alert when operator check is pending', () => {
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: false,
      pending: true,
      version: undefined,
    })

    const { container } = renderKubevirtProviderAlert()

    // When pending is true, the component renders nothing (empty fragment)
    expect(container.firstChild).toBeNull()
  })

  it('should render different component variants (hint vs alert)', () => {
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: false,
      pending: false,
      version: undefined,
    })

    const { container: hintContainer } = renderKubevirtProviderAlert({ component: 'hint', variant: 'search' })
    expect(hintContainer.querySelector('.pf-m-info')).toBeInTheDocument()

    const { container: alertContainer } = renderKubevirtProviderAlert({ component: 'alert', variant: 'search' })
    expect(alertContainer.querySelector('.pf-m-danger')).toBeInTheDocument()
  })

  it('should not render when operator is installed', () => {
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: true,
      pending: false,
      version: 'v4.12.0',
    })

    const { container } = renderKubevirtProviderAlert({}, [mockKubevirtOperator])

    // When operator is installed, the component should not render
    expect(container.firstChild).toBeNull()
  })

  it('should render install operator link and apply custom className with variant', () => {
    const customClass = 'custom-kubevirt-class'
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: false,
      pending: false,
      version: undefined,
    })

    const { container } = renderKubevirtProviderAlert({ className: customClass, variant: 'search' })

    // Test custom className
    expect(container.querySelector(`.${customClass}`)).toBeInTheDocument()

    // Test install operator link
    expect(container.querySelector('.pf-v5-c-alert')).toBeInTheDocument()
  })

  it('should call useOperatorCheck with correct parameters', () => {
    const mockOperators = [mockKubevirtOperator]
    mockUseOperatorCheck.mockReturnValue({
      operator: SupportedOperator.kubevirt,
      installed: false,
      pending: false,
      version: undefined,
    })

    renderKubevirtProviderAlert({}, mockOperators)

    expect(mockUseOperatorCheck).toHaveBeenCalledWith('kubevirt-hyperconverged', mockOperators)
  })

  describe('variant functionality', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.kubevirt,
        installed: false,
        pending: false,
        version: undefined,
      })
      mockUseLocalHubName.mockReturnValue('local-cluster')
      mockUseMultiClusterHubConsoleUrl.mockReturnValue('/console')
    })

    it('should render search variant with VM count when hub version >= 4.20', () => {
      // Mock hub cluster with version >= 4.20 using useClusterVersion
      mockUseClusterVersion.mockReturnValue({
        version: '4.20.1',
        isLoading: false,
        error: undefined,
      })
      mockHandleSemverOperatorComparison.mockReturnValue(false) // version is NOT less than 4.20

      // Mock VM search returning clusters with VMs
      const mockVMs = [
        { cluster: 'cluster1' },
        { cluster: 'cluster2' },
        { cluster: 'cluster1' }, // duplicate cluster should be deduplicated
      ]
      mockUseFleetSearchPoll.mockReturnValue([mockVMs, true, undefined, jest.fn()])

      renderKubevirtProviderAlert({ variant: 'search' })

      expect(screen.getByText('Centrally manage VMs with Fleet Virtualization')).toBeInTheDocument()
      expect(
        screen.getByText(
          /To automatically install the recommended operators for managing your VMs in 2 managed cluster/
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Edit MultiClusterHub')).toBeInTheDocument()
      expect(screen.getByText('View documentation')).toBeInTheDocument()
    })

    it('should render search variant with upgrade message when hub version < 4.20', () => {
      // Mock hub cluster with version < 4.20 using useClusterVersion
      mockUseClusterVersion.mockReturnValue({
        version: '4.19.5',
        isLoading: false,
        error: undefined,
      })
      mockHandleSemverOperatorComparison.mockReturnValue(true) // version IS less than 4.20

      // Mock VM search returning clusters with VMs
      const mockVMs = [{ cluster: 'cluster1' }]
      mockUseFleetSearchPoll.mockReturnValue([mockVMs, true, undefined, jest.fn()])

      renderKubevirtProviderAlert({ variant: 'search' })

      expect(screen.getByText('Upgrade hub cluster to centrally manage VMs')).toBeInTheDocument()
      expect(
        screen.getByText(
          /Upgrade to OCP version 4.20 or newer. Then, enable the OpenShift Virtualization integration to install recommended operators to manage your VMs in 1 cluster centrally./
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Upgrade hub cluster')).toBeInTheDocument()
      expect(screen.getByText('View documentation')).toBeInTheDocument()
    })

    it('should render clusterDetails variant with integration message when hub version >= 4.20', () => {
      // Mock hub cluster with version >= 4.20 using useClusterVersion
      mockUseClusterVersion.mockReturnValue({
        version: '4.21.0',
        isLoading: false,
        error: undefined,
      })
      mockHandleSemverOperatorComparison.mockReturnValue(false)
      mockUseFleetSearchPoll.mockReturnValue([[], true, undefined, jest.fn()])

      renderKubevirtProviderAlert({ variant: 'clusterDetails' })

      expect(screen.getByText('Centrally manage VMs with Fleet Virtualization')).toBeInTheDocument()
      expect(
        screen.getByText(
          'To automatically install the recommended operators for managing your VMs in this cluster, enable the OpenShift Virtualization integration on your MultiClusterHub.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Edit MultiClusterHub')).toBeInTheDocument()
    })

    it('should render clusterDetails variant with upgrade message when hub version < 4.20', () => {
      // Mock hub cluster with version < 4.20 using useClusterVersion
      mockUseClusterVersion.mockReturnValue({
        version: '4.18.0',
        isLoading: false,
        error: undefined,
      })
      mockHandleSemverOperatorComparison.mockReturnValue(true)
      mockUseFleetSearchPoll.mockReturnValue([[], true, undefined, jest.fn()])

      renderKubevirtProviderAlert({ variant: 'clusterDetails' })

      expect(screen.getByText('Upgrade hub cluster to centrally manage VMs')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Upgrade to OCP version 4.20 or newer. Then, enable the OpenShift Virtualization integration to install recommended operators to manage your VMs in this cluster centrally.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Upgrade hub cluster')).toBeInTheDocument()
    })
  })

  describe('useLabelAlert functionality', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.kubevirt,
        installed: false,
        pending: false,
        version: undefined,
      })
      mockUseLocalHubName.mockReturnValue('local-cluster')
      mockUseMultiClusterHubConsoleUrl.mockReturnValue('/console')
      mockUseFleetSearchPoll.mockReturnValue([[], true, undefined, jest.fn()])
    })

    it('should render label when useLabelAlert is true with variant', () => {
      mockUseClusterVersion.mockReturnValue({
        version: '4.20.0',
        isLoading: false,
        error: undefined,
      })
      mockHandleSemverOperatorComparison.mockReturnValue(false)

      renderKubevirtProviderAlert({ useLabelAlert: true, variant: 'search' })
      expect(screen.getByText('Operator recommended')).toBeInTheDocument()
      expect(screen.getByText('Operator recommended').closest('.pf-v5-c-label')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle missing version and hub cluster not found', () => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.kubevirt,
        installed: false,
        pending: false,
        version: undefined,
      })
      mockUseFleetSearchPoll.mockReturnValue([[], true, undefined, jest.fn()])
      mockHandleSemverOperatorComparison.mockReturnValue(true)

      // Test with no version and hub cluster not found - both should default to upgrade path
      mockUseAllClusters.mockReturnValue([createMockCluster('local-cluster', { isManagedOpenShift: false })])
      renderKubevirtProviderAlert({ variant: 'search' })
      expect(screen.getByText('Upgrade hub cluster to centrally manage VMs')).toBeInTheDocument()
    })
  })

  describe('virtual machine detection', () => {
    beforeEach(() => {
      mockUseOperatorCheck.mockReturnValue({
        operator: SupportedOperator.kubevirt,
        installed: false,
        pending: false,
        version: undefined,
      })
      mockUseLocalHubName.mockReturnValue('local-cluster')
      mockUseClusterVersion.mockReturnValue({
        version: '4.20.0',
        isLoading: false,
        error: undefined,
      })
      mockHandleSemverOperatorComparison.mockReturnValue(false)
    })

    it('should handle VM search errors', () => {
      const searchError = new Error('Search failed')
      mockUseFleetSearchPoll.mockReturnValue([[], true, searchError, jest.fn()])
      renderKubevirtProviderAlert({ variant: 'search' })
      expect(
        screen.getByText(
          /To automatically install the recommended operators for managing your VMs in 0 managed cluster/
        )
      ).toBeInTheDocument()
    })

    it('should handle invalid data format', () => {
      mockUseFleetSearchPoll.mockReturnValue(['invalid-data' as any, true, undefined, jest.fn()])
      renderKubevirtProviderAlert({ variant: 'search' })
      expect(
        screen.getByText(
          /To automatically install the recommended operators for managing your VMs in 0 managed cluster/
        )
      ).toBeInTheDocument()
    })

    it('should deduplicate clusters and filter invalid entries', () => {
      const mockVMs = [
        { cluster: 'cluster1' },
        { cluster: 'cluster2' },
        { cluster: 'cluster1' }, // duplicate
        { name: 'vm-without-cluster' }, // missing cluster
        { cluster: null }, // null cluster
        { cluster: '' }, // empty cluster
      ]
      mockUseFleetSearchPoll.mockReturnValue([mockVMs, true, undefined, jest.fn()])

      renderKubevirtProviderAlert({ variant: 'search' })

      // Should count only 2 valid unique clusters
      expect(
        screen.getByText(
          /To automatically install the recommended operators for managing your VMs in 2 managed cluster/
        )
      ).toBeInTheDocument()
    })
  })
})
