/* Copyright Contributors to the Open Cluster Management project */
import { MockedProvider } from '@apollo/client/testing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { PluginContext } from '../../../lib/PluginContext'
import { PluginDataContext } from '../../../lib/PluginDataContext'
import { clickByText, waitForNocks, waitForText } from '../../../lib/test-util'
import Overview from './Overview'
import { getAddonRequest, getAddonResponse } from './Overview.sharedmocks'

const queryClient = new QueryClient()

jest.mock('./OverviewPage', () => {
  return function OverviewPage() {
    return <div>mockedPage</div>
  }
})

it('should render overview page with extension', async () => {
  const apiPathNock = nockIgnoreApiPaths()
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
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
  await waitForNocks([getAddonNock, apiPathNock])
})

it('should render overview page layout when extension tab crashes', async () => {
  const apiPathNock = nockIgnoreApiPaths()
  const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
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
  await waitForNocks([getAddonNock, apiPathNock])
})
