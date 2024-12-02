/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { discoveredClusterState, discoveryConfigState, secretsState } from '../../../../atoms'
import { nockCreate, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { mockCRHCredential, mockDiscoveryConfig } from '../../../../lib/test-metadata'
import { clickByLabel, clickByText, waitForNocks, waitForNotText, waitForText } from '../../../../lib/test-util'
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
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(discoveredClusterState, mockDiscoveredClusters)
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(secretsState, [mockCRHCredential])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </RecoilRoot>
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
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(discoveredClusterState, [])
          snapshot.set(discoveryConfigState, [])
          snapshot.set(secretsState, [])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText("You don't have any discovered clusters")
    await waitForText('Red Hat OpenShift Cluster Manager')
    expect(queryAllByText('Add credential').length).toBe(2)
  })

  test('CRH credentials exist, but no discoveryconfig (Empty State 2)', async () => {
    const discoveryConfigCreateNock = nockCreate(
      discoveryConfigCreateSelfSubjectAccessRequest,
      discoveryConfigCreateSelfSubjectAccessResponse
    )

    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(discoveredClusterState, [])
          snapshot.set(discoveryConfigState, [])
          snapshot.set(secretsState, mockRHOCMSecrets)
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.discoveredClusters]}>
          <Routes>
            <Route path={NavigationPath.createDiscovery} element={<DiscoveryConfigPage />} />
            <Route path={NavigationPath.discoveredClusters} element={<DiscoveredClustersPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText("You don't have any discovered clusters")
    await waitForText('Configure Discovery')
    await waitForText('Create discovery settings')
    await clickByText('Create discovery settings')

    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
    await clickByText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
    await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="credentials-label"]`)).toHaveLength(1))
    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
    await waitForNocks([discoveryConfigCreateNock])
  })

  test('CRH and discoveryconfig exist, but no discoveredclusters (Empty State 3)', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(discoveredClusterState, [])
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(secretsState, [mockCRHCredential])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText("You don't have any discovered clusters")
    await waitForText('Configure discovery settings')
    await waitForText('Create discovery settings')
  })

  test('export button should produce a file for download', () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(discoveredClusterState, [])
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(secretsState, [mockCRHCredential])
        }}
      >
        <MemoryRouter>
          <DiscoveredClustersPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()
    const documentBody = document.body.appendChild
    const documentCreate = document.createElement('a').dispatchEvent

    const anchorMocked = { href: '', click: jest.fn(), download: 'table-values', style: { display: '' } } as any
    const createElementSpyOn = jest.spyOn(document, 'createElement').mockReturnValueOnce(anchorMocked)
    document.body.appendChild = jest.fn()
    document.createElement('a').dispatchEvent = jest.fn()

    clickByLabel('export-search-result')
    clickByText('Export all to CSV')

    expect(createElementSpyOn).toHaveBeenCalledWith('a')
    expect(anchorMocked.download).toContain('table-values')

    document.body.appendChild = documentBody
    document.createElement('a').dispatchEvent = documentCreate
  })
})
