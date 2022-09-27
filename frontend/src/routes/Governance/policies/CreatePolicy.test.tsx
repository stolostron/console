/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    policiesState,
    namespacesState,
    placementsState,
    placementRulesState,
    managedClustersState,
} from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByText, waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicy } from './CreatePolicy'
import { mockPolicy } from '../governance.sharedMocks'
import { ManagedCluster, Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources'
import userEvent from '@testing-library/user-event'

const namespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'test',
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
                    snapshot.set(policiesState, [])
                    snapshot.set(namespacesState, [namespace])
                    snapshot.set(managedClustersState, mockManagedClusters)
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
        // create form
        render(<Component />)

        await new Promise((resolve) => setTimeout(resolve, 500))

        // step 1 -- name and namespace
        userEvent.type(
            screen.getByRole('textbox', {
                name: 'Name',
            }),
            mockPolicy[0].metadata.name!
        )

        screen.getByText(/select namespace/i).click()
        userEvent.type(screen.getByRole('searchbox'), mockPolicy[0].metadata.namespace!)

        screen
            .getByRole('option', {
                name: /test/i,
            })
            .click()
        screen
            .getByRole('button', {
                name: /next/i,
            })
            .click()

        // step 2 -- policy templates

        // policy-certificate-1
        await waitForText('Templates')
        screen
            .getByRole('button', {
                name: /add policy template/i,
            })
            .click()
        screen.getByText(/certificate management expiration/i).click()
        screen
            .getByRole('button', {
                name: /next/i,
            })
            .click()
        // policy-imagemanifestb

        // // // step 3 -- placement

        await waitForText('How do you want to select clusters?')
        screen
            .getByRole('button', {
                name: /new placement/i,
            })
            .click()

        screen
            .getByRole('button', {
                name: /action/i,
            })
            .click()
        screen.getByText(/select the label/i).click()
        screen
            .getByRole('option', {
                name: /cloud/i,
            })
            .click()
        screen.getByText(/select the values/i).click()
        screen
            .getByRole('checkbox', {
                name: /amazon/i,
            })
            .click()
        screen
            .getByRole('button', {
                name: /next/i,
            })
            .click()

        // // // step 4 -- Policy annotations
        screen
            .getByRole('button', {
                name: /next/i,
            })
            .click()

        // // // step 5 -- Review
        expect(
            screen.getByRole('heading', {
                name: /details/i,
            })
        ).toBeInTheDocument()

        // const createNock = [nockCreate(mockPolicy[0])]
        // screen
        //     .getByRole('button', {
        //         name: /submit/i,
        //     })
        //     .click()

        // await waitForNocks(createNock)
    })

    test('can cancel create policy', async () => {
        render(<Component />)
        await waitForText('Create policy')
        await clickByText('Cancel')
        await waitForNotText('Cancel')
    })
})
