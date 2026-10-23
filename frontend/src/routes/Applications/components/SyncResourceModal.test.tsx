/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { Subscription, SubscriptionApiVersion, SubscriptionKind } from '../../../resources'
import { AcmToastContext } from '../../../ui-components'
import { SyncResourceModal, ISyncResourceModalProps } from './SyncResourceModal'

const mockReconcileResources = jest.fn()
jest.mock('../../../resources/utils', () => ({
  ...jest.requireActual('../../../resources/utils'),
  reconcileResources: (...args: unknown[]) => mockReconcileResources(...args),
}))

//////////////// Set up /////////////////

const mockResources = [
  {
    apiVersion: SubscriptionApiVersion,
    kind: SubscriptionKind,
    metadata: {
      name: 'demo-etherpad',
      namespace: 'demo-etherpad',
      annotations: {
        'apps.open-cluster-management.io/cluster-admin': 'true',
        'apps.open-cluster-management.io/reconcile-option': 'merge',
      },
      creationTimestamp: '2022-03-01T21:30:03Z',
    },
  },
]

const mockSubscription0: Subscription = {
  apiVersion: SubscriptionApiVersion,
  kind: SubscriptionKind,
  metadata: {
    name: 'subscription-0',
    namespace: 'namespace-0',
    labels: {
      app: 'application-0-app',
    },
  },
  spec: {
    channel: 'ch-namespace-0/channel-0',
    placement: {
      placementRef: {
        kind: 'Placement',
        name: 'placement-0',
      },
    },
  },
}

const mockSubscriptions: Subscription[] = [mockSubscription0]

const t = i18next.t.bind(i18next)
const modalProps: ISyncResourceModalProps = {
  open: true,
  close: () => {},
  t: t,
  resources: mockResources,
  subscriptions: mockSubscriptions,
}

//////////////// Test /////////////////

function renderModal(mockAddAlert: jest.Mock) {
  render(
    <AcmToastContext.Provider
      value={{
        activeAlerts: [],
        alertInfos: [],
        addAlert: mockAddAlert,
        removeAlert: () => {},
        removeVisibleAlert: () => {},
        clearAlerts: () => {},
        modifyAlert: () => ({ id: '', title: '' }),
      }}
    >
      <SyncResourceModal {...modalProps} close={() => {}} />
    </AcmToastContext.Provider>
  )
}

describe('Sync Resource Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render Argo app Helm', async () => {
    const { getByText } = render(<SyncResourceModal {...modalProps} />)
    expect(getByText('Sync application')).toBeTruthy()
    expect(getByText('Synchronize application resources with the source repository.')).toBeTruthy()
  })

  it('shows a success toast when reconciliation succeeds', async () => {
    mockReconcileResources.mockResolvedValue(undefined)
    const mockAddAlert = jest.fn()
    renderModal(mockAddAlert)

    await userEvent.click(screen.getByText('Synchronize'))

    await waitFor(() =>
      expect(mockAddAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Subscription updated', type: 'success' })
      )
    )
  })

  it('shows a danger toast when reconciliation fails', async () => {
    mockReconcileResources.mockRejectedValue(new Error('sync failed'))
    const mockAddAlert = jest.fn()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderModal(mockAddAlert)

    await userEvent.click(screen.getByText('Synchronize'))

    await waitFor(() =>
      expect(mockAddAlert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Failed to sync', type: 'danger' }))
    )
    consoleError.mockRestore()
  })
})
