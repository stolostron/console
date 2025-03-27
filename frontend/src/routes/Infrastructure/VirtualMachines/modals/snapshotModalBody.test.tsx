/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../lib/test-util'
import { SnapshotModalBody } from './snapshotModalBody'

const getMCVRequest = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: 'f006a164413a02895e7e4eb8df59ed1226b5125e',
    namespace: 'test-cluster',
    labels: {
      viewName: 'f006a164413a02895e7e4eb8df59ed1226b5125e',
    },
  },
  spec: {
    scope: {
      name: 'vm-testing',
      resource: 'virtualmachine.kubevirt.io/v1',
    },
  },
}

const getMCVResponse = {
  apiVersion: 'view.open-cluster-management.io/v1beta1',
  kind: 'ManagedClusterView',
  metadata: {
    name: 'f006a164413a02895e7e4eb8df59ed1226b5125e',
    namespace: 'test-cluster',
    labels: {
      viewName: 'f006a164413a02895e7e4eb8df59ed1226b5125e',
    },
  },
  spec: {
    scope: {
      name: 'vm-testing',
      resource: 'virtualmachine.kubevirt.io/v1',
    },
  },
  status: {
    conditions: [
      {
        message: 'Watching resources successfully',
        reason: 'GetResourceProcessing',
        status: 'True',
        type: 'Processing',
      },
    ],
    result: {
      result: {
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
        metadata: {
          creationTimestamp: '2024-10-02T20:02:14Z',
          finalizers: ['kubevirt.io/virtualMachineControllerFinalize'],
          name: 'centos9-01',
          namespace: 'openshift-cnv',
          resourceVersion: '112564972',
          uid: '4d2cd231-0794-4a4b-89a3-90bb8b6ea89b',
        },
        spec: {
          running: true,
          template: {
            metadata: {
              annotations: {
                'vm.kubevirt.io/flavor': 'small',
                'vm.kubevirt.io/os': 'centos-stream9',
                'vm.kubevirt.io/workload': 'server',
              },
              creationTimestamp: null,
              labels: {
                'kubevirt.io/domain': 'centos9-01',
                'kubevirt.io/size': 'small',
                'network.kubevirt.io/headlessService': 'headless',
              },
            },
            spec: {
              architecture: 'amd64',
              domain: {
                cpu: {
                  cores: 1,
                  sockets: 1,
                  threads: 1,
                },
                devices: {
                  disks: [
                    {
                      disk: {
                        bus: 'virtio',
                      },
                      name: 'rootdisk',
                    },
                    {
                      disk: {
                        bus: 'virtio',
                      },
                      name: 'cloudinitdisk',
                    },
                  ],
                  interfaces: [
                    {
                      macAddress: '02:17:8d:00:00:00',
                      masquerade: {},
                      model: 'virtio',
                      name: 'default',
                    },
                  ],
                  rng: {},
                },
                machine: {
                  type: 'pc-q35-rhel9.4.0',
                },
                memory: {
                  guest: '2Gi',
                },
                resources: {},
              },
              networks: [
                {
                  name: 'default',
                  pod: {},
                },
              ],
              terminationGracePeriodSeconds: 180,
              volumes: [
                {
                  dataVolume: {
                    name: 'centos9-01',
                  },
                  name: 'rootdisk',
                },
                {
                  cloudInitNoCloud: {
                    userData: '#cloud-config\nuser: centos\npassword: okxc-1s44-uvu1\nchpasswd: { expire: False }',
                  },
                  name: 'cloudinitdisk',
                },
              ],
            },
          },
        },
        status: {
          created: true,
          desiredGeneration: 9,
          observedGeneration: 9,
          printableStatus: 'Running',
          ready: true,
          runStrategy: 'Always',
          volumeSnapshotStatuses: [
            {
              enabled: false,
              name: 'rootdisk',
              reason:
                'No VolumeSnapshotClass: Volume snapshots are not configured for this StorageClass [standard] [rootdisk]',
            },
            {
              enabled: false,
              name: 'cloudinitdisk',
              reason: 'Snapshot is not supported for this volumeSource type [cloudinitdisk]',
            },
          ],
        },
      },
    },
  },
}

describe('SnapshotModalBody', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })
  test('Should render SnapshotModalBody correctly', async () => {
    const getVMManagedClusterViewNock = nockGet(getMCVRequest, getMCVResponse)
    render(
      <RecoilRoot>
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
    // Wait for managed cluster view requests to finish
    await waitForNocks([getVMManagedClusterViewNock])
    await wait()

    await waitFor(() => expect(screen.queryByText('Name')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Description')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Deadline')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('Disks included in this snapshot (0)')).toBeInTheDocument())
  })
})
