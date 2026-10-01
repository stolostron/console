/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { discoveredClusterState, discoveryConfigState, secretsState } from '../../../../atoms'
import { nockCreate, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { mockCRHCredential, mockDiscoveryConfig } from '../../../../lib/test-metadata'
import {
  clickByLabel,
  clickByText,
  getCSVDownloadLink,
  getCSVExportSpies,
  waitForNocks,
  waitForNotText,
  waitForText,
} from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import DiscoveredClustersPage from './DiscoveredClusters'
import {
  discoveryConfigCreateSelfSubjectAccessRequest,
  discoveryConfigCreateSelfSubjectAccessResponse,
  mockDiscoveredClusters,
  mockRHOCMSecrets,
} from './DiscoveryComponents/test-utils'
import DiscoveryConfigPage from './DiscoveryConfig/DiscoveryConfig'

beforeEach(() => {
  sessionStorage.clear()
})

describe('DiscoveredClusters', () => {
  beforeEach(() => nockIgnoreApiPaths())
  test('DiscoveredClusters Table', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(discoveredClusterState, mockDiscoveredClusters)
          store.set(discoveryConfigState, [mockDiscoveryConfig])
          store.set(secretsState, [mockCRHCredential])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </StateProvider>
    )

    await waitForText(mockDiscoveredClusters[0].spec.displayName)
    await waitForText(mockDiscoveredClusters[0].spec.openshiftVersion)
    await waitForText(mockDiscoveredClusters[1].spec.displayName)
    await waitForText(mockDiscoveredClusters[1].spec.openshiftVersion)

    await waitForNotText(mockDiscoveredClusters[2].spec.displayName) // Ensure managedcluster does not appear

    await waitForText(mockDiscoveredClusters[0].metadata.namespace!)
  })

  test('No provider connections or discoveryconfig (Empty State 1)', async () => {
    const { queryAllByText } = await render(
      <StateProvider
        initializeStore={(store) => {
          store.set(discoveredClusterState, [])
          store.set(discoveryConfigState, [])
          store.set(secretsState, [])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </StateProvider>
    )
    await waitForText("You don't have any discovered clusters yet")
    await waitForText('Red Hat OpenShift Cluster Manager')
    expect(queryAllByText('Add credential').length).toBeGreaterThanOrEqual(1)
  })

  test('CRH credentials exist, but no discoveryconfig (Empty State 2)', async () => {
    const discoveryConfigCreateNock = nockCreate(
      discoveryConfigCreateSelfSubjectAccessRequest,
      discoveryConfigCreateSelfSubjectAccessResponse
    )

    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(discoveredClusterState, [])
          store.set(discoveryConfigState, [])
          store.set(secretsState, mockRHOCMSecrets)
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.discoveredClusters]}>
          <Routes>
            <Route path={NavigationPath.createDiscovery} element={<DiscoveryConfigPage />} />
            <Route path={NavigationPath.discoveredClusters} element={<DiscoveredClustersPage />} />
          </Routes>
        </MemoryRouter>
      </StateProvider>
    )
    await waitForText("You don't have any discovered clusters yet")
    await waitForText('Configure Discovery')
    await waitForText('Create discovery settings')
    await clickByText('Create discovery settings')

    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
    await clickByText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
    screen.getByRole('combobox', {
      name: 'Credential',
    })
    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
    await waitForNocks([discoveryConfigCreateNock])
  })

  test('CRH and discoveryconfig exist, but no discoveredclusters (Empty State 3)', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(discoveredClusterState, [])
          store.set(discoveryConfigState, [mockDiscoveryConfig])
          store.set(secretsState, [mockCRHCredential])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </StateProvider>
    )

    await waitForText("You don't have any discovered clusters yet")
    await waitForText('Configure discovery settings')
    await waitForText('Create discovery settings')
  })

  test('export button should produce a file for download', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(discoveredClusterState, mockDiscoveredClusters)
          store.set(discoveryConfigState, [mockDiscoveryConfig])
          store.set(secretsState, [mockCRHCredential])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </StateProvider>
    )

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Last active,Namespace,Type,OpenShift version,Infrastructure provider,Created,Discovered\n' +
          '"test-cluster-01","2020-07-30T19:09:43.000Z","alpha","OpenShift Container Platform","4.5.5","aws","2020-07-30T19:09:43.000Z",-\n' +
          '"test-cluster-02","2020-07-30T19:09:43.000Z","discovered-cluster-namespace","OpenShift Container Platform","4.6.1","gcp","2020-07-30T19:09:43.000Z",-',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^discoveredclusters-[\d]+\.csv$/)
  })
})
