/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths } from '../../../../../../../../lib/nock-util'
import { mockOpenShiftConsoleConfigMap } from '../../../../../../../../lib/test-metadata'
import { clickByText, waitForNocks, waitForTestId, waitForText } from '../../../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { HypershiftKubeVirtCLI } from './HypershiftKubeVirtCLI'

describe('HypershiftKubeVirtCLI', () => {
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createKubeVirtCLI]}>
          <Route path={NavigationPath.createKubeVirtCLI}>
            <HypershiftKubeVirtCLI />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('should show all the steps', async () => {
    nockIgnoreApiPaths()
    const initialNocks = [nockGet(mockOpenShiftConsoleConfigMap)]
    render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('Prerequisite and Configuration')
    await waitForText('Running the Hosted Control Plane command')
    // find code block
    await waitForTestId('code-content')
    await waitForTestId('helper-command')
    await clickByText('Use the oc login command.')
  })
})
