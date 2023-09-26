/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
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
