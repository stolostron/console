/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { placementDecisionsState, subscriptionsState } from '../../atoms'
import {
  nockIgnoreApiPaths,
  nockIgnoreRBAC,
  nockPostRequest,
  nockSearch,
  nockAggegateRequest,
} from '../../lib/nock-util'
import { PluginContext } from '../../lib/PluginContext'
import { PluginDataContext } from '../../lib/PluginDataContext'
import { ocpApi, waitForText } from '../../lib/test-util'
import { ApplicationKind, ApplicationSetKind, SubscriptionKind } from '../../resources'
import {
  acmExtension,
  mockApplication0,
  mockApplicationSet0,
  mockApplicationSet1,
  mockArgoApplication1,
  mockArgoApplication2,
  mockFluxApplication0,
  mockOCPApplication0,
  mockPlacementsDecisions,
  mockSearchQueryOCPApplicationsFiltered,
  mockSearchQueryOCPApplicationsFilteredCount,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
  mockSubscriptions,
} from './Application.sharedmocks'
import Overview from './Overview'

const applicationAggregate = {
  req: { page: 1, perPage: 10, search: '', filters: {}, sortBy: { index: 0, direction: 'asc' } },
  res: {
    page: 1,
    items: [
      mockApplication0,
      mockApplicationSet0,
      mockApplicationSet1,
      mockArgoApplication1,
      mockArgoApplication2,
      mockOCPApplication0,
      mockFluxApplication0,
    ],
    itemCount: 42,
    filterCounts: undefined,
    emptyResult: false,
    isPreProcessed: false,
  },
}

describe('Applications Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockPostRequest('/metrics?application', {})
    nockAggegateRequest('applications', applicationAggregate.req, applicationAggregate.res)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(placementDecisionsState, mockPlacementsDecisions)
        }}
      >
        <MemoryRouter>
          <PluginContext.Provider
            value={{
              acmExtensions: acmExtension,
              dataContext: PluginDataContext,
              ocpApi,
            }}
          >
            <Routes>
              <Route path="*" element={<Overview />} />
            </Routes>
          </PluginContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )
  })

  test('should display info', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    expect(screen.getByText(SubscriptionKind)).toBeTruthy()
    expect(screen.getByText(mockApplication0.metadata.namespace!)).toBeTruthy()
    expect(screen.getAllByText('Local')).toBeTruthy()
    expect(screen.getAllByText('Git')).toBeTruthy()
    expect(screen.getByText('a few seconds ago')).toBeTruthy()

    // appset
    expect(screen.getByText(mockApplicationSet0.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    expect(screen.getByText(mockApplicationSet1.metadata.name!)).toBeTruthy()
    await waitForText('Application set', true)

    // argo app
    expect(screen.getByText(mockArgoApplication1.metadata.name!)).toBeTruthy()
    expect(screen.getByText('feng-remote-argo8')).toBeTruthy()
    expect(screen.getAllByText('Argo CD')).toHaveLength(2)

    // ocp app
    expect(screen.getByText(mockOCPApplication0.name!)).toBeTruthy()
    expect(screen.getByText('OpenShift')).toBeTruthy()

    // flux
    expect(screen.getByText(mockFluxApplication0.name!)).toBeTruthy()
    expect(screen.getByText('OpenShift')).toBeTruthy()
  })

  test('should filter', async () => {
    // wait for page to load
    await waitForText('feng-remote-argo8')

    // subscription

    // Open filter
    userEvent.click(screen.getByText('Filter'))

    expect(screen.getByRole('checkbox', { name: /subscription/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /subscription/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /subscription/i })).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText(SubscriptionKind)).toBeTruthy()

    // clear subscription filter
    userEvent.click(screen.getByRole('button', { name: /close subscription/i }))

    // argo apps
    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /argo cd/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /argo cd/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /argo cd/i })).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText(ApplicationSetKind)).toBeNull()
    expect(screen.getAllByText('Argo CD')).toBeTruthy()

    // clear argo filter
    userEvent.click(screen.getByRole('button', { name: /close argo cd/i }))

    // appset
    // Open filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.getByRole('checkbox', { name: /application set/i })).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /application set/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /application set/i })).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()
    expect(screen.getAllByText('Application set')).toBeTruthy()

    // clear appset filter
    userEvent.click(screen.getByRole('button', { name: /close application set/i }))

    nockSearch(mockSearchQueryOCPApplicationsFiltered, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsFilteredCount, mockSearchResponseOCPApplicationsCount)

    // OCP
    // Openshift filter possibly 2 (Openshift, Default Openshift)
    userEvent.click(screen.getByText('Filter'))
    await waitForText('OpenShift', true)
    expect(screen.getAllByText(/openshift/i)).toBeTruthy()
    userEvent.click(screen.getByRole('checkbox', { name: /openshift/i }))

    // Close filter
    userEvent.click(screen.getByText('Filter'))
    expect(screen.queryByRole('checkbox', { name: /openshift/i })).toBeNull()
    expect(screen.queryByText(ApplicationKind)).toBeNull()
    expect(screen.queryByText('Discovered')).toBeNull()

    // clear openshift filter
    userEvent.click(screen.getByRole('button', { name: /close openshift/i }))
  })

  test('export button should produce a file for download', async () => {
    await waitForText('feng-remote-argo8')

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()
    const documentBody = document.body.appendChild
    const documentCreate = document.createElement('a').dispatchEvent

    const anchorMocked = { href: '', click: jest.fn(), download: 'table-values', style: { display: '' } } as any
    const createElementSpyOn = jest.spyOn(document, 'createElement').mockReturnValueOnce(anchorMocked)
    document.body.appendChild = jest.fn()
    document.createElement('a').dispatchEvent = jest.fn()

    userEvent.click(screen.getByLabelText('export-search-result'))
    userEvent.click(screen.getByText('Export all to CSV'))

    expect(createElementSpyOn).toHaveBeenCalledWith('a')
    expect(anchorMocked.download).toContain('table-values')

    document.body.appendChild = documentBody
    document.createElement('a').dispatchEvent = documentCreate
  })
})
