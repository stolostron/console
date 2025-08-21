/* Copyright Contributors to the Open Cluster Management project */
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('./GroupPage', () => ({
  ...jest.requireActual('./GroupPage'),
  useGroupDetailsContext: jest.fn(),
}))

import { useGroupDetailsContext } from './GroupPage'

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>

describe.skip('GroupRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
  })

  test('should render loading state during initial load', () => {
    // TODO
  })

  test('should render group not found message', () => {
    // TODO
  })

  test('should render empty state with create button', () => {
    // TODO
  })

  test('should find group by UID', () => {
    // TODO
  })
})
