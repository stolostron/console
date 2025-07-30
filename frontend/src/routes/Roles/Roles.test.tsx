/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../lib/nock-util'
import { Roles } from './Roles'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <Roles />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Roles Page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  test('should render roles page', () => {
    render(<Component />)

    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Roles list')).toBeInTheDocument()
  })
})
