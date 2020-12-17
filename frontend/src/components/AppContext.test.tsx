import React, { useContext } from 'react'
import { render, waitFor, screen } from '@testing-library/react'
import { AppContextContainer, AppContext } from './AppContext'
import { nockClusterList, mockBadRequestStatus } from '../lib/nock-util'
import { FeatureGateKind, FeatureGateApiVersion } from '../resources/feature-gate'
import { ClusterManagementAddOnKind, ClusterManagementAddOnApiVersion } from '../resources/cluster-management-add-on'

const mockFeatureGates = {
    apiVersion: 'config.openshift.io/v1',
    items: [
        {
            apiVersion: 'config.openshift.io/v1',
            kind: 'FeatureGate',
            metadata: {
                annotations: { 'release.openshift.io/create-only': 'true' },
                creationTimestamp: '2020-10-20T14:30:01Z',
                generation: 1,
                name: 'open-cluster-management-discovery',
                resourceVersion: '1726',
                selfLink: '/apis/config.openshift.io/v1/featuregates/open-cluster-management-discovery',
                uid: 'fb86ce80-9236-4a86-8bfd-13323ac37963',
            },
            spec: {},
        },
    ],
    kind: 'FeatureGateList',
    metadata: { continue: '', resourceVersion: '72574817', selfLink: '/apis/config.openshift.io/v1/featuregates' },
}

const mockClusterManagementAddons = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    items: [
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                annotations: {
                    'console.open-cluster-management.io/launch-link': '/cma/grafana',
                    'console.open-cluster-management.io/launch-link-text': 'Grafana',
                },
                creationTimestamp: '2020-12-17T15:57:43Z',
                generation: 1,
                name: 'application-manager',
                resourceVersion: '72535245',
                selfLink: '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons/application-manager',
                uid: '9b3fa615-7bf3-49d0-a7e4-40ea80e157f9',
            },
            spec: {
                addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
                addOnMeta: {
                    description: 'Processes events and other requests to managed resources.',
                    displayName: 'Application Manager',
                },
            },
        },
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                creationTimestamp: '2020-12-17T15:57:43Z',
                generation: 1,
                name: 'cert-policy-controller',
                resourceVersion: '72429629',
                selfLink:
                    '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons/cert-policy-controller',
                uid: '690d53b8-7b74-4687-8532-86e80ab5b51e',
            },
            spec: {
                addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
                addOnMeta: {
                    description: 'Monitors certificate expiration based on distributed policies.',
                    displayName: 'Cert Policy Controller',
                },
            },
        },
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                creationTimestamp: '2020-12-17T15:57:43Z',
                generation: 1,
                name: 'iam-policy-controller',
                resourceVersion: '72429630',
                selfLink:
                    '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons/iam-policy-controller',
                uid: '764be62d-4ee5-40ee-be92-6404dbd8619e',
            },
            spec: {
                addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
                addOnMeta: {
                    description: 'Monitors identity controls based on distributed policies.',
                    displayName: 'IAM Policy Controller',
                },
            },
        },
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                creationTimestamp: '2020-12-17T15:57:43Z',
                generation: 1,
                name: 'policy-controller',
                resourceVersion: '72429631',
                selfLink: '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons/policy-controller',
                uid: 'c5b2e5f2-df96-4cff-ac07-b6ae61ff0a70',
            },
            spec: {
                addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
                addOnMeta: {
                    description: 'Distributes configured policies and monitors Kubernetes-based policies.',
                    displayName: 'Policy Controller',
                },
            },
        },
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                creationTimestamp: '2020-12-17T15:57:43Z',
                generation: 1,
                name: 'search-collector',
                resourceVersion: '72429633',
                selfLink: '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons/search-collector',
                uid: 'ba1fdc6f-b6ed-4c6d-9d6f-a0f6c7551eeb',
            },
            spec: {
                addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
                addOnMeta: {
                    description: 'Collects cluster data to be indexed by search components on the hub cluster.',
                    displayName: 'Search Collector',
                },
            },
        },
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                creationTimestamp: '2020-12-17T15:57:43Z',
                generation: 1,
                name: 'work-manager',
                resourceVersion: '72429634',
                selfLink: '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons/work-manager',
                uid: '4d08adc0-ea0c-4de2-8bf3-640f436ee52d',
            },
            spec: {
                addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
                addOnMeta: {
                    description: 'Handles endpoint work requests and managed cluster status.',
                    displayName: 'Work Manager',
                },
            },
        },
    ],
    kind: 'ClusterManagementAddOnList',
    metadata: {
        continue: '',
        resourceVersion: '72574817',
        selfLink: '/apis/addon.open-cluster-management.io/v1alpha1/clustermanagementaddons',
    },
}

const nockFeatureGates = () =>
    nockClusterList(
        {
            apiVersion: FeatureGateApiVersion,
            kind: FeatureGateKind,
        },
        mockFeatureGates
    )

const nockFeatureGatesError = () =>
    nockClusterList(
        {
            apiVersion: FeatureGateApiVersion,
            kind: FeatureGateKind,
        },
        mockBadRequestStatus
    )

const nockClusterManagementAddons = () =>
    nockClusterList(
        {
            apiVersion: ClusterManagementAddOnApiVersion,
            kind: ClusterManagementAddOnKind,
        },
        mockClusterManagementAddons
    )

const nockClusterManagementAddonsError = () =>
    nockClusterList(
        {
            apiVersion: ClusterManagementAddOnApiVersion,
            kind: ClusterManagementAddOnKind,
        },
        mockBadRequestStatus
    )

describe('AppContextContainer', () => {
    const ContextCheck = () => {
        const { clusterManagementAddons, featureGates } = useContext(AppContext)
        if (clusterManagementAddons.length > 0 && !!featureGates) {
            return <div>Context exists</div>
        } else {
            return <div>Context missing</div>
        }
    }
    const Component = () => (
        <div>
            <AppContextContainer>
                <div />
                <ContextCheck />
            </AppContextContainer>
        </div>
    )
    test('fetches', async () => {
        const featureGates = nockFeatureGates()
        const clusterManagementAddons = nockClusterManagementAddons()
        render(<Component />)
        await waitFor(() => expect(featureGates.isDone()).toBeTruthy())
        await waitFor(() => expect(clusterManagementAddons.isDone()).toBeTruthy())
        await waitFor(() => expect(screen.getByText('Context exists')).toBeInTheDocument())
    })
    test('prints error to browser console', async () => {
        console.error = jest.fn()
        const featureGates = nockFeatureGatesError()
        const clusterManagementAddons = nockClusterManagementAddonsError()
        render(<Component />)
        await waitFor(() => expect(featureGates.isDone()).toBeTruthy())
        await waitFor(() => expect(clusterManagementAddons.isDone()).toBeTruthy())
        await new Promise((resolve) => setTimeout(resolve, 100)) // need to wait for component update
        await waitFor(() => expect(screen.getByText('Context missing')).toBeInTheDocument())
        expect(console.error).toHaveBeenCalledTimes(2)
    })
})
