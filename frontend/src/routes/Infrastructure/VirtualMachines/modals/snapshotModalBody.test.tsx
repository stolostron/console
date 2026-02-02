/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { isFineGrainedRbacEnabledState } from '../../../../atoms'
import { nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { wait } from '../../../../lib/test-util'
import { SnapshotModalBody } from './snapshotModalBody'

jest.mock('../../../../resources/utils/resource-request', () => ({
  getBackendUrl: jest.fn(() => ''),
  getRequest: jest.fn((url) => {
    if (url === '/virtualmachines/get/test-cluster/vm-testing/vm-test-ns') {
      return {
        promise: Promise.resolve({
          apiVersion: 'kubevirt.io/v1',
          kind: 'VirtualMachine',
          metadata: {
            name: 'vm-testing',
            namespace: 'vm-test-ns',
          },
        }),
      }
    } else {
      return Promise.resolve()
    }
  }),
}))

jest.mock('../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(() =>
    Promise.resolve({
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        name: 'vm-testing',
        namespace: 'vm-test-ns',
      },
    })
  ),
}))

describe('SnapshotModalBody', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  test('Should render SnapshotModalBody correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(isFineGrainedRbacEnabledState, true)
        }}
      >
        <SnapshotModalBody
          item={{
            apigroup: 'kubevirt.io',
            apiversion: 'v1',
            cluster: 'test-cluster',
            cpu: '1',
            created: '2024-12-09T18:10:13Z',
            flavor: 'small',
            kind: 'VirtualMachine',
            kind_plural: 'virtualmachineinstances',
            memory: '2Gi',
            name: 'vm-testing',
            namespace: 'vm-test-ns',
            osName: 'centos-stream9',
            ready: 'True',
            status: 'Running',
            workload: 'server',
            ipaddress: '10.128.0.218',
            liveMigratable: 'False',
            node: 'sno-0-0',
            osVersion: '9',
            phase: 'Running',
            vmSize: 'small',
          }}
          setSnapshotReqBody={() => {}}
          getVMError={undefined}
          setGetVMError={() => {}}
        />
      </RecoilRoot>
    )
    await wait()

    await waitFor(() => expect(screen.queryByText('Name')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Description')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Deadline')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Disks included in this snapshot (0)')).toBeInTheDocument())
  })

  test('Should render SnapshotModalBody correctly with isFineGrainedRbacEnabledState=false', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(isFineGrainedRbacEnabledState, false)
        }}
      >
        <SnapshotModalBody
          item={{
            apigroup: 'kubevirt.io',
            apiversion: 'v1',
            cluster: 'test-cluster',
            cpu: '1',
            created: '2024-12-09T18:10:13Z',
            flavor: 'small',
            kind: 'VirtualMachine',
            kind_plural: 'virtualmachineinstances',
            memory: '2Gi',
            name: 'vm-testing',
            namespace: 'vm-test-ns',
            osName: 'centos-stream9',
            ready: 'True',
            status: 'Running',
            workload: 'server',
            ipaddress: '10.128.0.218',
            liveMigratable: 'False',
            node: 'sno-0-0',
            osVersion: '9',
            phase: 'Running',
            vmSize: 'small',
          }}
          setSnapshotReqBody={() => {}}
          getVMError={undefined}
          setGetVMError={() => {}}
        />
      </RecoilRoot>
    )
    await wait()

    await waitFor(() => expect(screen.queryByText('Name')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Description')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Deadline')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Disks included in this snapshot (0)')).toBeInTheDocument())
  })
})
