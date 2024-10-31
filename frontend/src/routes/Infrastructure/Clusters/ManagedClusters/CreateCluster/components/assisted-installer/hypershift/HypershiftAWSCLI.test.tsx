/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockGet, nockIgnoreApiPaths } from '../../../../../../../../lib/nock-util'
import { mockOpenShiftConsoleConfigMap } from '../../../../../../../../lib/test-metadata'
import { waitForNocks, waitForTestId, waitForText } from '../../../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../../../NavigationPath'
import { HypershiftAWSCLI } from './HypershiftAWSCLI'

describe('HypershiftAWSCLI', () => {
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createAWSCLI]}>
          <Routes>
            <Route path={NavigationPath.createAWSCLI} element={<HypershiftAWSCLI />} />
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
    await waitForText('Create Amazon Web Services (AWS) Security Token Service (STS) credential')
    await waitForText('Create AWS Identity and Access Management (IAM) role')
    await waitForText('Create the Hosted Control Plane')
    // find code block
    await waitForTestId('code-content')
    await waitForTestId('helper-command')
    await waitForText('Copy login command')
  })
})
