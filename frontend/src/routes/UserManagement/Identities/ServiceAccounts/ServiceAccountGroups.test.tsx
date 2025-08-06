/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { ServiceAccountGroups } from './ServiceAccountGroups'

function Component({ serviceAccountId = 'test-service-account' }: { serviceAccountId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter
        initialEntries={[`/multicloud/user-management/identities/service-accounts/${serviceAccountId}/groups`]}
      >
        <ServiceAccountGroups />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ServiceAccountGroups', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render service account groups page', () => {
    render(<Component />)

    expect(screen.getByText('Service Account Groups')).toBeInTheDocument()
  })

  test('should render with different service account ID', () => {
    render(<Component serviceAccountId="different-service-account" />)

    expect(screen.getByText('Service Account Groups')).toBeInTheDocument()
  })
})
