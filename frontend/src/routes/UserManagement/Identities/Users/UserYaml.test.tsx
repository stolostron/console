/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UserYaml } from './UserYaml'
import { User, UserApiVersion, UserKind } from '../../../../resources/rbac'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('./UserPage', () => ({
  ...jest.requireActual('./UserPage'),
  useUserDetailsContext: jest.fn(),
}))

import { useUserDetailsContext } from './UserPage'

const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <UserYaml />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('UserYaml', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseUserDetailsContext.mockClear()
  })

  test('should render loading state', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: undefined,
      groups: [],
      loading: true,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render user not found message', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: undefined,
      groups: [],
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('User not found')).toBeInTheDocument()
  })

  test('should render YAML editor with user data', () => {
    const mockUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'test-user',
        uid: 'test-user-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      fullName: 'Test User',
      identities: ['htpasswd:test-user'],
    }

    mockUseUserDetailsContext.mockReturnValue({
      user: mockUser,
      groups: [],
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
