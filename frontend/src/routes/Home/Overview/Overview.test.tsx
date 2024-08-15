/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter } from 'react-router-dom-v5-compat'
import Overview from './Overview'
import { PluginContext } from '../../../lib/PluginContext'
import { PluginDataContext } from '../../../lib/PluginDataContext'
import { render } from '@testing-library/react'
import { clickByText, waitForNocks, waitForText } from '../../../lib/test-util'
import { RecoilRoot } from 'recoil'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MockedProvider } from '@apollo/client/testing'
import { nockCreate, nockGet, nockIgnoreApiPaths, nockPostRequest, nockSearch } from '../../../lib/nock-util'
import {
  getAddonRequest,
  getAddonResponse,
  mockGetSelfSubjectAccessRequest,
  mockGetSelfSubjectAccessResponse,
} from './Overview.sharedmocks'
import {
  mockSearchQueryArgoApps,
  mockSearchQueryArgoAppsCount,
  mockSearchQueryOCPApplications,
  mockSearchQueryOCPApplicationsCount,
  mockSearchResponseArgoApps,
  mockSearchResponseArgoAppsCount,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
} from '../../Applications/Application.sharedmocks'

const queryClient = new QueryClient()

it('should render overview page with extension', async () => {
  const apiPathNock = nockIgnoreApiPaths()
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
  const getManageedClusterAccessRequeset = nockCreate(mockGetSelfSubjectAccessRequest, mockGetSelfSubjectAccessResponse)
  const metricNock = nockPostRequest('/metrics?overview-classic', {})
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
  render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MockedProvider mocks={[]}>
            <PluginContext.Provider
              value={{
                isACMAvailable: false,
                isOverviewAvailable: true,
                isSubmarinerAvailable: true,
                isApplicationsAvailable: true,
                isGovernanceAvailable: true,
                isSearchAvailable: true,
                dataContext: PluginDataContext,
                acmExtensions: {
                  overviewTab: [
                    {
                      pluginID: 'test-plugin',
                      pluginName: 'test-plugin',
                      type: 'acm.overview/tab',
                      uid: 'test-plugin-tab',
                      properties: {
                        tabTitle: 'Test tab',
                        component: () => <div>Test extension content</div>,
                      },
                    },
                  ],
                },
                ocpApi: {
                  useK8sWatchResource: () => [[] as any, true, undefined],
                },
              }}
            >
              <Overview />
            </PluginContext.Provider>
          </MockedProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </RecoilRoot>
  )

  await waitForText('Overview')
  await waitForText('Test tab')
  await clickByText('Test tab')

  await waitForText('Test extension content')
  await waitForNocks([metricNock, getAddonNock, getManageedClusterAccessRequeset, apiPathNock])
})

it('should render overview page layout when extension tab crashes', async () => {
  const apiPathNock = nockIgnoreApiPaths()
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
  const getManageedClusterAccessRequeset = nockCreate(mockGetSelfSubjectAccessRequest, mockGetSelfSubjectAccessResponse)
  const metricNock = nockPostRequest('/metrics?overview-classic', {})
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
  render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MockedProvider mocks={[]}>
            <PluginContext.Provider
              value={{
                isACMAvailable: false,
                isOverviewAvailable: true,
                isSubmarinerAvailable: true,
                isApplicationsAvailable: true,
                isGovernanceAvailable: true,
                isSearchAvailable: true,
                dataContext: PluginDataContext,
                acmExtensions: {
                  overviewTab: [
                    {
                      pluginID: 'test-plugin',
                      pluginName: 'test-plugin',
                      type: 'acm.overview/tab',
                      uid: 'test-plugin-tab',
                      properties: {
                        tabTitle: 'Test tab',
                        component: () => {
                          throw new Error('Uncaught error from a bad extension')
                        },
                      },
                    },
                  ],
                },
                ocpApi: {
                  useK8sWatchResource: () => [[] as any, true, undefined],
                },
              }}
            >
              <Overview />
            </PluginContext.Provider>
          </MockedProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </RecoilRoot>
  )

  await waitForText('Overview')
  await waitForText('Test tab')
  await clickByText('Test tab')

  await waitForText('Overview')
  await waitForNocks([metricNock, getAddonNock, getManageedClusterAccessRequeset, apiPathNock])
})
