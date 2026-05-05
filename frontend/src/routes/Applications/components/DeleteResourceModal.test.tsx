/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import i18n from 'i18next'
import {
  ApplicationApiVersion,
  ApplicationKind,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  IResource,
} from '../../../resources'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { DeleteResourceModal, IDeleteResourceModalProps } from './DeleteResourceModal'
import { nockIgnoreApiPaths } from '../../../lib/nock-util'
import { clickByRole, waitForText } from '../../../lib/test-util'

const t = i18n.t.bind(i18n)

const mockDeleteApplication = jest.fn()
jest.mock('../../../lib/delete-application', () => ({
  deleteApplication: (...args: unknown[]) => mockDeleteApplication(...args),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}))

function renderModal(overrides: Partial<IDeleteResourceModalProps> = {}) {
  const defaultProps: IDeleteResourceModalProps = {
    open: true,
    canRemove: true,
    resource: {
      apiVersion: ApplicationApiVersion,
      kind: ApplicationKind,
      metadata: { name: 'test-app', namespace: 'test-ns' },
    },
    loading: false,
    selected: [],
    shared: [],
    appSetPlacement: '',
    appSetsSharingPlacement: [],
    appKind: ApplicationKind,
    appSetApps: [],
    deleted: jest.fn(),
    close: jest.fn(),
    t,
    ...overrides,
  }
  return {
    ...render(
      <MemoryRouter>
        <DeleteResourceModal {...defaultProps} />
      </MemoryRouter>
    ),
    props: defaultProps,
  }
}

