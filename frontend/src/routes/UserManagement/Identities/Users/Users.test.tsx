/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths, nockList } from '../../../lib/nock-util'
import { UserDefinition } from '../../../resources/rbac'
import { Users } from './Users'

const mockUsers = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'test-user',
      creationTimestamp: '2025-01-24T17:48:45Z',
    },
    identities: ['htpasswd:test-user'],
    groups: ['developers'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'system-user',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    identities: [],
    groups: [],
  },
]

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Users Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render users table with all users', async () => {
    nockList(UserDefinition, mockUsers)

    render(<Component />)

    await waitFor(
      () => {
        expect(screen.getByText('test-user')).toBeInTheDocument()
        expect(screen.getByText('system-user')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  test('should render component without errors', () => {
    render(<Component />)

    expect(document.body).toBeInTheDocument()
  })
})
