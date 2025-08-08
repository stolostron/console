/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { ServiceAccountDetail } from './ServiceAccountDetail'

function Component({ serviceAccountId = 'test-service-account' }: { serviceAccountId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/multicloud/user-management/identities/service-accounts/${serviceAccountId}`]}>
        <ServiceAccountDetail />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ServiceAccountDetail', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render service account detail page', () => {
    render(<Component />)

    expect(screen.getByText('Service Account Details')).toBeInTheDocument()
  })

  test('should render with different service account ID', () => {
    render(<Component serviceAccountId="different-service-account" />)

    expect(screen.getByText('Service Account Details')).toBeInTheDocument()
  })
})
