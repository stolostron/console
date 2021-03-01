/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBadRequestStatus, nockPatch } from '../../../../lib/nock-util'
import { IResource } from '../../../../resources/resource'
import { EditLabels } from './EditLabels'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'

const mockCluster: Cluster = {
    name: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.pendingimport,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
        isManagedOpenShift: false,
    },
    labels: { abc: '123' },
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hiveSecrets: undefined,
    isHive: false,
    isManaged: true,
}

describe('EditLabels', () => {
    test('can add and remove labels', async () => {
        const resource: IResource = {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: 'test-cluster', labels: { abc: '123' } },
        }
        const { getByTestId, getByText } = render(<EditLabels cluster={mockCluster} close={() => {}} />)
        expect(getByText('abc=123')).toBeInTheDocument()
        getByTestId('label-input-button').click()
        userEvent.type(getByTestId('labels-input'), `foo=bar{enter}`)

        getByText('common:save').click()
        const nockScope = nockPatch(resource, [
            { op: 'remove', path: `/metadata/labels/abc` },
            { op: 'add', path: `/metadata/labels/abc`, value: '123' },
            { op: 'add', path: `/metadata/labels/foo`, value: 'bar' },
        ])

        // nock.recorder.rec()
        await waitFor(() => expect(nockScope.isDone()).toBeTruthy())
    })

    test('shows errors', async () => {
        const resource: IResource = {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: { name: 'test-cluster', labels: { abc: '123' } },
        }
        const { getByText } = render(<EditLabels cluster={mockCluster} close={() => {}} />)
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
        mockCluster.labels = {}
        const { queryByText, getByTestId, getByText } = render(<EditLabels cluster={mockCluster} close={() => {}} />)
        getByTestId('label-input-button').click()
        userEvent.type(getByTestId('labels-input'), `foo=bar{enter}`)
        expect(getByText('foo=bar')).toBeVisible()
        getByTestId(`remove-foo`).click()
        expect(queryByText('foo=bar')).toBeNull()
    })
})
