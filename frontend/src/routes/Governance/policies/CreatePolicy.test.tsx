/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    policiesState,
    namespacesState,
    placementsState,
    placementRulesState,
    managedClustersState,
    managedClusterSetsState,
    managedClusterSetBindingsState,
} from '../../../atoms'
import { nockIgnoreRBAC, nockGet } from '../../../lib/nock-util'
import { clickByText, typeByTestId, waitForNocks, waitForSelector, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicy } from './CreatePolicy'
import { EditPolicy } from './EditPolicy'
import { policyName, policyNamespace, mockPolicy } from './Policy.sharedMocks'
import {
    ManagedCluster,
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
    ManagedClusterSetKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
} from '../../../resources'

const namespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'default',
    },
}

const clusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'cluster-set-01',
        namespace: 'argo-server-1',
    },
    spec: {
        clusterSet: 'cluster-set-01',
    },
}

const clusterSetBinding: ManagedClusterSetBinding = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
    metadata: {
        name: 'cluster-set-binding-01',
        namespace: 'default',
    },
    spec: {
        clusterSet: 'cluster-set-01',
    },
}

const mockLocalCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: {
            cloud: 'Amazon',
            name: 'local-cluster',
            openshiftVersion: '4.9.7',
            vendor: 'OpenShift',
        },
        name: 'local-cluster',
    },
}

const mockManagedClusters: ManagedCluster[] = [mockLocalCluster]

describe('Create Policy Page', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(placementsState, [])
                    snapshot.set(placementRulesState, [])
                    snapshot.set(policiesState, mockPolicy)
                    snapshot.set(namespacesState, [namespace])
                    snapshot.set(managedClustersState, mockManagedClusters)
                    snapshot.set(managedClusterSetsState, [clusterSet])
                    snapshot.set(managedClusterSetBindingsState, [clusterSetBinding])
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.createPolicy}`]}>
                    <Route path={NavigationPath.createPolicy}>
                        <CreatePolicy />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can create policy', async () => {
        const initialNocks = [nockGet(mockPolicy[0])]

        // create form
        const { container } = render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // wait for nocks
        await waitForNocks(initialNocks)

        // step 1 -- name and namespace
        await typeByTestId('name', policyName!)
        await typeByTestId('namespace', policyNamespace!)
        container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item:first-of-type')?.click()
        await clickByText('Next')

        // step 2 -- policy templates
        await waitForText('Templates')
        await clickByText('Add policy template')
        await waitForText('Certificate management expiration')
        container.querySelector<HTMLButtonElement>('.pf-c-dropdown__menu-item:first-of-type')?.click()
        await waitForText('policy-certificate')
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()

        // // step 3 -- placement
        await waitForText('How do you want to select clusters?')
        await clickByText('New placement')
        await clickByText('Add label expression')
        await clickByText('Select the label')
        container.querySelector<HTMLButtonElement>('.pf-c-select__menu-wrapper:first-of-type')?.click()
        await clickByText('Select the values')
        container.querySelector<HTMLInputElement>('.pf-c-select__menu-item > input.pf-c-check__input')?.click()
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()

        // // step 4 -- Policy annotations
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()

        // // step 5 -- Review
        await waitForSelector(container, 'pf-c-description-list #details')
        container.querySelector<HTMLButtonElement>('.pf-c-wizard__footer > button')?.click()
    })

    test('can render Edit Policy Page', async () => {
        window.scrollBy = () => {}
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, [mockPolicy[1]])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.editPolicy]}>
                    <Route
                        component={(props: any) => {
                            const newProps = { ...props }
                            newProps.match = props.match || { params: {} }
                            newProps.match.params.name = mockPolicy[1]?.metadata.name
                            newProps.match.params.namespace = mockPolicy[1]?.metadata.namespace
                            return <EditPolicy {...newProps} />
                        }}
                    />
                </MemoryRouter>
            </RecoilRoot>
        )
        await new Promise((resolve) => setTimeout(resolve, 500))
    })
})
