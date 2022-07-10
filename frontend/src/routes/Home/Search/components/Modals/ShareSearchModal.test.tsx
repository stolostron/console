/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
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
    expect(getByText('http://localhost/?filters={"textsearch":"kind%3Apod%20name%3AtestPod"}')).toBeInTheDocument()
})
