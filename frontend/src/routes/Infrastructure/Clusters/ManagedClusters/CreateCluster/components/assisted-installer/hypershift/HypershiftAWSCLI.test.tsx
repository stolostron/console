/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths } from '../../../../../../../../lib/nock-util'
import { mockOpenShiftConsoleConfigMap } from '../../../../../../../../lib/test-metadata'
import { clickByText, waitForNocks, waitForTestId, waitForText } from '../../../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { HypershiftAWSCLI } from './HypershiftAWSCLI'

describe('HypershiftAWSCLI', () => {
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createAWSCLI]}>
          <Route path={NavigationPath.createAWSCLI}>
            <HypershiftAWSCLI />
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
    await waitForText('Prerequisite')
    await waitForText('Amazon Web Services (AWS) credential')
    await waitForText('Running the Hosted Control Plane command')
    // find code block
    await waitForTestId('code-content')
    await waitForTestId('helper-command')
    await clickByText('Use the oc login command.')
  })
})