describe('DeleteResourceModal', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    mockDeleteApplication.mockReset()
    mockNavigate.mockReset()
  })

  it('should render nothing when open is false', () => {
    render(
      <MemoryRouter>
        <DeleteResourceModal open={false} />
      </MemoryRouter>
    )
    expect(screen.queryByText(/permanently delete/i)).not.toBeInTheDocument()
  })

  it('should render delete ACM app no related resources', async () => {
    mockDeleteApplication.mockReturnValue({ promise: Promise.resolve([]) })
    const { props } = renderModal()

    await waitForText('Permanently delete Application test-app?')
    await clickByRole('button', { name: /delete/i })
    await waitFor(() => expect(props.close).toHaveBeenCalled())
  })

  it('should render delete ACM app with some related resources', async () => {
    const resource: IResource = {
      apiVersion: ApplicationApiVersion,
      kind: ApplicationKind,
      metadata: { name: 'acmapp2', namespace: 'acmapp2-ns' },
    }

    const selected: any[] = [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        id: 'subscriptions-feng-feng-mortgagers-subscription',
        kind: 'Subscription',
        label: 'feng-mortgagers-subscription [Subscription]',
        name: 'feng-mortgagers-subscription',
        namespace: 'feng',
        subChildResources: [],
      },
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        id: 'rules-feng-mortgagers-placement',
        kind: 'Placement',
        label: 'mortgagers-placement [Placement]',
        name: 'mortgagers-placement',
        namespace: 'feng',
      },
    ]

    const { props } = renderModal({ resource, selected, appKind: resource.kind })

    await waitForText('Permanently delete Application acmapp2?')
    await clickByRole('checkbox', undefined, 0)
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    await waitForText('feng-mortgagers-subscription [Subscription]')
    await waitForText('mortgagers-placement [Placement]')
    await clickByRole('button', { name: /cancel/i })
    expect(props.close).toHaveBeenCalled()
  })

  it('should render delete ACM app with shared resources', () => {
    const resource: IResource = {
      apiVersion: ApplicationApiVersion,
      kind: ApplicationKind,
      metadata: { name: 'acmapp3', namespace: 'acmapp3-ns' },
    }

    const selected: any[] = [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        id: 'subscriptions-feng-feng-mortgagers-subscription',
        kind: 'Subscription',
        label: 'feng-mortgagers-subscription [Subscription]',
        name: 'feng-mortgagers-subscription',
        namespace: 'feng',
        subChildResources: [],
      },
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        id: 'rules-feng-mortgagers-placement',
        kind: 'Placement',
        label: 'mortgagers-placement [Placement]',
        name: 'mortgagers-placement',
        namespace: 'feng',
      },
    ]

    const shared: any[] = [
      {
        id: 'rules-feng-mortgagers-placement-2',
        label: 'mortgagers-placement-2 [Placement]',
        siblingSubs: ['feng-temp-app-subscription'],
      },
    ]

    renderModal({ resource, selected, shared, appKind: resource.kind })

    expect(
      screen.getByText('This application uses the following shared resources, which are not removable:')
    ).toBeTruthy()
    expect(screen.getByText('mortgagers-placement-2 [Placement]')).toBeTruthy()
    expect(screen.getByText('Shared with:')).toBeTruthy()
    expect(screen.getByText('feng-temp-app-subscription')).toBeTruthy()
  })

  it('should render delete ACM app with sub child resources', () => {
    const resource: IResource = {
      apiVersion: ApplicationApiVersion,
      kind: ApplicationKind,
      metadata: { name: 'acmapp4', namespace: 'acmapp4-ns' },
    }

    const selected: any[] = [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        id: 'subscriptions-feng-feng-mortgagers-subscription',
        kind: 'Subscription',
        label: 'feng-mortgagers-subscription [Subscription]',
        name: 'feng-mortgagers-subscription',
        namespace: 'feng',
        subChildResources: [
          'demo-etherpad [Application]',
          'demo-saude-digital-streams [Application]',
          'demo-saude-digital-streams [Subscription]',
          'demo-etherpad [Subscription]',
        ],
      },
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        id: 'rules-feng-mortgagers-placement',
        kind: 'Placement',
        label: 'mortgagers-placement [Placement]',
        name: 'mortgagers-placement',
        namespace: 'feng',
      },
    ]

    renderModal({ resource, selected, appKind: resource.kind })

    expect(screen.getByText('This subscription deploys the following resources, which will be removed:')).toBeTruthy()
    expect(
      screen.getByText(
        'demo-etherpad [Application], demo-saude-digital-streams [Application], demo-saude-digital-streams [Subscription], demo-etherpad [Subscription]'
      )
    ).toBeTruthy()
  })

  it('should render delete appset without placement', async () => {
    const resource: IResource = {
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: { name: 'appset1', namespace: 'appset1-ns' },
    }

    mockDeleteApplication.mockReturnValue({ promise: Promise.resolve([]) })
    const { props } = renderModal({ resource, appKind: resource.kind })

    await waitForText('Permanently delete ApplicationSet appset1?')
    await clickByRole('button', { name: /delete/i })
    await waitFor(() => expect(props.close).toHaveBeenCalled())
  })

  it('should render delete appset with placement', async () => {
    const resource: IResource = {
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: { name: 'appset2', namespace: 'appset2-ns' },
    }

    renderModal({
      resource,
      appKind: resource.kind,
      appSetPlacement: 'appset2-placement',
      appSetApps: ['appset2-local-cluster'],
    })

    expect(screen.getByText('Permanently delete ApplicationSet appset2?')).toBeTruthy()
    expect(
      screen.getByText('The following Argo application(s) deployed by the application set will also be deleted:')
    ).toBeTruthy()
    await waitForText('appset2-local-cluster')
    await clickByRole('checkbox', undefined, 0)
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    await waitForText('appset2-placement [Placement]')
  })

  it('should render delete appset with shared placement', () => {
    const resource: IResource = {
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: { name: 'appset3', namespace: 'appset3-ns' },
    }

    renderModal({
      resource,
      appKind: resource.kind,
      appSetPlacement: 'appset3-placement',
      appSetsSharingPlacement: ['appset4'],
      appSetApps: ['appset3-local-cluster'],
    })

    expect(
      screen.getByText(
        'This application set uses placement "appset3-placement", which is not removable. This placement is shared by the following application set:'
      )
    ).toBeTruthy()
    expect(screen.getByText('appset4')).toBeTruthy()
  })

  it('should show error alert when delete fails with Error', async () => {
    mockDeleteApplication.mockImplementation(() => ({
      promise: Promise.reject(new Error('Forbidden: access denied')),
    }))
    const { props } = renderModal()

    await clickByRole('button', { name: /delete/i })
    await waitForText('Forbidden: access denied')
    expect(props.close).not.toHaveBeenCalled()
  })

  it('should show error alert when delete fails with string', async () => {
    mockDeleteApplication.mockImplementation(() => ({
      promise: Promise.reject('something went wrong'),
    }))
    renderModal()

    await clickByRole('button', { name: /delete/i })
    await waitForText('something went wrong')
  })

  it('should show fallback error when delete fails with non-Error/non-string', async () => {
    mockDeleteApplication.mockImplementation(() => ({
      promise: Promise.reject(42),
    }))
    renderModal()

    await clickByRole('button', { name: /delete/i })
    await waitForText('An unknown error occurred.')
  })

  it('should navigate on successful delete when redirect is provided', async () => {
    mockDeleteApplication.mockReturnValue({ promise: Promise.resolve([]) })
    const { props } = renderModal({ redirect: '/applications' })

    await clickByRole('button', { name: /delete/i })
    await waitFor(() => expect(props.close).toHaveBeenCalled())
    expect(mockNavigate).toHaveBeenCalledWith('/applications')
  })

  it('should not navigate on successful delete when no redirect', async () => {
    mockDeleteApplication.mockReturnValue({ promise: Promise.resolve([]) })
    const { props } = renderModal()

    await clickByRole('button', { name: /delete/i })
    await waitFor(() => expect(props.close).toHaveBeenCalled())
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should render warnings alert when warnings prop is provided', () => {
    renderModal({ warnings: 'This app is managed by a subscription' })
    expect(screen.getByText('This app is managed by a subscription')).toBeInTheDocument()
  })

  it('should clear error when cancel is clicked after a failed delete', async () => {
    mockDeleteApplication.mockImplementation(() => ({
      promise: Promise.reject(new Error('Delete failed')),
    }))
    const { props } = renderModal()

    await clickByRole('button', { name: /delete/i })
    await waitForText('Delete failed')

    await clickByRole('button', { name: /cancel/i })
    expect(props.close).toHaveBeenCalled()
  })

  it('should disable delete and cancel buttons while deleting', async () => {
    let resolveDelete: (value: unknown) => void
    mockDeleteApplication.mockReturnValue({
      promise: new Promise((resolve) => {
        resolveDelete = resolve
      }),
    })
    renderModal()

    await clickByRole('button', { name: /delete/i })
    await waitFor(() => expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled())
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()

    resolveDelete!([])
    await waitFor(() => expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled())
  })
})
