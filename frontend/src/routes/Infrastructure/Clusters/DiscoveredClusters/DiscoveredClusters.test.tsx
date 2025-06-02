/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
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

    render(
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
    screen.getByRole('combobox', {
      name: 'Credential',
    })
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

  test('export button should produce a file for download', async () => {
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
