/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import HostsForm, { getControlSummary } from './HostsForm'
import { render } from '@testing-library/react'
import i18next from 'i18next'

describe('HostForm', () => {
  const handleChange = jest.fn()
  const onNext = jest.fn()
  const activeControl = {
    agentNamespace: 'test test',
    nodePools: [],
    controllerAvailabilityPolicy: 'HighlyAvailable',
    infrastructureAvailabilityPolicy: 'HighlyAvailable',
    olmCatalogPlacement: 'management',
  }

  const activeControl2 = {
    agentNamespace: 'test test',
    nodePools: [],
    controllerAvailabilityPolicy: 'SingleReplica',
    infrastructureAvailabilityPolicy: 'SingleReplica',
    olmCatalogPlacement: 'guest',
  }

  const t = i18next.t.bind(i18next)
  const Component = () => {
    return (
      <RecoilRoot>
        <MemoryRouter>
          <HostsForm
            control={{
              active: activeControl,
              step: {
                title: {
                  isComplete: false,
                },
              },
              onNext: onNext,
            }}
            handleChange={handleChange}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('it renders', async () => {
    const { container } = render(<Component />)
    expect(container).toMatchSnapshot()
  })

  test('summary should match', async () => {
    const summary = getControlSummary(activeControl, t)
    expect(summary()).toMatchSnapshot()

    const summary2 = getControlSummary(activeControl2, t)
    expect(summary2()).toMatchSnapshot()
  })
})
