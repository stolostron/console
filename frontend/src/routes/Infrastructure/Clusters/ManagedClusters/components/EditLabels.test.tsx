/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBadRequestStatus, nockPatch } from '../../../../../lib/nock-util'
import { IResource } from '../../../../../resources/resource'
import { EditLabels } from './EditLabels'
import { ManagedClusterApiVersion, ManagedClusterKind } from '../../../../../resources/managed-cluster'

const resource: IResource = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'test-cluster', labels: { abc: '123' } },
}

describe('EditLabels', () => {
    test('can add and remove labels', async () => {
        const { getByTestId, getByText } = render(<EditLabels resource={resource} close={() => {}} />)
        expect(getByText('abc=123')).toBeInTheDocument()
        getByTestId('label-input-button').click()
        userEvent.type(getByTestId('labels-input'), `foo=bar{enter}`)
        const nockScope = nockPatch(resource, [
            { op: 'remove', path: `/metadata/labels/abc` },
            { op: 'add', path: `/metadata/labels/abc`, value: '123' },
            { op: 'add', path: `/metadata/labels/foo`, value: 'bar' },
        ])
        getByText('common:save').click()
        await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
    })

    test('shows errors', async () => {
        const resource: IResource = {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: 'test-cluster', labels: { abc: '123' } },
        }
        const { getByText } = render(<EditLabels resource={resource} close={() => {}} />)
        expect(getByText('abc=123')).toBeInTheDocument()
        const nockScope = nockPatch(
            resource,
            [
                { op: 'remove', path: `/metadata/labels/abc` },
                { op: 'add', path: `/metadata/labels/abc`, value: '123' },
            ],
            mockBadRequestStatus
        )
        getByText('common:save').click()
        await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
        waitFor(() => expect('There was bad data sent for accessing resources.').toBeInTheDocument())
    })

    test('can add and remove labels without labels on resource', async () => {
        resource.metadata!.labels = {}
        const { queryByText, getByTestId, getByText } = render(<EditLabels resource={resource} close={() => {}} />)
        getByTestId('label-input-button').click()
        userEvent.type(getByTestId('labels-input'), `foo=bar{enter}`)
        expect(getByText('foo=bar')).toBeVisible()
        getByTestId(`remove-foo`).click()
        expect(queryByText('foo=bar')).toBeNull()
    })
})
