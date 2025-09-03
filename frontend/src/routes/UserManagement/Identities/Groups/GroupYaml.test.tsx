/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupYaml } from './GroupYaml'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}))

import { useQuery } from '../../../../lib/useQuery'
import { useParams } from 'react-router-dom-v5-compat'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>

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
    mockUseQuery.mockClear()
    mockUseParams.mockClear()
  })

  test('should render loading state', () => {
    mockUseParams.mockReturnValue({ id: 'test-group' })
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render group not found message', () => {
    mockUseParams.mockReturnValue({ id: 'non-existent-group' })
    mockUseQuery.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  test('should render YAML editor with group data', () => {
    const mockGroup = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'test-group',
        uid: 'test-group-uid',
        creationTimestamp: '2025-01-24T17:48:45Z',
      },
      users: ['test-user'],
    }

    mockUseParams.mockReturnValue({ id: 'test-group' })
    mockUseQuery.mockReturnValue({
      data: [mockGroup],
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('should handle group with missing metadata', () => {
    const mockGroupWithMissingData = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: undefined,
        uid: 'test-group-uid',
        creationTimestamp: undefined,
      },
      users: [],
    }

    mockUseParams.mockReturnValue({ id: 'test-group-uid' })
    mockUseQuery.mockReturnValue({
      data: [mockGroupWithMissingData],
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
