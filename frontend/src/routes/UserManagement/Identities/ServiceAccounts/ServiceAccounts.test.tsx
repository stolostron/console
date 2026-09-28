/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { ServiceAccounts } from './ServiceAccounts'

function Component() {
  return (
    <StateProvider>
      <MemoryRouter>
        <ServiceAccounts />
      </MemoryRouter>
    </StateProvider>
  )
}

describe('ServiceAccounts Page', () => {
  test('should render service accounts placeholder', async () => {
    render(<Component />)

    expect(screen.getByText('Service Accounts list')).toBeInTheDocument()
  })
})
