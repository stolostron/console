/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { ServiceAccountGroups } from './ServiceAccountGroups'

function Component({ serviceAccountId = 'test-service-account' }: { serviceAccountId?: string }) {
  return (
    <StateProvider>
      <MemoryRouter
        initialEntries={[`/multicloud/user-management/identities/service-accounts/${serviceAccountId}/groups`]}
      >
        <ServiceAccountGroups />
      </MemoryRouter>
    </StateProvider>
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
