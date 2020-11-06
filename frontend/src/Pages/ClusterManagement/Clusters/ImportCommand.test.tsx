import React from 'react'
import { Route, MemoryRouter } from 'react-router-dom'
import { render, waitFor, act } from '@testing-library/react'
import { ImportCommandPage } from './ImportCommand'
import { secretMethods } from '../../../lib/useSecret'

jest.mock('../../../lib/useSecret', () => ({ secretMethods: { get: jest.fn() } }))

describe('ImportCommand', () => {
    jest.setTimeout(15000)
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/clusters/import/foobar']}>
                <Route path="/cluster-management/clusters/import/:clusterName">
                    <ImportCommandPage />
                </Route>
            </MemoryRouter>
        )
    }

    test('renders import command', async () => {
        secretMethods.get.mockResolvedValueOnce({
            data: {
                kind: 'Secret',
                apiVersion: 'v1',
                metadata: {
                    name: 'floobar-import',
                    namespace: 'floobar',
                    selfLink: '/api/v1/namespaces/floobar/secrets/floobar-import',
                    uid: 'd5dd90db-1b79-43cd-9dda-8e763b7daa7b',
                    resourceVersion: '14106190',
                    creationTimestamp: '2020-11-02T19:57:44Z',
                    ownerReferences: [
                        {
                            apiVersion: 'cluster.open-cluster-management.io/v1',
                            kind: 'ManagedCluster',
                            name: 'floobar',
                            uid: '80d618d1-04c3-4a74-8e05-4351f3905676',
                            controller: true,
                            blockOwnerDeletion: true,
                        },
                    ],
                    managedFields: [
                        {
                            manager: 'rcm-controller',
                            operation: 'Update',
                            apiVersion: 'v1',
                            time: '2020-11-02T19:57:44Z',
                            fieldsType: 'FieldsV1',
                            fieldsV1: {
                                'f:data': { '.': {}, 'f:crds.yaml': {}, 'f:import.yaml': {} },
                                'f:metadata': {
                                    'f:ownerReferences': {
                                        '.': {},
                                        'k:{"uid":"80d618d1-04c3-4a74-8e05-4351f3905676"}': {
                                            '.': {},
                                            'f:apiVersion': {},
                                            'f:blockOwnerDeletion': {},
                                            'f:controller': {},
                                            'f:kind': {},
                                            'f:name': {},
                                            'f:uid': {},
                                        },
                                    },
                                },
                                'f:type': {},
                            },
                        },
                    ],
                },
                data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
                type: 'Opaque',
            },
            status: 200,
            statusText: 'OK',
            headers: { 'content-length': '37208', 'content-type': 'application/json; charset=utf-8' },
            config: {
                url: 'http://localhost:4000/cluster-management/proxy/api/v1/namespaces/floobar/secrets/floobar-import',
                method: 'get',
                headers: { Accept: 'application/json, text/plain, */*' },
                transformRequest: [null],
                transformResponse: [null],
                timeout: 0,
                withCredentials: true,
                responseType: 'json',
                xsrfCookieName: 'XSRF-TOKEN',
                xsrfHeaderName: 'X-XSRF-TOKEN',
                maxContentLength: -1,
                maxBodyLength: -1,
            },
            request: {},
        })
        const { getByTestId } = render(<Component />)
        await waitFor(() => new Promise((resolve) => setTimeout(() => resolve(), 0)))
        expect(getByTestId('import-command')).toBeInTheDocument()
    })
    test('renders loading state', async () => {
        secretMethods.get.mockResolvedValueOnce({
            data: {
                kind: 'Secret',
                apiVersion: 'v1',
                metadata: {
                    name: 'floobar-import',
                    namespace: 'floobar',
                    selfLink: '/api/v1/namespaces/floobar/secrets/floobar-import',
                    uid: 'd5dd90db-1b79-43cd-9dda-8e763b7daa7b',
                    resourceVersion: '14106190',
                    creationTimestamp: '2020-11-02T19:57:44Z',
                    ownerReferences: [
                        {
                            apiVersion: 'cluster.open-cluster-management.io/v1',
                            kind: 'ManagedCluster',
                            name: 'floobar',
                            uid: '80d618d1-04c3-4a74-8e05-4351f3905676',
                            controller: true,
                            blockOwnerDeletion: true,
                        },
                    ],
                    managedFields: [
                        {
                            manager: 'rcm-controller',
                            operation: 'Update',
                            apiVersion: 'v1',
                            time: '2020-11-02T19:57:44Z',
                            fieldsType: 'FieldsV1',
                            fieldsV1: {
                                'f:data': { '.': {}, 'f:crds.yaml': {}, 'f:import.yaml': {} },
                                'f:metadata': {
                                    'f:ownerReferences': {
                                        '.': {},
                                        'k:{"uid":"80d618d1-04c3-4a74-8e05-4351f3905676"}': {
                                            '.': {},
                                            'f:apiVersion': {},
                                            'f:blockOwnerDeletion': {},
                                            'f:controller': {},
                                            'f:kind': {},
                                            'f:name': {},
                                            'f:uid': {},
                                        },
                                    },
                                },
                                'f:type': {},
                            },
                        },
                    ],
                },
                data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
                type: 'Opaque',
            },
            status: 200,
            statusText: 'OK',
            headers: { 'content-length': '37208', 'content-type': 'application/json; charset=utf-8' },
            config: {
                url: 'http://localhost:4000/cluster-management/proxy/api/v1/namespaces/floobar/secrets/floobar-import',
                method: 'get',
                headers: { Accept: 'application/json, text/plain, */*' },
                transformRequest: [null],
                transformResponse: [null],
                timeout: 0,
                withCredentials: true,
                responseType: 'json',
                xsrfCookieName: 'XSRF-TOKEN',
                xsrfHeaderName: 'X-XSRF-TOKEN',
                maxContentLength: -1,
                maxBodyLength: -1,
            },
            request: {},
        })
        const { getByRole } = render(<Component />)
        expect(getByRole('progressbar')).toBeInTheDocument()
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 0)))
    })
    test('renders error state', async () => {
        secretMethods.get.mockResolvedValue({
            data: {
                kind: 'Status',
                apiVersion: 'v1',
                metadata: {},
                status: 'Failure',
                message: 'secrets "foobar-import" not found',
                reason: 'NotFound',
                details: { name: 'foobar-import', kind: 'secrets' },
                code: 404,
            },
            status: 404,
            statusText: 'Not Found',
            headers: { 'content-length': '199', 'content-type': 'application/json; charset=utf-8' },
            config: {
                url: 'http://localhost:4000/cluster-management/proxy/api/v1/namespaces/foobar/secrets/foobar-import',
                method: 'get',
                headers: { Accept: 'application/json, text/plain, */*' },
                transformRequest: [null],
                transformResponse: [null],
                timeout: 0,
                withCredentials: true,
                responseType: 'json',
                xsrfCookieName: 'XSRF-TOKEN',
                xsrfHeaderName: 'X-XSRF-TOKEN',
                maxContentLength: -1,
                maxBodyLength: -1,
            },
            request: {},
        })
        const { getByText } = render(<Component />)
        await waitFor(() => expect(getByText('404: secrets "foobar-import" not found')).toBeInTheDocument(), {
            timeout: 15000,
        })
    })
})
