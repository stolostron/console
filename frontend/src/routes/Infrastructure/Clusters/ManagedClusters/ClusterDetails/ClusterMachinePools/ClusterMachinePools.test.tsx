/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { machinePoolsState } from '../../../../../../atoms'
import { nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC, nockPatch } from '../../../../../../lib/nock-util'
import { clickByLabel, clickByText, clickRowAction, waitForNocks, waitForText } from '../../../../../../lib/test-util'
import { ClusterDetailsContext } from '../ClusterDetails'
import { MachinePoolsPageContent } from './ClusterMachinePools'
import {
  mockCluster,
  mockMachinePoolAuto,
  mockMachinePoolManual,
  mockMachinePoolOther,
} from '../ClusterDetails.sharedmocks'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import userEvent from '@testing-library/user-event'

describe('ClusterMachinePools', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = { cluster: mockCluster, addons: undefined }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(machinePoolsState, [mockMachinePoolManual, mockMachinePoolAuto, mockMachinePoolOther])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<MachinePoolsPageContent />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  })

  it('should be able to manually scale a machine pool', async () => {
    await waitForText(mockMachinePoolManual.metadata.name!)
    await waitForText('nova-default') // Check OpenStack flavor displays as Instance type
    await clickRowAction(2, 'Scale machine pool')
    await clickByLabel('Plus')
    const patchNocks: Scope[] = [
      nockPatch(mockMachinePoolManual, [
        { op: 'replace', path: '/spec/replicas', value: mockMachinePoolManual.spec!.replicas! + 1 },
      ]),
    ]
    await clickByText('Scale')
    await waitForNocks(patchNocks)
  })
  it('should be able to enable autoscaling for a machine pool', async () => {
    await waitForText(mockMachinePoolManual.metadata.name!)
    await waitForText('m4.xlarge') // Check AWS type displays as Instance type

    await clickRowAction(2, 'Enable autoscale')
    await clickByLabel('Plus', 1)
    const patchNocks: Scope[] = [
      nockPatch(mockMachinePoolManual, [
        { op: 'remove', path: '/spec/replicas' },
        {
          op: 'add',
          path: '/spec/autoscaling',
          value: {
            minReplicas: mockMachinePoolManual.status!.machineSets!.length,
            maxReplicas: mockMachinePoolManual.status!.machineSets!.length + 1,
          },
        },
      ]),
    ]
    await clickByText('Scale')
    await waitForNocks(patchNocks)
  })
  it('should be able to edit autoscaling for a machine pool', async () => {
    await waitForText(mockMachinePoolAuto.metadata.name!)
    await clickRowAction(1, 'Edit autoscale')
    await clickByLabel('Plus', 1)
    const patchNocks: Scope[] = [
      nockPatch(mockMachinePoolAuto, [
        {
          op: 'replace',
          path: '/spec/autoscaling',
          value: {
            minReplicas: mockMachinePoolAuto.spec!.autoscaling!.minReplicas,
            maxReplicas: mockMachinePoolAuto.spec!.autoscaling!.maxReplicas + 1,
          },
        },
      ]),
    ]
    await clickByText('Scale')

    await waitForNocks(patchNocks)
  })
  it('should be able to disable autoscaling for a machine pool', async () => {
    await waitForText(mockMachinePoolAuto.metadata.name!)
    await clickRowAction(1, 'Disable autoscale')
    const patchNocks: Scope[] = [
      nockPatch(mockMachinePoolAuto, [
        { op: 'remove', path: '/spec/autoscaling' },
        {
          op: 'add',
          path: '/spec/replicas',
          value: mockMachinePoolAuto.status!.replicas,
        },
      ]),
    ]
    await clickByText('Scale')
    await waitForNocks(patchNocks)
  })
  it('should be able to delete machine pools', async () => {
    await waitForText(mockMachinePoolAuto.metadata.name!)
    await waitForText(mockMachinePoolManual.metadata.name!)
    await waitForText(mockMachinePoolOther.metadata.name!)
    await waitForText('high_performance') // Check RHV vmType displays as Instance type
    await clickRowAction(1, 'Delete machine pool')
    // await clickByText('Delete machine pool')

    await waitForText('Permanently delete machine pools?')
    const confirmInput = document.getElementById('confirm')
    if (confirmInput instanceof HTMLInputElement) {
      userEvent.type(confirmInput, mockMachinePoolAuto.metadata.name!)
    }

    const deleteNocks: Scope[] = [nockDelete(mockMachinePoolAuto)]
    await clickByText('Delete')
    await waitForText('Deleting')

    await waitForNocks(deleteNocks)
  })
})
