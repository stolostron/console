/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../../../NavigationPath'

import AvailabilityOptionsForm from './AvailabilityOptionsForm'
import { waitForText } from '../../../../../../lib/test-util'

describe('Availability Options Form', () => {
  const handleChange = jest.fn()

  const activeControl = {
    controllerAvailabilityPolicy: 'HighlyAvailable',
    infrastructureAvailabilityPolicy: 'HighlyAvailable',
  }

  // const activeControl2 = {
  //   controller: 'SingleReplica',
  //   controller: 'SingleReplica',
  // }

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

  test('renders', async () => {
    const { container } = render(<Component />)
    await waitForText('Controller availability policy')
    expect(container).toMatchSnapshot()
  })
})
