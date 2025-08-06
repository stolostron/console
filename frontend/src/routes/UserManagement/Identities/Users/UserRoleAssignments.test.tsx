/* Copyright Contributors to the Open Cluster Management project */
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'

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

describe.skip('UserRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseUserDetailsContext.mockClear()
  })

  test('should render loading state during initial load', () => {
    // TODO
  })

  test('should render user not found message', () => {
    // TODO
  })

  test('should render empty state with create button', () => {
    // TODO
  })

  test('should find user by UID', () => {
    // TODO
  })
})
