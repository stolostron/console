/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import i18next from 'i18next'
import { SubscriptionApiVersion, SubscriptionKind } from '../../../resources'
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

const t = i18next.t
const modalProps: ISyncResourceModalProps = {
    open: true,
    close: () => {},
    t: t,
    resources: mockResources,
}

//////////////// Test /////////////////

describe('Sync Resource Modal', () => {
    it('should render Argo app Helm', async () => {
        const { getByText } = render(<SyncResourceModal {...modalProps} />)
        expect(getByText('Sync application')).toBeTruthy()
        expect(getByText('Synchronize application resources with the source repository.')).toBeTruthy()
    })
})
