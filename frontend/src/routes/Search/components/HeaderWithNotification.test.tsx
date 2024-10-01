/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { isGlobalHubState, Settings, settingsState } from '../../../atoms'
import { Message } from '../search-sdk/search-sdk'
import HeaderWithNotification from './HeaderWithNotification'

// case where we have a message about disabled search (current message)
test('renders clusters disabled message', () => {
  const disableSearch = [
    { id: 'S20', kind: 'info', description: 'Search is disabled on some of your managed clusters.' },
  ]
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <HeaderWithNotification messages={disableSearch} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

// case where we have no message
test('renders empty message', () => {
  const emptyMessage: Message[] = []
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <HeaderWithNotification messages={emptyMessage} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

// case where we have a different message
test('renders unknown message', () => {
  const newMessage = [{ id: 'S90', kind: 'warning', message: 'This is a new message' }]
  const { baseElement } = render(
    <RecoilRoot>
      <MemoryRouter>
        <HeaderWithNotification messages={newMessage} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})

test('renders with Global Search alert & no message', () => {
  const mockSettings: Settings = {
    globalSearchFeatureFlag: 'enabled',
  }
  const emptyMessage: Message[] = []
  const { baseElement } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(isGlobalHubState, true)
        snapshot.set(settingsState, mockSettings)
      }}
    >
      <MemoryRouter>
        <HeaderWithNotification messages={emptyMessage} />
      </MemoryRouter>
    </RecoilRoot>
  )
  expect(baseElement).toMatchSnapshot()
})
