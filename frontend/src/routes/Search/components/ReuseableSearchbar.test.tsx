/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { isGlobalHubState, Settings, settingsState } from '../../../atoms'
import ReuseableSearchbar from './ReuseableSearchbar'

test('renders with default Search link', () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'disabled',
  }
  const { baseElement } = render(
    <StateProvider
      initializeStore={(store) => {
        store.set(isGlobalHubState, false)
        store.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <ReuseableSearchbar />
      </MemoryRouter>
    </StateProvider>
  )
  expect(baseElement).toMatchSnapshot()
})

test('renders with Global Search link', () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'enabled',
  }
  const { baseElement } = render(
    <StateProvider
      initializeStore={(store) => {
        store.set(isGlobalHubState, true)
        store.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <ReuseableSearchbar />
      </MemoryRouter>
    </StateProvider>
  )
  expect(baseElement).toMatchSnapshot()
})
