/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
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
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.addAWSType]}>
          <Routes>
            <Route path={NavigationPath.addAWSType} element={<CreateCredentialsAWS />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
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
