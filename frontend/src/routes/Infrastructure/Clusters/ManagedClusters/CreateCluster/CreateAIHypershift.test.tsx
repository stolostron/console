/* Copyright Contributors to the Open Cluster Management project */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    agentsState,
    clusterImageSetsState,
    infraEnvironmentsState,
    managedClusterSetsState,
    managedClustersState,
} from '../../../../../atoms'

import { nockCreate, nockIgnoreRBAC, nockList } from '../../../../../lib/nock-util'
import { clickByTestId, clickByText, typeByTestId, waitForNocks, waitForText } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../../resources'
import CreateClusterPage from './CreateCluster'
import {
    baseDomain,
    clusterName,
    mockAgent2,
    mockAgents,
    mockClusterImageSet,
    mockClusterProject,
    mockClusterProjectResponse,
    mockTestInfraNoAgents,
    mockTestInfraWithAgents,
    mockTestInfraWithAgents2,
    publicSSHKey,
    pullSecretAI,
} from './CreateCluster.sharedmocks'
import {
    createHostedClusterMock,
    createKlusterletMock,
    createMCMock,
    createNodePoolMock,
    createPublicSSHKeySecretMock,
    createPullSecretMock,
} from './CreateClusterHypershift.mocks'

describe('Hypershift BM cluster', () => {
    const Component = () => {
        return (
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(managedClusterSetsState, [])
                    snapshot.set(agentsState, [...mockAgents, mockAgent2])
                    snapshot.set(infraEnvironmentsState, [
                        mockTestInfraWithAgents,
                        mockTestInfraWithAgents2,
                        mockTestInfraNoAgents,
                    ])
                    snapshot.set(clusterImageSetsState, mockClusterImageSet)
                }}
            >
                <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?infrastructureType=CIMHypershift`]}>
                    <Route path={NavigationPath.createCluster}>
                        <CreateClusterPage />
                    </Route>
                </MemoryRouter>
            </RecoilRoot>
        )
    }

    let consoleInfos: string[]
    const originalConsoleInfo = console.info
    const originalConsoleGroup = console.group
    const originalConsoleGroupCollapsed = console.groupCollapsed

    beforeEach(() => {
        nockIgnoreRBAC()
        consoleInfos = []
        console.info =
            console.groupCollapsed =
            console.group =
                (message?: any, ...optionalParams: any[]) => {
                    if (message) {
                        consoleInfos = [...consoleInfos, message, ...optionalParams]
                    }
                }
    })

    afterEach(() => {
        console.info = originalConsoleInfo
        console.group = originalConsoleGroup
        console.groupCollapsed = originalConsoleGroupCollapsed
    })

    test(
        'can create',
        async () => {
            const initialNocks: Scope[] = [
                nockList({ apiVersion: ClusterImageSetApiVersion, kind: ClusterImageSetKind }, mockClusterImageSet),
            ]
            render(<Component />)

            // wait for tables/combos to fill in
            await waitForNocks(initialNocks)

            // check integration of AI in the left-side navigation
            await waitForText('Cluster details', true)
            await waitForText('Nodepools', true)
            await waitForText('Network')
            await waitForText('Automation')
            await waitForText('Review')

            // fill-in Cluster details
            await typeByTestId('form-input-name-field', clusterName)
            await typeByTestId('form-input-baseDnsDomain-field', baseDomain)

            await waitForText('OpenShift 4.8.15') // single value of combobox

            await clickByTestId('form-input-pullSecret-field')
            await typeByTestId('form-input-pullSecret-field', pullSecretAI)

            // transition to Nodepools
            await clickByText('Next')

            await waitForText('Nodepools', true)

            expect((screen.getByText('test') as HTMLOptionElement).selected).toBeTruthy()
            expect((screen.getByText('test2') as HTMLOptionElement).selected).toBeFalsy()
            expect(screen.queryByText('noagents')).toBeNull()

            await waitForText('ai:Maximum availability 5')

            // transition to Networking
            await clickByText('Next')

            await waitForText('192.168.122.0/24 (192.168.122.0 - 192.168.122.255)')

            fireEvent.change(screen.getByTestId('sshPublicKey'), { target: { value: publicSSHKey } })

            // transition to Automation
            await clickByText('Next')

            // transition to Review
            await clickByText('Next')

            await clickByText('Create')

            // nocks for cluster creation
            const createNocks = [
                // create namespace (project)
                nockCreate(mockClusterProject, mockClusterProjectResponse),

                nockCreate(createHostedClusterMock),
                nockCreate(createPullSecretMock),
                nockCreate(createPublicSSHKeySecretMock),
                nockCreate(createNodePoolMock),
                nockCreate(createMCMock),
                nockCreate(createKlusterletMock),
            ]

            // make sure creating
            await waitForNocks(createNocks)
        },
        2 * 60 * 1000
    )

    test(
        'warns when there are 0 hosts',
        async () => {
            const initialNocks: Scope[] = [
                nockList({ apiVersion: ClusterImageSetApiVersion, kind: ClusterImageSetKind }, mockClusterImageSet),
            ]
            render(<Component />)

            // wait for tables/combos to fill in
            await waitForNocks(initialNocks)

            // fill-in Cluster details
            await typeByTestId('form-input-name-field', clusterName)
            await typeByTestId('form-input-baseDnsDomain-field', baseDomain)

            await waitForText('OpenShift 4.8.15') // single value of combobox

            await clickByTestId('form-input-pullSecret-field')
            await typeByTestId('form-input-pullSecret-field', pullSecretAI)

            // transition to Nodepools
            await clickByText('Next')

            await waitForText('Nodepools', true)

            await waitForText(`nodepool-${clusterName}-1`)

            const minusBtn = screen
                .getByTestId('form-numberinput-nodePools-0-count-count-field')
                .querySelector('.pf-c-button')

            expect(minusBtn).toBeTruthy()
            userEvent.click(minusBtn!)

            await waitForText('ai: The cluster has 0 hosts. No workloads will be able to run.')

            await clickByText('ai:Add Nodepool')
            await waitForText(`nodepool-${clusterName}-2`)

            expect(screen.queryByText('ai: The cluster has 0 hosts. No workloads will be able to run.')).toBeNull()

            const minusBtn1 = screen
                .getByTestId('form-numberinput-nodePools-1-count-count-field')
                .querySelector('.pf-c-button')

            expect(minusBtn1).toBeTruthy()
            userEvent.click(minusBtn1!)

            await waitForText('ai: The cluster has 0 hosts. No workloads will be able to run.')
        },
        2 * 60 * 1000
    )
})
