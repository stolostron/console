/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RecoilRoot } from 'recoil'
import {
  clusterManagementAddonsState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClustersState,
} from '../../../atoms'
import OverviewClusterLabelSelector from './OverviewClusterLabelSelector'
import {
  managedClusterInfos,
  managedClusters,
  mockClusterManagementAddons,
  mockManagedClusterAddons,
} from './sharedmocks'

describe('OverviewClusterLabelSelector', () => {
  const RenderOverviewClusterLabelSelector = () => {
    const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({})
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, managedClusters)
          snapshot.set(managedClusterInfosState, managedClusterInfos)
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddons)
          snapshot.set(clusterManagementAddonsState, mockClusterManagementAddons)
        }}
      >
        <OverviewClusterLabelSelector
          selectedClusterLabels={selectedClusterLabels}
          setSelectedClusterLabels={setSelectedClusterLabels}
        />
      </RecoilRoot>
    )
  }

  const RenderPresetOverviewClusterLabelSelector = () => {
    const [selectedClusterLabels, setSelectedClusterLabels] = useState<Record<string, string[]>>({ env: ['dev'] })
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, managedClusters)
          snapshot.set(managedClusterInfosState, managedClusterInfos)
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddons)
          snapshot.set(clusterManagementAddonsState, mockClusterManagementAddons)
        }}
      >
        <OverviewClusterLabelSelector
          selectedClusterLabels={selectedClusterLabels}
          setSelectedClusterLabels={setSelectedClusterLabels}
        />
      </RecoilRoot>
    )
  }

  test('Renders selection correctly', async () => {
    const { getAllByText, getByText } = render(<RenderOverviewClusterLabelSelector />)

    // pick the label key - cloud
    screen
      .getAllByRole('combobox', {
        name: 'Type to filter',
      })[0]
      .click()
    await waitFor(() => expect(getByText('cloud')).toBeTruthy())
    userEvent.click(getByText('cloud'))

    // pick the label value - Amazon
    screen
      .getAllByRole('combobox', {
        name: 'Type to filter',
      })[1]
      .click()
    await waitFor(() => expect(screen.getByText('Amazon')).toBeTruthy())
    userEvent.click(screen.getByText('Amazon'))

    // Validate chips
    await waitFor(() => expect(getAllByText('cloud')[0]).toBeTruthy())
    await waitFor(() => expect(getAllByText('Amazon')[1]).toBeTruthy())
  })

  test('Correctly deletes chip', async () => {
    const { getByText, queryByText } = render(<RenderPresetOverviewClusterLabelSelector />)

    // Validate chips
    await waitFor(() => expect(getByText('env')).toBeTruthy())
    await waitFor(() => expect(getByText('dev')).toBeTruthy())

    // delete chip group
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: /close dev/i,
        })
      ).toBeTruthy()
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /close dev/i,
      })
    )

    // validate deletion
    await waitFor(() => expect(queryByText('dev')).toBeFalsy())
  })

  test('Correctly deletes chip group', async () => {
    const { queryByText, getByText } = render(<RenderPresetOverviewClusterLabelSelector />)

    // Validate chips
    await waitFor(() => expect(getByText('env')).toBeTruthy())
    await waitFor(() => expect(getByText('dev')).toBeTruthy())

    // delete chip group
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: /close chip group env/i,
        })
      ).toBeTruthy()
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /close chip group env/i,
      })
    )

    // validate deletion
    await waitFor(() => expect(queryByText('dev')).toBeFalsy())
  })

  test('Correctly deletes all chip groups', async () => {
    const { queryByText, getByText } = render(<RenderPresetOverviewClusterLabelSelector />)

    // Validate chips
    await waitFor(() => expect(getByText('env')).toBeTruthy())
    await waitFor(() => expect(getByText('dev')).toBeTruthy())

    // delete chip group
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: /clear all labels/i,
        })
      ).toBeTruthy()
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /clear all labels/i,
      })
    )

    // validate deletion
    await waitFor(() => expect(queryByText('env')).toBeFalsy())
    await waitFor(() => expect(queryByText('dev')).toBeFalsy())
  })
})
