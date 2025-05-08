/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { SnapshotRestoreModalBody } from './SnapshotRestoreModalBody'

describe('SnapshotRestoreModalBody', () => {
  test('Should render SnapshotRestoreModalBody correctly', async () => {
    render(
      <RecoilRoot>
        <SnapshotRestoreModalBody
          item={{
            apigroup: 'snapshot.kubevirt.io',
            apiversion: 'v1beta1',
            cluster: 'bm-4-vms',
            created: '2025-05-06T14:26:00Z',
            indications: 'guestagent; online',
            kind: 'VirtualMachineSnapshot',
            kind_plural: 'virtualmachinesnapshots',
            name: 'centos9-01-snapshot-20250506-102417',
            namespace: 'openshift-cnv',
            ready: 'True',
            sourceName: 'centos9-01',
            _conditionReadyReason: 'Operation complete',
          }}
          setSnapshotRestoreReqBody={() => {}}
          vm={{
            apiVersion: 'kubevirt.io/v1',
            kind: 'VirtualMachine',
            metadata: {
              annotations: {
                'kubemacpool.io/transaction-timestamp': '2025-05-07T13:04:50.112418663Z',
                'kubevirt.io/latest-observed-api-version': 'v1',
                'kubevirt.io/storage-observed-api-version': 'v1',
                'restore.kubevirt.io/lastRestoreUID':
                  'centos9-01-snapshot-20250506-102417-1746561862437-91bba5b9-c895-486d-a79e-53d0a748f3b2',
              },
              creationTimestamp: '2024-10-02T20:02:14Z',
              generation: 12,
              labels: {
                app: 'centos9-01',
                'kubevirt.io/dynamic-credentials-support': 'true',
                'vm.kubevirt.io/template': 'centos-stream9-server-small',
                'vm.kubevirt.io/template.namespace': 'openshift',
                'vm.kubevirt.io/template.revision': '1',
                'vm.kubevirt.io/template.version': 'v0.29.2',
              },
              name: 'centos9-01',
              namespace: 'openshift-cnv',
            },
            spec: {},
            status: {},
          }}
        />
      </RecoilRoot>
    )
    // await wait()

    await waitFor(() =>
      expect(
        screen.queryByText(
          'Are you sure you want to restore centos9-01 from snapshot centos9-01-snapshot-20250506-102417'
        )
      ).toBeInTheDocument()
    )
    await waitFor(() =>
      expect(
        screen.queryByText(
          'Data from the last snapshot taken will be lost. To prevent losing current data, take another snapshot before restoring from this one.'
        )
      ).toBeInTheDocument()
    )
  })
})
