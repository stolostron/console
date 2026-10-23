/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { UserYaml } from './UserYaml'
import { User, UserApiVersion, UserKind } from '../../../../resources/rbac'
import { useUserDetailsContext } from './UserPage'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearch', () => ({
  useFleetSearch: jest.fn().mockReturnValue([[], true, undefined, jest.fn()]),
}))

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription', () => ({
  useFleetSearchSubscription: jest.fn().mockReturnValue([undefined, false, undefined]),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('./UserPage', () => ({
  ...jest.requireActual('./UserPage'),
  useUserDetailsContext: jest.fn(),
}))

const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

function Component() {
  return (
    <StateProvider>
      <MemoryRouter>
        <UserYaml />
      </MemoryRouter>
    </StateProvider>
  )
}

describe('UserYaml', () => {
  beforeEach(() => {
    mockUseUserDetailsContext.mockClear()
  })

  test('should render user not found message', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: undefined,
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
    })

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
