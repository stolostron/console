/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../../../NavigationPath'

import AvailabilityOptionsForm from './AvailabilityOptionsForm'
import { waitForText } from '../../../../../../lib/test-util'
import userEvent from '@testing-library/user-event'

describe('Availability Options Form', () => {
  const handleChange = jest.fn()
  const activeControl = {
    controller: 'HighlyAvailable',
    infra: 'HighlyAvailable',
  }

  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createCluster]}>
          <Routes>
            <Route
              path={NavigationPath.createCluster}
              element={
                <AvailabilityOptionsForm
                  control={{
                    active: activeControl,
                  }}
                  handleChange={handleChange}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('renders with highly available selected by default', async () => {
    render(<Component />)
    await waitForText('Controller availability policy')

    const controllerRadioHA = screen.getByTestId('controller-ha')
    const infraRadioHA = screen.getByTestId('infra-ha')
    const controllerRadioSingle = screen.getByTestId('controller-single')
    const infraRadioSingle = screen.getByTestId('infra-single')

    expect(controllerRadioHA).toHaveProperty('checked', true)
    expect(infraRadioHA).toHaveProperty('checked', true)

    userEvent.click(controllerRadioSingle)
    userEvent.click(infraRadioSingle)

    expect(controllerRadioSingle).toHaveProperty('checked', true)
    expect(infraRadioSingle).toHaveProperty('checked', true)
  })
})
