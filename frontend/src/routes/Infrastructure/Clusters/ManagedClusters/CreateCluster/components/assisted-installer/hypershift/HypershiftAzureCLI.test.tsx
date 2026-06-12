/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths } from '../../../../../../../../lib/nock-util'
import { mockOpenShiftConsoleConfigMap } from '../../../../../../../../lib/test-metadata'
import { waitForNocks, waitForTestId, waitForText } from '../../../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { HypershiftAzureCLI } from './HypershiftAzureCLI'

describe('HypershiftAzureCLI', () => {
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createAzureCLI]}>
          <Routes>
            <Route path={NavigationPath.createAzureCLI} element={<HypershiftAzureCLI />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('should show all the steps', async () => {
    nockIgnoreApiPaths()
    const initialNocks = [nockGet(mockOpenShiftConsoleConfigMap)]
    render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('Prerequisites and Configuration')
    await waitForText('Prepare environment variables')
    await waitForText('Create Azure credentials file')
    await waitForText('Configure OIDC issuer')
    await waitForText('Create workload identities')
    await waitForText('Create Azure infrastructure')
    await waitForText('Create the Hosted Control Plane')
    // find code blocks
    await waitForTestId('code-content')
    await waitForTestId('helper-command')
    await waitForText('Copy login command')
  })
})
