/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    applicationSetsState,
    applicationsState,
    argoApplicationsState,
    channelsState,
    managedClusterInfosState,
    managedClustersState,
    namespacesState,
    placementRulesState,
    subscriptionsState,
} from '../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../lib/nock-util'
import { waitForText } from '../../lib/test-util'
import { ApplicationKind, ApplicationSetKind, SubscriptionKind } from '../../resources'
import { PluginContext } from '../../lib/PluginContext'
import { NavigationPath } from '../../NavigationPath'
import ApplicationsPage from './ApplicationsPage'
import {
    mockSearchQuery,
    mockSearchResponse,
    mockSearchQueryOCPApplications,
    mockSearchResponseOCPApplications,
    mockApplications,
    mockSubscriptions,
    mockChannels,
    mockPlacementrules,
    mockManagedClusters,
    mockApplicationSets,
    mockArgoApplications,
    mockManagedClusterInfos,
    mockNamespaces,
    acmExtension,
    mockApplication0,
    mockApplicationSet0,
    mockArgoApplication1,
    mockOCPApplication0,
    mockFluxApplication0,
} from './Application.sharedmocks'
import { PluginDataContext } from '../../lib/PluginDataContext'

describe('Applications Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
        nockSearch(mockSearchQuery, mockSearchResponse)
        nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(applicationsState, mockApplications)
                    snapshot.set(subscriptionsState, mockSubscriptions)
                    snapshot.set(channelsState, mockChannels)
                    snapshot.set(placementRulesState, mockPlacementrules)
                    snapshot.set(managedClustersState, mockManagedClusters)
                    snapshot.set(applicationSetsState, mockApplicationSets)
                    snapshot.set(argoApplicationsState, mockArgoApplications)
                    snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
                    snapshot.set(namespacesState, mockNamespaces)
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.applications]}>
                    <PluginContext.Provider value={{ acmExtensions: acmExtension, dataContext: PluginDataContext }}>
                        <ApplicationsPage />
                    </PluginContext.Provider>
                </MemoryRouter>
            </RecoilRoot>
        )
        // wait for page to load
        await waitForText(mockApplication0.metadata.name!)
    })

    test('should display info', async () => {
        // app
        expect(screen.getByText(SubscriptionKind)).toBeTruthy()
        expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
        expect(screen.getAllByText('Local')).toBeTruthy()
        expect(screen.getAllByText('Git')).toBeTruthy()
        expect(screen.getByText('a few seconds ago')).toBeTruthy()

        // appset
        expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
        expect(screen.getByText(ApplicationSetKind)).toBeTruthy()

        // argo app
        expect(screen.getByText(mockArgoApplication1.metadata.name!)).toBeTruthy()
        expect(screen.getByText('feng-remote-argo8')).toBeTruthy()
        expect(screen.getAllByText('Discovered')).toHaveLength(2)

        // ocp app
        expect(screen.getByText(mockOCPApplication0.name!)).toBeTruthy()
        expect(screen.getByText('OpenShift')).toBeTruthy()

        // flux
        expect(screen.getByText(mockFluxApplication0.name!)).toBeTruthy()
        expect(screen.getByText('OpenShift')).toBeTruthy()
    })

    test('should filter', async () => {
        // subscription

        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('app.k8s.io/Application')).toBeTruthy()
        userEvent.click(screen.getByTestId('app.k8s.io/Application'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const subscriptionCheckBox = screen.queryByTestId('app.k8s.io/Application')
        expect(subscriptionCheckBox).toBeNull()
        const applicationSetType = screen.queryByText(ApplicationSetKind)
        expect(applicationSetType).toBeNull()
        const discoveredType = screen.queryByText('Discovered')
        expect(discoveredType).toBeNull()
        expect(screen.getAllByText(SubscriptionKind)).toBeTruthy()

        // clear subscription filter
        userEvent.click(screen.getByRole('button', { name: /close subscription/i }))

        // argo apps
        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('argoproj.io/Application')).toBeTruthy()
        userEvent.click(screen.getByTestId('argoproj.io/Application'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const argoCheckBox = screen.queryByTestId('argoproj.io/Application')
        expect(argoCheckBox).toBeNull()
        const applicationType = screen.queryByText(ApplicationKind)
        expect(applicationType).toBeNull()
        expect(applicationSetType).toBeNull()
        expect(screen.getAllByText('Discovered')).toBeTruthy()

        // clear argo filter
        userEvent.click(screen.getByRole('button', { name: /close argo cd/i }))

        // appset
        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('argoproj.io/ApplicationSet')).toBeTruthy()
        userEvent.click(screen.getByTestId('argoproj.io/ApplicationSet'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const argoAppSetCheckBox = screen.queryByTestId('argoproj.io/ApplicationSet')
        expect(argoAppSetCheckBox).toBeNull()
        expect(applicationType).toBeNull()
        expect(discoveredType).toBeNull()
        expect(screen.getAllByText(ApplicationSetKind)).toBeTruthy()

        // clear appset filter
        userEvent.click(screen.getByRole('button', { name: /close application set/i }))

        // OCP
        // Open filter
        userEvent.click(screen.getByText('Filter'))
        expect(screen.getByTestId('openshiftapps')).toBeTruthy()
        userEvent.click(screen.getByTestId('openshiftapps'))

        // Close filter
        userEvent.click(screen.getByText('Filter'))
        const ocpCheckBox = screen.queryByTestId('openshiftapps')
        expect(ocpCheckBox).toBeNull()
        expect(applicationType).toBeNull()
        expect(discoveredType).toBeNull()

        // clear openshift filter
        userEvent.click(screen.getByRole('button', { name: /close openshift/i }))
    })
})
