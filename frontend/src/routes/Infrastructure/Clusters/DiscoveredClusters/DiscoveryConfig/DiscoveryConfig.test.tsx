/* Copyright Contributors to the Open Cluster Management project */

import { AcmToastProvider, AcmToastGroup } from '../../../../../ui-components'
import { render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { discoveryConfigState, secretsState } from '../../../../../atoms'
import {
  nockCreate,
  nockIgnoreRBAC,
  nockGet,
  nockReplace,
  nockDelete,
  nockIgnoreApiPaths,
} from '../../../../../lib/nock-util'
import { clickByText, waitForNocks, waitForText } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import DiscoveredClustersPage from '../DiscoveredClusters'
import DiscoveryConfigPage from './DiscoveryConfig'
import {
  discoveryConfig,
  discoveryConfigUpdated,
  minDiscoveryConfig,
  mockRHOCMSecrets,
  discoveryConfigCreateSelfSubjectAccessRequest,
  discoveryConfigCreateSelfSubjectAccessResponse,
  discoveryConfigUpdateSelfSubjectAccessRequest,
  discoveryConfigUpdateSelfSubjectAccessResponse,
} from '../DiscoveryComponents/test-utils'
import userEvent from '@testing-library/user-event'

function TestAddDiscoveryConfigPage() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(discoveryConfigState, [])
        snapshot.set(secretsState, [mockRHOCMSecrets[0]])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.createDiscovery]}>
        <AcmToastProvider>
          <AcmToastGroup />
          <Routes>
            <Route path={NavigationPath.createDiscovery} element={<DiscoveryConfigPage />} />
            <Route path={NavigationPath.discoveredClusters} element={<DiscoveredClustersPage />} />
          </Routes>
        </AcmToastProvider>
      </MemoryRouter>
    </RecoilRoot>
  )
}

function TestEditConnectionPage() {
  nockIgnoreRBAC()
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(discoveryConfigState, [discoveryConfig])
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.configureDiscovery]}>
        <AcmToastProvider>
          <AcmToastGroup />
          <Routes>
            <Route path={NavigationPath.configureDiscovery} element={<DiscoveryConfigPage />} />
            <Route path={NavigationPath.discoveredClusters} element={<DiscoveredClustersPage />} />
          </Routes>
        </AcmToastProvider>
      </MemoryRouter>
    </RecoilRoot>
  )
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('discovery config page', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  it('Create Minimal DiscoveryConfig', async () => {
    const discoveryConfigCreateNock = nockCreate(
      discoveryConfigCreateSelfSubjectAccessRequest,
      discoveryConfigCreateSelfSubjectAccessResponse
    )
    const { container } = render(<TestAddDiscoveryConfigPage />)
    waitForNocks([discoveryConfigCreateNock])

    // click add credential to show the modal
    userEvent.click(
      screen.getByRole('button', {
        name: /credential options menu/i,
      })
    )
    userEvent.click(screen.getByText(/add credential/i))
    await waitForText('Enter the basic credentials information')
    userEvent.click(
      screen.getByRole('button', {
        name: /cancel/i,
      })
    )

    // Select Credential
    await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="credentials-label"]`)).toHaveLength(1))
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="credentials-label"]`)!.click()
    await clickByText(mockRHOCMSecrets[0].metadata.namespace! + '/' + mockRHOCMSecrets[0].metadata.name!)

    // Submit form
    const createDiscoveryConfigNock = nockCreate(minDiscoveryConfig, minDiscoveryConfig)
    await clickByText('Create')
    await waitFor(() => expect(createDiscoveryConfigNock.isDone()).toBeTruthy())

    // Wait For Notification on DiscoveredClusters page
    await waitForText('ocm/ocm-api-token discovery setting was created successfully')
    await waitForText('You can configure settings in Clusters > Discovered clusters')
  })

  it('Create DiscoveryConfig', async () => {
    const discoveryConfigCreateNock = nockCreate(
      discoveryConfigCreateSelfSubjectAccessRequest,
      discoveryConfigCreateSelfSubjectAccessResponse
    )
    const { container } = render(<TestAddDiscoveryConfigPage />)

    // Select Credential
    await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="credentials-label"]`)).toHaveLength(1))
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="credentials-label"]`)!.click()
    await clickByText(mockRHOCMSecrets[0].metadata.namespace! + '/' + mockRHOCMSecrets[0].metadata.name!)
    waitForNocks([discoveryConfigCreateNock])

    // Select LastActive
    await waitFor(() =>
      expect(container.querySelectorAll(`[aria-labelledby^="lastActiveFilter-label"]`)).toHaveLength(1)
    )
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
    await waitForText('14 days')
    await clickByText('14 days')

    // Select Version
    expect(container.querySelectorAll(`[aria-labelledby^="discoveryVersions-label"]`)).toHaveLength(1)
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
    await clickByText('4.16')

    // Submit form
    const createDiscoveryConfigNock = nockCreate(discoveryConfig, discoveryConfig)
    await clickByText('Create')
    await waitFor(() => expect(createDiscoveryConfigNock.isDone()).toBeTruthy())

    // Wait For Notification on DiscoveredClusters page
    await waitForText('ocm/ocm-api-token discovery setting was created successfully')
    await waitForText('You can configure settings in Clusters > Discovered clusters')
  })

  it('Edit DiscoveryConfig', async () => {
    const discoveryConfigUpdateNock = nockCreate(
      discoveryConfigUpdateSelfSubjectAccessRequest,
      discoveryConfigUpdateSelfSubjectAccessResponse
    )
    const nocks = [nockGet(discoveryConfig, discoveryConfig)]

    const { container } = render(<TestEditConnectionPage />)
    await waitForNocks(nocks)

    // Select Namespace
    await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="namespaces-label"]`)).toHaveLength(1))
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaces-label"]`)!.click()
    await clickByText(discoveryConfig.metadata.namespace!)

    await waitForNocks([discoveryConfigUpdateNock])

    // Ensure Form is prepopulated
    await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
    await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name!)

    // Change form
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
    await clickByText('30 days')

    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
    await clickByText('4.17')

    const replaceNock = nockReplace(discoveryConfigUpdated)
    await clickByText('Save')
    await waitFor(() => expect(replaceNock.isDone()).toBeTruthy())

    // Wait For Notification on DiscoveredClusters page
    await waitForText('ocm/ocm-api-token discovery setting was updated successfully')
    await waitForText('You can configure settings in Clusters > Discovered clusters')
  })

  it('Delete DiscoveryConfig', async () => {
    const nocks = [nockGet(discoveryConfig, discoveryConfig)]
    const { container } = render(<TestEditConnectionPage />)
    await waitForNocks(nocks)

    // Select Namespace
    await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="namespaces-label"]`)).toHaveLength(1))
    container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaces-label"]`)!.click()
    await clickByText(discoveryConfig.metadata.namespace!)

    // Ensure Form is prepopulated
    await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
    await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name!)

    const deleteNock = nockDelete(discoveryConfigUpdated)
    await clickByText('Delete')
    await waitForText('Delete discovery settings')
    await clickByText('Delete', 1)
    await waitFor(() => expect(deleteNock.isDone()).toBeTruthy())

    // Wait For Notification on DiscoveredClusters page
    await waitForText('ocm/ocm-api-token discovery setting was removed successfully')
    await waitForText('You can configure settings in Clusters > Discovered clusters')
  })
})
