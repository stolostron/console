/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { ServiceAccounts } from './ServiceAccounts'

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <ServiceAccounts />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ServiceAccounts Page', () => {
  test('should render service accounts placeholder', async () => {
    render(<Component />)

    expect(screen.getByText('Service Accounts list')).toBeInTheDocument()
  })
})
