/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupPage } from './GroupPage'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

function Component({ groupId = 'kubevirt-admins' }: { groupId?: string }) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
        <Routes>
          <Route path="/groups/:id" element={<GroupPage />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupPage', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('should render loading state', () => {
    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
  })

  test('should render group not found error', () => {
    render(<Component groupId="non-existent-group" />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('button.backToGroups')).toBeInTheDocument()
  })

  test('should render group page with navigation tabs', () => {
    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
    expect(screen.getAllByText('kubevirt-admins').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'YAML' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Role assignments' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument()
  })

  test('should render group page with empty group name', () => {
    render(<Component groupId="group-with-empty-name" />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('button.backToGroups')).toBeInTheDocument()
  })

  test('should find group by UID', () => {
    render(<Component groupId="mock-group-kubevirt-admins" />)

    expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
  })
})
