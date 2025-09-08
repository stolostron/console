/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupYaml } from './GroupYaml'
import { Group, UserApiVersion, GroupKind } from '../../../../resources/rbac'

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

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupYaml />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupYaml', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
  })

  test('should render loading state', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: [],
      loading: true,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render group not found message', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: [],
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Group not found')).toBeInTheDocument()
  })

  test('should render YAML editor with group data', () => {
    const mockGroup: Group = {
      apiVersion: UserApiVersion,
      kind: GroupKind,
      metadata: {
        name: 'test-group',
        uid: 'test-group-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      users: ['test-user'],
    }

    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: [],
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
