/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Groups } from './Groups'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <Groups />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Groups Page', () => {
  test('should render groups placeholder', async () => {
    render(<Component />)

    expect(screen.getByText('Groups list')).toBeInTheDocument()
  })
})
