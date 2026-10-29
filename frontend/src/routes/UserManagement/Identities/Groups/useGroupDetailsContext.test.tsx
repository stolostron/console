/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { ReactNode } from 'react'
import { Group, User } from '../../../../resources/rbac'
import { GroupDetailsContext, useGroupDetailsContext } from './useGroupDetailsContext'

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: { name: 'developers', uid: 'developers-uid' },
  users: ['dev1'],
}

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: { name: 'dev1', uid: 'dev1-uid' },
  },
]

function wrapper(context: GroupDetailsContext) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={['/groups/developers']}>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path="/groups/:id" element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }
}

describe('useGroupDetailsContext', () => {
  test('returns group and users from the outlet context', () => {
    const { result } = renderHook(() => useGroupDetailsContext(), {
      wrapper: wrapper({ group: mockGroup, users: mockUsers }),
    })

    expect(result.current.group).toEqual(mockGroup)
    expect(result.current.users).toEqual(mockUsers)
  })

  test('returns undefined fields when the outlet context is empty', () => {
    const { result } = renderHook(() => useGroupDetailsContext(), {
      wrapper: wrapper({}),
    })

    expect(result.current.group).toBeUndefined()
    expect(result.current.users).toBeUndefined()
  })
})
