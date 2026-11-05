/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { defaultPlugin, PluginContext } from '~/lib/PluginContext'
import { ClustersPage } from '~/routes/Infrastructure/Clusters/ClustersPage'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { createClusterVersionMock, waitForText } from '../../../lib/test-util'
import Clusters from './Clusters'
import { NavigationPath } from '../../../NavigationPath'

// Mock KubevirtProviderAlert to avoid complex dependencies
jest.mock('../../../components/KubevirtProviderAlert', () => ({
  KubevirtProviderAlert: () => null,
}))

const mockUseClusterVersion = createClusterVersionMock()
jest.mock('../../../hooks/use-cluster-version', () => ({
  useClusterVersion: () => mockUseClusterVersion(),
}))

describe('Cluster Management', () => {
  test.each([true, false])('GitOps tab ACM availability: %s', (isACMAvailable) => {
    render(
      <PluginContext.Provider value={{ ...defaultPlugin, isACMAvailable }}>
        <StateProvider>
          <MemoryRouter initialEntries={[NavigationPath.gitOps]}>
            <ClustersPage />
          </MemoryRouter>
        </StateProvider>
      </PluginContext.Provider>
    )
    expect(screen.queryAllByRole('tab', { name: 'GitOps' })).toHaveLength(isACMAvailable ? 1 : 0)
    const expectedLastTab = isACMAvailable ? 'GitOps' : 'Placements'
    const tabs = screen.getAllByRole('tab')
    expect(tabs[tabs.length - 1]).toHaveTextContent(expectedLastTab)
  })

  test.each([true, false])('GitOps direct route ACM availability: %s', async (isACMAvailable) => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <PluginContext.Provider value={{ ...defaultPlugin, isACMAvailable }}>
        <StateProvider>
          <MemoryRouter initialEntries={[NavigationPath.gitOps]}>
            <Routes>
              <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
            </Routes>
          </MemoryRouter>
        </StateProvider>
      </PluginContext.Provider>
    )
    if (isACMAvailable) {
      await screen.findByRole('heading', { name: 'No GitOps configuration set up' })
    } else {
      await waitForText('Cluster list')
    }
    expect(screen.queryAllByRole('heading', { name: 'No GitOps configuration set up' })).toHaveLength(
      isACMAvailable ? 1 : 0
    )
    expect(screen.queryAllByRole('tab', { name: 'GitOps' })).toHaveLength(isACMAvailable ? 1 : 0)
  })

  test('Discovery Feature Flag Enabled', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <StateProvider>
        <MemoryRouter initialEntries={[NavigationPath.managedClusters]}>
          <Routes>
            <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
          </Routes>
        </MemoryRouter>
      </StateProvider>
    )
    await waitForText('Cluster list')
    await waitForText('Discovered clusters')
  })
})
