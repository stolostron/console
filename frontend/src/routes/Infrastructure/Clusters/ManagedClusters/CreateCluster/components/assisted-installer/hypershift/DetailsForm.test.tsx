/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RecoilRoot } from 'recoil'
import * as dynamicPluginSdk from '@openshift-console/dynamic-plugin-sdk'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockList } from '../../../../../../../../lib/nock-util'
import { normalizeGeneratedOuiaIds, waitForNocks, waitForText } from '../../../../../../../../lib/test-util'
import { clusterImageSet, mockClusterImageSet, mockStorageClass } from '../../../CreateCluster.sharedmocks'
import { IResource } from '../../../../../../../../resources'

import DetailsForm from './DetailsForm'

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'),
  useK8sWatchResource: jest.fn(),
}))

describe('DetailsForm', () => {
  const handleChange = jest.fn()
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
          <Routes>
            <Route
              path={NavigationPath.createCluster}
              element={
                <DetailsForm
                  key={'key'}
                  control={{
                    active: {
                      name: '',
                      openshiftVersion: '',
                      pullSecret: '',
                      baseDnsDomain: '',
                      useRedHatDnsService: true,
                      enableDiskEncryptionOnMasters: false,
                      enableDiskEncryptionOnWorkers: false,
                      diskEncryptionMode: 'tpmv2',
                      diskEncryptionTangServers: [],
                      diskEncryption: {},
                      cpuArchitecture: '',
                      platform: 'baremetal',
                      userManagedNetworking: false,
                      customOpenshiftSelect: null,
                      controlPlaneCount: 3,
                      enableDiskEncryptionOnArbiters: false,
                      storageClass: '',
                    },
                    step: {
                      title: {
                        isComplete: false,
                      },
                    },
                  }}
                  controlProps={{
                    apiVersion: 'v1',
                    kind: 'Secret',
                    metadata: {},
                  }}
                  handleChange={handleChange}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('it renders', async () => {
    ;(dynamicPluginSdk.useK8sWatchResource as jest.Mock).mockReturnValue([mockStorageClass, true, null])
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const initialNocks = [nockList(clusterImageSet as IResource, mockClusterImageSet as IResource[])]
    const { container } = render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('ai:Cluster name')
    normalizeGeneratedOuiaIds(container)
    expect(container).toMatchSnapshot()
  })
})
