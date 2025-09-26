/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockOff, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import RolesManagement from './RolesManagement'

describe('RolesManagement Router', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths() //ignore /apiPaths
  })
  test('should render without errors', () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/user-management/roles']}>
          <RolesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )
    nockOff(
      '/apis/rbac.authorization.k8s.io/v1/clusterroles?labelSelector=rbac.open-cluster-management.io/filter=vm-clusterroles',
      'listClusterroles1'
    )

    expect(document.body).toBeInTheDocument()
  })

  test('should render role detail route', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/multicloud/user-management/roles/test-role']}>
          <RolesManagement />
        </MemoryRouter>
      </RecoilRoot>
    )
    nockOff(
      '/apis/rbac.authorization.k8s.io/v1/clusterroles?labelSelector=rbac.open-cluster-management.io/filter=vm-clusterroles',
      'listClusterroles1'
    )

    expect(document.body).toBeInTheDocument()
  })
})
