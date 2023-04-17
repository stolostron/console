/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { screen } from '@testing-library/dom'
import { render } from '@testing-library/react'
import { ShareSearchModal } from './ShareSearchModal'

test('renders share modal with searchText', () => {
  const { getByText } = render(
    <ShareSearchModal
      shareSearch={{ id: '123', name: 'test-saved-search', searchText: 'kind:pod name:testPod' }}
      onClose={() => {}}
    />
  )
  expect(getByText('Share search')).toBeInTheDocument()
  expect(
    screen.getByDisplayValue(/http:\/\/localhost\/\?filters=\{"textsearch":"kind%3apod%20name%3atestpod"\}/i)
  ).toBeInTheDocument()
})
