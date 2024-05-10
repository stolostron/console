/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { isGlobalHubState, Settings, settingsState } from '../../../../atoms'
import ReuseableSearchbar from './ReuseableSearchbar'

test('renders with default Search link', () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'disabled',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(isGlobalHubState, false), snapshot.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <ReuseableSearchbar />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('renders with Global Search link', () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'enabled',
  }
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(isGlobalHubState, true), snapshot.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <ReuseableSearchbar />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})
