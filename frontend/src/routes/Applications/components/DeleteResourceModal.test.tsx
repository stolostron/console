/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import i18n from 'i18next'
import {
    ApplicationApiVersion,
    ApplicationKind,
    ApplicationSetApiVersion,
    ApplicationSetKind,
    IResource,
} from '../../../resources'
import { DeleteResourceModal } from './DeleteResourceModal'
import userEvent from '@testing-library/user-event'

const t = i18n.t.bind(i18n)

describe('DeleteResourceModal', () => {
    it('should render delete ACM app no related resources', () => {
        const resource: IResource = {
            apiVersion: ApplicationApiVersion,
            kind: ApplicationKind,
            metadata: {
                name: 'acmapp',
                namespace: 'acmapp-ns',
            },
        }

        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={[]}
                shared={[]}
                appSetPlacement=""
                appSetsSharingPlacement={[]}
                appKind={resource.kind}
                appSetApps={[]}
                close={() => void {}}
                t={t}
            />
        )

        expect(getByText('Permanently delete Application acmapp?')).toBeTruthy()
    })

    it('should render delete ACM app with some related resources', () => {
        const resource: IResource = {
            apiVersion: ApplicationApiVersion,
            kind: ApplicationKind,
            metadata: {
                name: 'acmapp2',
                namespace: 'acmapp2-ns',
            },
        }

        const selected: any[] = [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                id: 'subscriptions-feng-feng-mortgagers-subscription',
                kind: 'Subscription',
                label: 'feng-mortgagers-subscription [Subscription]',
                name: 'feng-mortgagers-subscription',
                namespace: 'feng',
                subChildResources: [],
            },
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                id: 'rules-feng-mortgagers-placement',
                kind: 'PlacementRule',
                label: 'mortgagers-placement [PlacementRule]',
                name: 'mortgagers-placement',
                namespace: 'feng',
            },
        ]

        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={selected}
                shared={[]}
                appSetPlacement=""
                appSetsSharingPlacement={[]}
                appKind={resource.kind}
                appSetApps={[]}
                close={() => void {}}
                t={t}
            />
        )

        expect(getByText('Permanently delete Application acmapp2?')).toBeTruthy()
        userEvent.click(screen.getAllByRole('checkbox')[0])
        expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
        expect(getByText('feng-mortgagers-subscription [Subscription]')).toBeTruthy()
        expect(getByText('mortgagers-placement [PlacementRule]')).toBeTruthy()
    })

    it('should render delete ACM app with shared resources', () => {
        const resource: IResource = {
            apiVersion: ApplicationApiVersion,
            kind: ApplicationKind,
            metadata: {
                name: 'acmapp3',
                namespace: 'acmapp3-ns',
            },
        }

        const selected: any[] = [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                id: 'subscriptions-feng-feng-mortgagers-subscription',
                kind: 'Subscription',
                label: 'feng-mortgagers-subscription [Subscription]',
                name: 'feng-mortgagers-subscription',
                namespace: 'feng',
                subChildResources: [],
            },
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                id: 'rules-feng-mortgagers-placement',
                kind: 'PlacementRule',
                label: 'mortgagers-placement [PlacementRule]',
                name: 'mortgagers-placement',
                namespace: 'feng',
            },
        ]

        const shared: any[] = [
            {
                id: 'rules-feng-mortgagers-placement-2',
                label: 'mortgagers-placement-2 [PlacementRule]',
                siblingSubs: ['feng-temp-app-subscription'],
            },
        ]

        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={selected}
                shared={shared}
                appSetPlacement=""
                appSetsSharingPlacement={[]}
                appKind={resource.kind}
                appSetApps={[]}
                close={() => void {}}
                t={t}
            />
        )

        expect(getByText('This application uses the following shared resources, which are not removable:')).toBeTruthy()
        expect(getByText('mortgagers-placement-2 [PlacementRule]')).toBeTruthy()
        expect(getByText('Shared with:')).toBeTruthy()
        expect(getByText('feng-temp-app-subscription')).toBeTruthy()
    })

    it('should render delete ACM app with sub child resources', () => {
        const resource: IResource = {
            apiVersion: ApplicationApiVersion,
            kind: ApplicationKind,
            metadata: {
                name: 'acmapp4',
                namespace: 'acmapp4-ns',
            },
        }

        const selected: any[] = [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
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
                apiVersion: 'apps.open-cluster-management.io/v1',
                id: 'rules-feng-mortgagers-placement',
                kind: 'PlacementRule',
                label: 'mortgagers-placement [PlacementRule]',
                name: 'mortgagers-placement',
                namespace: 'feng',
            },
        ]

        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={selected}
                shared={[]}
                appSetPlacement=""
                appSetsSharingPlacement={[]}
                appKind={resource.kind}
                appSetApps={[]}
                close={() => void {}}
                t={t}
            />
        )

        expect(getByText('This subscription deploys the following resources, which will be removed:')).toBeTruthy()
        expect(
            getByText(
                'demo-etherpad [Application], demo-saude-digital-streams [Application], demo-saude-digital-streams [Subscription], demo-etherpad [Subscription]'
            )
        ).toBeTruthy()
    })

    it('should render delete appset without placement', () => {
        const resource: IResource = {
            apiVersion: ApplicationSetApiVersion,
            kind: ApplicationSetKind,
            metadata: {
                name: 'appset1',
                namespace: 'appset1-ns',
            },
        }

        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={[]}
                shared={[]}
                appSetPlacement=""
                appSetsSharingPlacement={[]}
                appKind={resource.kind}
                appSetApps={[]}
                close={() => void {}}
                t={t}
            />
        )

        expect(getByText('Permanently delete ApplicationSet appset1?')).toBeTruthy()
    })

    it('should render delete appset with placement', () => {
        const resource: IResource = {
            apiVersion: ApplicationSetApiVersion,
            kind: ApplicationSetKind,
            metadata: {
                name: 'appset2',
                namespace: 'appset2-ns',
            },
        }

        const appSetPlacement = 'appset2-placement'
        const appSetApps = ['appset2-local-cluster']
        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={[]}
                shared={[]}
                appSetPlacement={appSetPlacement}
                appSetsSharingPlacement={[]}
                appKind={resource.kind}
                appSetApps={appSetApps}
                close={() => void {}}
                t={t}
            />
        )

        expect(getByText('Permanently delete ApplicationSet appset2?')).toBeTruthy()
        expect(
            getByText('The following Argo application(s) deployed by the application set will also be deleted:')
        ).toBeTruthy()
        expect(getByText('appset2-local-cluster')).toBeTruthy()
        userEvent.click(screen.getAllByRole('checkbox')[0])
        expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
        expect(getByText('appset2-placement [Placement]')).toBeTruthy()
    })

    it('should render delete appset with shared placement', () => {
        const resource: IResource = {
            apiVersion: ApplicationSetApiVersion,
            kind: ApplicationSetKind,
            metadata: {
                name: 'appset3',
                namespace: 'appset3-ns',
            },
        }

        const appSetPlacement = 'appset3-placement'
        const appSetApps = ['appset3-local-cluster']
        const appSetsSharingPlacement = ['appset4']
        const { getByText } = render(
            <DeleteResourceModal
                open={true}
                canRemove={true}
                resource={resource}
                errors={undefined}
                warnings={undefined}
                loading={false}
                selected={[]}
                shared={[]}
                appSetPlacement={appSetPlacement}
                appSetsSharingPlacement={appSetsSharingPlacement}
                appKind={resource.kind}
                appSetApps={appSetApps}
                close={() => void {}}
                t={t}
            />
        )

        expect(
            getByText(
                'This application set uses placement "appset3-placement", which is not removable. This placement is shared by the following application set:'
            )
        ).toBeTruthy()
        expect(getByText('appset4')).toBeTruthy()
    })
})
