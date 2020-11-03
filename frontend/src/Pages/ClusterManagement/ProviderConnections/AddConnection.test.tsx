import React from 'react'
import { render } from '@testing-library/react'
import { Project } from '../../../lib/Project'
import { AddConnectionPageContent } from './AddConnection'
import { configure } from '@testing-library/dom'
// import userEvent from '@testing-library/user-event'

configure({ testIdAttribute: 'id' })
test('clusters page', () => {
    const projects: Project[] = [
        {
            apiVersion: 'project.openshift.io/v1',
            kind: 'Project',
            metadata: {
                name: 'default',
            },
        },
    ]
    const mockFn = jest.fn()
    const { getByTestId, getByText } = render(
        <AddConnectionPageContent projects={projects} createProviderConnection={mockFn} />
    )
    // userEvent.type(getByTestId('connectionName'), 'test-connection')
    // getByText('Submit').click()

    // expect(mockFn).toBeCalled()
})
