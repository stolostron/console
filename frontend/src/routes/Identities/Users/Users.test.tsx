/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Users } from './Users'

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
  test('should render users placeholder', () => {
    render(<Component />)

    expect(screen.getByText('Users list')).toBeInTheDocument()
  })
})
