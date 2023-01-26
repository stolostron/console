/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import i18next from 'i18next'
import { PlacementRuleKind, Subscription, SubscriptionApiVersion, SubscriptionKind } from '../../../resources'
import { SyncResourceModal, ISyncResourceModalProps } from './SyncResourceModal'

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
        kind: PlacementRuleKind,
        name: 'placementrule-0',
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

describe('Sync Resource Modal', () => {
  it('should render Argo app Helm', async () => {
    const { getByText } = render(<SyncResourceModal {...modalProps} />)
    expect(getByText('Sync application')).toBeTruthy()
    expect(getByText('Synchronize application resources with the source repository.')).toBeTruthy()
  })
})
