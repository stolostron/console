import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBadRequestStatus, nockPatch } from '../lib/nock-util'
import { IResource } from '../resources/resource'
import { EditLabelsModal } from './EditLabelsModal'

describe('edit labels modal', () => {
    test('can add and remove labels', async () => {
        const resource: IResource = {
            apiVersion: 'v1',
            kind: 'kind',
            metadata: { name: 'name', namespace: 'namespace', labels: { abc: '123' } },
        }
        const { getByTestId, getByText } = render(<EditLabelsModal resource={resource} close={() => {}} />)
        expect(getByText('edit.labels.title')).toBeInTheDocument()
        expect(getByText('abc=123')).toBeInTheDocument()
        getByTestId('label-input-button').click()
        userEvent.type(getByTestId('labels-input'), `foo=bar{enter}`)
        const nockScope = nockPatch(resource, [
            { op: 'remove', path: `/metadata/labels/abc` },
            { op: 'add', path: `/metadata/labels/abc`, value: '123' },
            { op: 'add', path: `/metadata/labels/foo`, value: 'bar' },
        ])
        // nock.recorder.rec()
        getByText(`save`).click()
        await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
    })

    test('shows errors', async () => {
        const resource: IResource = {
            apiVersion: 'v1',
            kind: 'kind',
            metadata: { name: 'name', namespace: 'namespace', labels: { abc: '123' } },
        }
        const { getByText } = render(<EditLabelsModal resource={resource} close={() => {}} />)
        expect(getByText('edit.labels.title')).toBeInTheDocument()
        expect(getByText('abc=123')).toBeInTheDocument()
        const nockScope = nockPatch(
            resource,
            [
                { op: 'remove', path: `/metadata/labels/abc` },
                { op: 'add', path: `/metadata/labels/abc`, value: '123' },
            ],
            mockBadRequestStatus
        )
        getByText(`save`).click()
        await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
        waitFor(() => expect('There was bad data sent for accessing resources.').toBeInTheDocument())
    })

    test('can add and remove labels without labels on resource', async () => {
        const resource: IResource = {
            apiVersion: 'v1',
            kind: 'kind',
            metadata: {},
        }
        const { queryByText, getByTestId, getByText } = render(<EditLabelsModal resource={resource} close={() => {}} />)
        expect(getByText('edit.labels.title')).toBeInTheDocument()
        getByTestId('label-input-button').click()
        userEvent.type(getByTestId('labels-input'), `foo=bar{enter}`)
        expect(getByText('foo=bar')).toBeVisible()
        getByTestId(`remove-foo`).click()
        expect(queryByText('foo=bar')).toBeNull()
    })
})
