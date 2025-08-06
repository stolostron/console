/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { ServiceAccountYaml } from './ServiceAccountYaml'

function Component({ serviceAccountId = 'test-service-account' }: { serviceAccountId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter
        initialEntries={[`/multicloud/user-management/identities/service-accounts/${serviceAccountId}/yaml`]}
      >
        <ServiceAccountYaml />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ServiceAccountYaml', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render service account YAML page', () => {
    render(<Component />)

    expect(screen.getByText('Service Account YAML')).toBeInTheDocument()
  })

  test('should render with different service account ID', () => {
    render(<Component serviceAccountId="different-service-account" />)

    expect(screen.getByText('Service Account YAML')).toBeInTheDocument()
  })
})
