/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { DeletePlacementModal, IDeletePlacementModalProps } from './DeletePlacementModal'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../../../../../resources/placement'
import { ApplicationSet, ApplicationSetApiVersion, ApplicationSetKind } from '../../../../../resources/application-set'
import { Policy, PolicyApiVersion, PolicyKind } from '../../../../../resources/policy'
import { PolicySet, PolicySetApiVersion, PolicySetKind } from '../../../../../resources/policy-set'
import { GitOpsCluster, GitOpsClusterApiVersion, GitOpsClusterKind } from '../../../../../resources/gitops-cluster'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'

const mockDeleteApplication = jest.fn()
jest.mock('../../../../../lib/delete-application', () => ({
  deleteApplication: (...args: unknown[]) => mockDeleteApplication(...args),
}))

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'test-placement',
    namespace: 'default',
    uid: 'uid-placement-1',
  },
  spec: {},
}

const mockAppSet: ApplicationSet = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
  metadata: {
    name: 'my-appset',
    namespace: 'default',
    uid: 'uid-appset-1',
  },
  spec: {
    generators: [],
    template: {
      metadata: { name: '' },
      spec: { destination: { namespace: '', server: '' }, project: '', source: { repoURL: '' } },
    },
  },
}

const mockPolicy: Policy = {
  apiVersion: PolicyApiVersion,
  kind: PolicyKind,
  metadata: {
    name: 'my-policy',
    namespace: 'default',
    uid: 'uid-policy-1',
  },
  spec: { disabled: false },
}

const mockPolicySet: PolicySet = {
  apiVersion: PolicySetApiVersion,
  kind: PolicySetKind,
  metadata: {
    name: 'my-policyset',
    namespace: 'default',
    uid: 'uid-policyset-1',
  },
  spec: {
    description: '',
    policies: ['my-policy'],
  },
}

const mockGitOpsCluster: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: {
    name: 'my-gitops',
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

function renderModal(overrides: Partial<IDeletePlacementModalProps> = {}) {
  const defaultProps: IDeletePlacementModalProps = {
    open: true,
    resource: mockPlacement,
    close: jest.fn(),
    relatedAppSets: [],
    relatedPolicies: [],
    relatedPolicySets: [],
    relatedGitOpsClusters: [],
    ...overrides,
  }
  return {
    ...render(
      <RecoilRoot>
        <DeletePlacementModal {...defaultProps} />
      </RecoilRoot>
    ),
    props: defaultProps,
  }
}

describe('DeletePlacementModal', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockDeleteApplication.mockReset()
  })

  test('renders nothing when open is false', () => {
    render(
      <RecoilRoot>
        <DeletePlacementModal open={false} />
      </RecoilRoot>
    )
    expect(screen.queryByText(/permanently delete/i)).not.toBeInTheDocument()
  })

  test('renders modal with placement name and confirmation text', () => {
    renderModal()
    expect(screen.getByText(/Permanently delete.*placement.*test-placement/)).toBeInTheDocument()
    expect(screen.getByText('Are you sure that you want to continue?')).toBeInTheDocument()
  })

  test('renders Delete and Cancel buttons', () => {
    renderModal()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  test('does not show related resources when lists are empty', () => {
    renderModal()
    expect(screen.queryByText(/following resources are using/)).not.toBeInTheDocument()
  })

  test('displays related ApplicationSets', () => {
    renderModal({ relatedAppSets: [mockAppSet] })
    expect(screen.getByText(/following resources are using/)).toBeInTheDocument()
    expect(screen.getByText(/my-appset/)).toBeInTheDocument()
    expect(screen.getByText(/ApplicationSet/)).toBeInTheDocument()
  })

  test('displays related Policies', () => {
    renderModal({ relatedPolicies: [mockPolicy] })
    expect(screen.getByText(/my-policy/)).toBeInTheDocument()
    expect(screen.getByText(/Policy/)).toBeInTheDocument()
  })

  test('displays related PolicySets', () => {
    renderModal({ relatedPolicySets: [mockPolicySet] })
    expect(screen.getByText(/following resources are using/)).toBeInTheDocument()
    expect(screen.getByText(/my-policyset/)).toBeInTheDocument()
    expect(screen.getByText(/PolicySet/)).toBeInTheDocument()
  })

  test('displays related GitOpsClusters', () => {
    renderModal({ relatedGitOpsClusters: [mockGitOpsCluster] })
    expect(screen.getByText(/my-gitops/)).toBeInTheDocument()
    expect(screen.getByText(/GitOpsCluster/)).toBeInTheDocument()
  })

  test('displays all related resource types together', () => {
    renderModal({
      relatedAppSets: [mockAppSet],
      relatedPolicies: [mockPolicy],
      relatedPolicySets: [mockPolicySet],
      relatedGitOpsClusters: [mockGitOpsCluster],
    })
    expect(screen.getByText(/my-appset/)).toBeInTheDocument()
    expect(screen.getByText(/my-policy \[Policy\]/)).toBeInTheDocument()
    expect(screen.getByText(/my-policyset \[PolicySet\]/)).toBeInTheDocument()
    expect(screen.getByText(/my-gitops/)).toBeInTheDocument()
  })

  test('calls deleteApplication and closes on successful delete', async () => {
    mockDeleteApplication.mockReturnValue({ promise: Promise.resolve(undefined) })
    const { props } = renderModal()
    await userEvent.click(screen.getByText('Delete'))
    await waitFor(() => expect(mockDeleteApplication).toHaveBeenCalledWith(mockPlacement, [], undefined))
    await waitFor(() => expect(props.close).toHaveBeenCalled())
  })

  test('shows error alert on delete failure', async () => {
    mockDeleteApplication.mockReturnValue({ promise: Promise.reject(new Error('Network error')) })
    const { props } = renderModal()
    await userEvent.click(screen.getByText('Delete'))
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
    expect(screen.getByText('Failed to delete placement')).toBeInTheDocument()
    expect(props.close).not.toHaveBeenCalled()
  })

  test('shows string error on delete failure with non-Error', async () => {
    mockDeleteApplication.mockReturnValue({ promise: Promise.reject('something went wrong') })
    renderModal()
    await userEvent.click(screen.getByText('Delete'))
    await waitFor(() => expect(screen.getByText('something went wrong')).toBeInTheDocument())
  })

  test('calls close on Cancel click', async () => {
    const { props } = renderModal()
    await userEvent.click(screen.getByText('Cancel'))
    expect(props.close).toHaveBeenCalled()
  })

  test('displays warning alert when appSetFetchError is provided', () => {
    renderModal({ appSetFetchError: 'Failed to list resources' })
    expect(
      screen.getByText('Failed to fetch ApplicationSets, the related resources list might not be accurate.')
    ).toBeInTheDocument()
  })

  test('uses fallback key when uid is undefined', () => {
    const appSetNoUid: ApplicationSet = {
      ...mockAppSet,
      metadata: { ...mockAppSet.metadata, uid: undefined },
    }
    renderModal({ relatedAppSets: [appSetNoUid] })
    expect(screen.getByText(/my-appset/)).toBeInTheDocument()
  })
})
