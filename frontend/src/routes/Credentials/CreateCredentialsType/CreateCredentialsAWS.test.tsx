/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { nockIgnoreApiPaths } from '../../../lib/nock-util'
import { clickByTestId } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreateCredentialsAWS } from './CreateCredentialsAWS'

describe('CreateCredentialsAWS', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  const Component = () => {
    return (
      <StateProvider>
        <MemoryRouter initialEntries={[NavigationPath.addAWSType]}>
          <Routes>
            <Route path={NavigationPath.addAWSType} element={<CreateCredentialsAWS />} />
          </Routes>
        </MemoryRouter>
      </StateProvider>
    )
  }

  test('can click aws', async () => {
    render(<Component />)
    await clickByTestId('aws-standard')
  })

  test('can click aws S3', async () => {
    render(<Component />)
    await clickByTestId('aws-bucket')
  })
})
