/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { RosaHCPWrapper } from './RosaHCPWrapper'
import type { Secret } from '~/resources'

const mockNavigate = jest.fn()
let mockLocationState: Record<string, unknown> = {}

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}))

jest.mock('~/lib/acm-i18next', () => ({
  useTranslation: () => [(key: string) => key],
}))

jest.mock('./hooks/useCredentialsSecrets', () => ({
  useCredentialsSecrets: jest.fn(),
}))

jest.mock('./queries/useFetchAwsInfrastructureAccountIds', () => ({
  useFetchAwsAccountIDs: jest.fn(),
}))

jest.mock('./queries/useFetchAwsBillingAccountIds', () => ({
  useFetchOrganizationQuota: jest.fn(),
}))

jest.mock('./queries/useFetchRegions', () => ({
  useFetchRegions: jest.fn(),
}))

jest.mock('./queries/useFetchOIDCConfigs', () => ({
  useFetchOIDCConfigs: jest.fn(),
}))

jest.mock('./queries/useFetchRolesARNs', () => ({
  useFetchRoleARNs: jest.fn(),
}))

jest.mock('./queries/useFetchMachineTypes', () => ({
  useFetchMachineTypes: jest.fn(),
}))

jest.mock('./queries/useFetchVPCs', () => ({
  useFetchVPCs: jest.fn(),
}))

jest.mock('./queries/useFetchOpenshiftVersions', () => ({
  useFetchHCPVersions: jest.fn(),
}))

jest.mock('./queries/useCheckClusterNameUniqueness', () => ({
  useClusterNameUniquenessCheck: jest.fn(),
}))

jest.mock('@redhat-cloud-services/nxtcm-rosa-hcp-wizard', () => ({
  RosaHCPWizard: jest.fn((props: { wizardData: unknown }) => (
    <div data-testid="rosa-hcp-wizard" data-wizard-data={JSON.stringify(props.wizardData)}>
      RosaHCPWizard
    </div>
  )),
  STEP_IDS: {
    CLUSTER_WIDE_PROXY: 'cluster-wide-proxy-step',
    CLUSTER_UPDATES: 'cluster-updates-step',
  },
}))

jest.mock('@redhat-cloud-services/nxtcm-rosa-hcp-wizard/dist/nxtcm-rosa-hcp-wizard.css', () => ({}))

jest.mock('~/lib/create-rosa-hcp-cluster', () => ({
  createRosaHcpCluster: jest.fn(),
}))

import { useCredentialsSecrets } from './hooks/useCredentialsSecrets'
import { useFetchAwsAccountIDs } from './queries/useFetchAwsInfrastructureAccountIds'
import { useFetchOrganizationQuota } from './queries/useFetchAwsBillingAccountIds'
import { useFetchRegions } from './queries/useFetchRegions'
import { useFetchOIDCConfigs } from './queries/useFetchOIDCConfigs'
import { useFetchRoleARNs } from './queries/useFetchRolesARNs'
import { useFetchMachineTypes } from './queries/useFetchMachineTypes'
import { useFetchVPCs } from './queries/useFetchVPCs'
import { useFetchHCPVersions } from './queries/useFetchOpenshiftVersions'
import { useClusterNameUniquenessCheck } from './queries/useCheckClusterNameUniqueness'
import { RosaHCPWizard } from '@redhat-cloud-services/nxtcm-rosa-hcp-wizard'
import { createRosaHcpCluster } from '~/lib/create-rosa-hcp-cluster'

const mockUseCredentialsSecrets = useCredentialsSecrets as jest.MockedFunction<typeof useCredentialsSecrets>
const mockUseFetchAwsAccountIDs = useFetchAwsAccountIDs as jest.Mock
const mockUseFetchOrganizationQuota = useFetchOrganizationQuota as jest.Mock
const mockUseFetchRegions = useFetchRegions as jest.Mock
const mockUseFetchOIDCConfigs = useFetchOIDCConfigs as jest.Mock
const mockUseFetchRoleARNs = useFetchRoleARNs as jest.Mock
const mockUseFetchMachineTypes = useFetchMachineTypes as jest.Mock
const mockUseFetchVPCs = useFetchVPCs as jest.Mock
const mockUseFetchHCPVersions = useFetchHCPVersions as jest.Mock
const mockUseClusterNameUniquenessCheck = useClusterNameUniquenessCheck as jest.Mock
const MockRosaHCPWizard = RosaHCPWizard as jest.Mock
const mockCreateRosaHcpCluster = createRosaHcpCluster as jest.Mock

const mockSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-secret',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/credentials': '',
      'cluster.open-cluster-management.io/type': 'rhocm',
    },
  },
  data: {
    client_id: 'test-client-id',
    client_secret: 'test-client-secret',
  },
}

const mockRefetch = jest.fn()
const mockFetch = jest.fn()
const mockCheckClusterNameUniqueness = jest.fn()

function setupDefaultMocks(): void {
  mockUseCredentialsSecrets.mockReturnValue([mockSecret] as any)

  mockUseFetchAwsAccountIDs.mockReturnValue({
    data: ['111111111111', '222222222222'],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })

  mockUseFetchOrganizationQuota.mockReturnValue({
    data: [{ value: 'billing-1', label: 'billing-1' }],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })

  mockUseFetchRegions.mockReturnValue({
    data: [
      { value: 'us-east-1', label: 'us-east-1, US East (N. Virginia)' },
      { value: 'us-west-2', label: 'us-west-2, US West (Oregon)' },
    ],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })

  mockUseFetchOIDCConfigs.mockReturnValue({
    data: [{ value: 'oidc-1', label: 'oidc-1', issuer_url: 'https://issuer.example.com' }],
    isLoading: false,
    error: null,
    fetch: mockFetch,
  })

  mockUseFetchRoleARNs.mockReturnValue({
    data: [],
    ocmRole: { arn: 'arn:aws:iam::111:role/OCM' },
    isLoading: false,
    error: null,
    ocmRoleError: null,
    userRoleError: null,
    refetch: mockRefetch,
  })

  mockUseFetchVPCs.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    fetch: mockFetch,
  })

  mockUseFetchHCPVersions.mockReturnValue({
    data: { releases: [{ value: '4.15.1', label: '4.15.1' }] },
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })

  mockUseFetchMachineTypes.mockReturnValue({
    data: [{ id: 'm5.xlarge', value: 'm5.xlarge', label: 'm5.xlarge', description: 'M5 Extra Large' }],
    isLoading: false,
    error: null,
    fetch: mockFetch,
  })

  mockUseClusterNameUniquenessCheck.mockReturnValue({
    clusterNameValidation: { error: null, isFetching: false },
    checkClusterNameUniqueness: mockCheckClusterNameUniqueness,
  })

  mockLocationState = { selectedSecretName: 'test-secret' }
}

const renderComponent = () =>
  render(
    <MemoryRouter>
      <RosaHCPWrapper />
    </MemoryRouter>
  )

