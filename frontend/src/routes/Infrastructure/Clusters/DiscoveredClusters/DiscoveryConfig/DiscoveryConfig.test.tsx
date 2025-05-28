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

describe('Discovery Config page', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  it('Create Minimal DiscoveryConfig', async () => {
    const discoveryConfigCreateNock = nockCreate(
      discoveryConfigCreateSelfSubjectAccessRequest,
      discoveryConfigCreateSelfSubjectAccessResponse
    )
    render(<TestAddDiscoveryConfigPage />)
    waitForNocks([discoveryConfigCreateNock])
    screen
      .getByRole('combobox', {
        name: 'Credential',
      })
      .click()
    userEvent.click(screen.getByText(/add credential/i))
    await waitForText('Enter the basic credentials information')
    userEvent.click(
      screen.getByRole('button', {
        name: /cancel/i,
      })
    )

    // Select Credential
    screen
      .getByRole('combobox', {
        name: 'Credential',
      })
      .click()
    await clickByText(mockRHOCMSecrets[0].metadata.namespace! + '/' + mockRHOCMSecrets[0].metadata.name!)

    // Wait for the RBAC check to complete
    await waitForNocks([discoveryConfigCreateNock])

    // Verify create button is enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled()
    })
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
    render(<TestAddDiscoveryConfigPage />)

    // Select Credential
    screen
      .getByRole('combobox', {
        name: 'Credential',
      })
      .click()
    await clickByText(mockRHOCMSecrets[0].metadata.namespace! + '/' + mockRHOCMSecrets[0].metadata.name!)

    await waitForNocks([discoveryConfigCreateNock])

    // Select LastActive
    screen
      .getByRole('combobox', {
        name: /Last active/i,
      })
      .click()
    await waitForText('14 days')
    await clickByText('14 days')

    // Select Version
    screen
      .getByRole('combobox', {
        name: 'Red Hat OpenShift version',
      })
      .click()
    await clickByText('4.17')

    // Select Cluster Types
    screen
      .getByRole('combobox', {
        name: /Cluster types/i,
      })
      .click()

    screen
      .getByRole('checkbox', {
        name: /rosa classic/i,
      })
      .click()
    screen
      .getByRole('checkbox', {
        name: /openshift container platform/i,
      })
      .click()

    // Select Infrastructure Providers
    screen.getByText(/select infrastructure providers/i).click()

    screen
      .getByRole('checkbox', {
        name: /amazon web services/i,
      })
      .click()

    screen
      .getByRole('checkbox', {
        name: /microsoft azure/i,
      })
      .click()

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

    render(<TestEditConnectionPage />)
    await waitForNocks(nocks)

    // Select Namespace
    screen
      .getByRole('combobox', {
        name: 'Namespace',
      })
      .click()
    await clickByText(discoveryConfig.metadata.namespace!)

    await waitForNocks([discoveryConfigUpdateNock])

    // Ensure Form is prepopulated
    await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
    await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name!)

    // Change form
    screen
      .getByRole('combobox', {
        name: /Last active/i,
      })
      .click()
    await clickByText('30 days')

    screen
      .getByRole('combobox', {
        name: 'Red Hat OpenShift version',
      })
      .click()
    await clickByText('4.18')

    const replaceNock = nockReplace(discoveryConfigUpdated)
    await clickByText('Save')
    await waitFor(() => expect(replaceNock.isDone()).toBeTruthy())

    // Wait For Notification on DiscoveredClusters page
    await waitForText('ocm/ocm-api-token discovery setting was updated successfully')
    await waitForText('You can configure settings in Clusters > Discovered clusters')
  })

  it('Delete DiscoveryConfig', async () => {
    const nocks = [nockGet(discoveryConfig, discoveryConfig)]
    render(<TestEditConnectionPage />)
    await waitForNocks(nocks)

    // Select Namespace
    screen
      .getByRole('combobox', {
        name: 'Namespace',
      })
      .click()
    await clickByText(discoveryConfig.metadata.namespace!)

    // Ensure Form is prepopulated
    await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
    await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
    await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name!)

    const deleteNock = nockDelete(discoveryConfigUpdated)
    await clickByText('Delete')
    await waitForText('Delete discovery settings')

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() => expect(deleteNock.isDone()).toBeTruthy())

    // Wait For Notification on DiscoveredClusters page
    await waitForText('ocm/ocm-api-token discovery setting was removed successfully')
    await waitForText('You can configure settings in Clusters > Discovered clusters')
  })
})
