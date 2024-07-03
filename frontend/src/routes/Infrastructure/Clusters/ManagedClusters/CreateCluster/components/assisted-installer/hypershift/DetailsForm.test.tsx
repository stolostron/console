/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockList } from '../../../../../../../../lib/nock-util'
import { waitForNocks, waitForText } from '../../../../../../../../lib/test-util'
import { clusterImageSet, mockClusterImageSet } from '../../../CreateCluster.sharedmocks'
import { IResource } from '../../../../../../../../resources'

import DetailsForm from './DetailsForm'

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
                      highAvailabilityMode: 'Full',
                      openshiftVersion: '',
                      pullSecret: '',
                      baseDnsDomain: '',
                      SNODisclaimer: false,
                      useRedHatDnsService: true,
                      enableDiskEncryptionOnMasters: false,
                      enableDiskEncryptionOnWorkers: false,
                      diskEncryptionMode: 'tpmv2',
                      diskEncryptionTangServers: [],
                      diskEncryption: {},
                      cpuArchitecture: '',
                      platform: 'baremetal',
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
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const initialNocks = [nockList(clusterImageSet as IResource, mockClusterImageSet as IResource[])]
    const { container } = render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('ai:Cluster name')
    expect(container).toMatchSnapshot()
  })
})