describe('RosaHCPWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupDefaultMocks()
  })

  test('should render the wizard when a matching secret is found', () => {
    renderComponent()

    expect(screen.getByText('RosaHCPWizard')).toBeInTheDocument()
  })

  test('should navigate to managed clusters when no matching secret is found', () => {
    mockLocationState = { selectedSecretName: 'non-existent' }

    renderComponent()

    expect(mockNavigate).toHaveBeenCalledWith('/multicloud/infrastructure/clusters/managed')
  })

  test('should navigate to managed clusters when selectedSecretName is not in location state', () => {
    mockLocationState = {}

    renderComponent()

    expect(mockNavigate).toHaveBeenCalledWith('/multicloud/infrastructure/clusters/managed')
  })

  test('should return null when selectedSecret data is not available', () => {
    const secretWithoutData: Secret = {
      ...mockSecret,
      data: undefined,
    }
    mockUseCredentialsSecrets.mockReturnValue([secretWithoutData] as any)

    const { container } = renderComponent()

    expect(container.firstChild).toBeNull()
  })

  test('should render breadcrumbs with correct text', () => {
    renderComponent()

    expect(screen.getByText('Clusters')).toBeInTheDocument()
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
    expect(screen.getAllByText('Control plane type - {{hcType}}')).toHaveLength(2)
    expect(screen.getByText('ROSA HCP')).toBeInTheDocument()
  })

  test('should render page header with title and description', () => {
    renderComponent()

    expect(screen.getAllByText('Control plane type - {{hcType}}')).toHaveLength(2)
    expect(screen.getByText('Choose a control plane type for your cluster.')).toBeInTheDocument()
  })

  test('should pass transformed awsInfrastructureAccounts to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.awsInfrastructureAccounts.data).toEqual([
      { label: '111111111111', value: '111111111111' },
      { label: '222222222222', value: '222222222222' },
    ])
  })

  test('should pass awsBillingAccounts data to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.awsBillingAccounts.data).toEqual([{ value: 'billing-1', label: 'billing-1' }])
  })

  test('should pass regions data to the wizard with fallback to empty array', () => {
    mockUseFetchRegions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.regions.data).toEqual([])
  })

  test('should pass versions data to the wizard with fallback to empty releases', () => {
    mockUseFetchHCPVersions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.versions.data).toEqual({ releases: [] })
  })

  test('should pass machine types data to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.machineTypes.data).toEqual([
      { id: 'm5.xlarge', value: 'm5.xlarge', label: 'm5.xlarge', description: 'M5 Extra Large' },
    ])
  })

  test('should pass roles data with ocmRoleARN to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.roles.ocmRoleARN).toBe('arn:aws:iam::111:role/OCM')
  })

  test('should pass null ocmRoleARN when ocmRole is not available', () => {
    mockUseFetchRoleARNs.mockReturnValue({
      data: [],
      ocmRole: null,
      isLoading: false,
      error: null,
      ocmRoleError: null,
      userRoleError: null,
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.roles.ocmRoleARN).toBeNull()
  })

  test('should pass OIDC config data to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.oidcConfig.data).toEqual([
      { value: 'oidc-1', label: 'oidc-1', issuer_url: 'https://issuer.example.com' },
    ])
  })

  test('should pass VPC list data to the wizard', () => {
    mockUseFetchVPCs.mockReturnValue({
      data: [{ vpc_id: 'vpc-123', name: 'my-vpc' }],
      isLoading: false,
      error: null,
      fetch: mockFetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.vpcList.data).toEqual([{ vpc_id: 'vpc-123', name: 'my-vpc' }])
  })

  test('should set vpcsError to null when vpcsError is undefined', () => {
    mockUseFetchVPCs.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
      fetch: mockFetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.vpcList.error).toBeNull()
  })

  test('should always pass empty subnets and securityGroups to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.subnets).toEqual({ data: [], error: null, isFetching: false })
    expect(wizardProps.wizardData.securityGroups).toEqual({ data: [], error: null, isFetching: false })
  })

  test('should pass loading states to the wizard', () => {
    mockUseFetchAwsAccountIDs.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.awsInfrastructureAccounts.isFetching).toBe(true)
  })

  test('should convert Error instances to message strings for awsInfraError', () => {
    mockUseFetchAwsAccountIDs.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('AWS infra error'),
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.awsInfrastructureAccounts.error).toBe('AWS infra error')
  })

  test('should pass null error for awsInfraError when error is not an Error instance', () => {
    mockUseFetchAwsAccountIDs.mockReturnValue({
      data: [],
      isLoading: false,
      error: 'string error',
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.awsInfrastructureAccounts.error).toBeNull()
  })

  test('should convert Error instances to message strings for awsBillingError', () => {
    mockUseFetchOrganizationQuota.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Billing error'),
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.awsBillingAccounts.error).toBe('Billing error')
  })

  test('should convert Error instances to message strings for versionsError', () => {
    mockUseFetchHCPVersions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Versions error'),
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.versions.error).toBe('Versions error')
  })

  test('should pass clusterNameValidation and checkClusterNameUniqueness to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.clusterNameValidation).toEqual({ error: null, isFetching: false })
    expect(wizardProps.wizardData.checkClusterNameUniqueness).toBe(mockCheckClusterNameUniqueness)
  })

  test('should pass ocmRoleError and userRoleError to the wizard roles', () => {
    mockUseFetchRoleARNs.mockReturnValue({
      data: [],
      ocmRole: null,
      isLoading: false,
      error: null,
      ocmRoleError: 'OCM role not found',
      userRoleError: 'User role was not found',
      refetch: mockRefetch,
    })

    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.wizardData.roles.ocmRoleError).toBe('OCM role not found')
    expect(wizardProps.wizardData.roles.userRoleError).toBe('User role was not found')
  })

  test('should pass empty title, product, config and a real resource generator to the wizard', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    expect(wizardProps.title).toBe('')
    expect(wizardProps.product).toBe('acm')
    expect(wizardProps.config).toEqual({
      hiddenSteps: ['cluster-wide-proxy-step', 'cluster-updates-step'],
    })
    expect(wizardProps.resourceGenerator).toBeDefined()
    expect(typeof wizardProps.resourceGenerator.renderYaml).toBe('function')
    expect(typeof wizardProps.resourceGenerator.validateYaml).toBe('function')
    expect(wizardProps.resourceGenerator.resourceSchemas.map((s: { kind: string }) => s.kind)).toEqual([
      'ROSAControlPlane',
      'ManagedCluster',
      'Cluster',
      'ROSACluster',
    ])
  })

  test('should navigate to managed clusters on cancel', () => {
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    wizardProps.onCancel()

    expect(mockNavigate).toHaveBeenCalledWith('/multicloud/infrastructure/clusters/managed')
  })

  test('should create the cluster and navigate to cluster details on successful submit', async () => {
    mockCreateRosaHcpCluster.mockResolvedValue({ clusterName: 'my-cluster' })
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    await wizardProps.onSubmit('yaml-content')

    expect(mockCreateRosaHcpCluster).toHaveBeenCalledWith('yaml-content', {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/multicloud/infrastructure/clusters/details/my-cluster/my-cluster')
  })

  test('should set onSubmitError and rethrow when cluster creation fails', async () => {
    mockCreateRosaHcpCluster.mockRejectedValue(new Error('creation failed'))
    renderComponent()

    let wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    await expect(wizardProps.onSubmit('yaml-content')).rejects.toThrow('creation failed')

    wizardProps = MockRosaHCPWizard.mock.calls[MockRosaHCPWizard.mock.calls.length - 1][0]
    expect(wizardProps.onSubmitError).toBe('creation failed')

    wizardProps.onBackToReviewStep()
    wizardProps = MockRosaHCPWizard.mock.calls[MockRosaHCPWizard.mock.calls.length - 1][0]
    expect(wizardProps.onSubmitError).toBe(false)
  })

  test('should fall back to the generic unexpected error message for non-Error rejections', async () => {
    mockCreateRosaHcpCluster.mockRejectedValue('not-an-error-instance')
    renderComponent()

    const wizardProps = MockRosaHCPWizard.mock.calls[0][0]
    await expect(wizardProps.onSubmit('yaml-content')).rejects.toBe('not-an-error-instance')

    const latestWizardProps = MockRosaHCPWizard.mock.calls[MockRosaHCPWizard.mock.calls.length - 1][0]
    expect(latestWizardProps.onSubmitError).toBe('An unexpected error occurred.')
  })

  test('should call all hooks with the selected secret data', () => {
    renderComponent()

    const expectedSecret = { client_id: 'test-client-id', client_secret: 'test-client-secret' }
    expect(mockUseFetchAwsAccountIDs).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchOrganizationQuota).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchRegions).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchOIDCConfigs).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchRoleARNs).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchVPCs).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchHCPVersions).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseFetchMachineTypes).toHaveBeenCalledWith(expectedSecret)
    expect(mockUseClusterNameUniquenessCheck).toHaveBeenCalledWith(expectedSecret)
  })
})
