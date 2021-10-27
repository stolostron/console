/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { GetResourceDocument } from '../../../console-sdk/console-sdk'
import { wait } from '../../../lib/test-util'
import DetailsPage from './DetailsPage'

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')
    return {
        __esModule: true,
        ...originalModule,
        useLocation: () => ({
            pathname: '/multicloud/resources',
            search: '?cluster=testCluster&kind=pods&apiversion=apps/v1&namespace=testNamespace&name=testPod',
        }),
        useHistory: () => ({
            push: jest.fn(),
        }),
    }
})
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/multicloud/resources',
        search: '?cluster=testCluster&kind=pods&apiversion=apps/v1&namespace=testNamespace&name=testPod',
    },
})
jest.mock('./YAMLPage', () => {
    // TODO replace with actual YAML Page when Monaco editor is imported correctly
    return function YAMLPage() {
        return <div />
    }
})

describe('DetailsPage', () => {
    it('should render details page correctly', async () => {
        const mocks = [
            {
                request: {
                    query: GetResourceDocument,
                    variables: {
                        apiVersion: 'apps/v1',
                        kind: 'pods',
                        name: 'testPod',
                        namespace: 'testNamespace',
                        cluster: 'testCluster',
                    },
                },
                result: {
                    data: {
                        getResource: {
                            kind: 'Pod',
                            apiVersion: 'apps/v1',
                            metadata: {
                                name: 'testPod',
                                generateName: 'testPod-',
                                namespace: 'testNamespace',
                                resourceVersion: '33553',
                                creationTimestamp: '2021-01-01T00:00:00Z',
                                labels: {
                                    label: 'testLabel',
                                },
                            },
                            spec: {
                                replicas: 1,
                                template: {
                                    metadata: {
                                        creationTimestamp: null,
                                        labels: {
                                            label: 'testContainer',
                                        },
                                    },
                                    spec: {
                                        containers: [
                                            {
                                                name: 'testContainer',
                                                image: 'testImage',
                                            },
                                        ],
                                    },
                                },
                            },
                            status: {
                                replicas: 1,
                                readyReplicas: 1,
                                availableReplicas: 1,
                            },
                        },
                    },
                },
            },
        ]

        render(
            <RecoilRoot>
                <Router history={createBrowserHistory()}>
                    <MockedProvider mocks={mocks}>
                        <DetailsPage />
                    </MockedProvider>
                </Router>
            </RecoilRoot>
        )
        // Test the loading state while apollo query finishes
        // expect(screen.getByText('Loading')).toBeInTheDocument()
        // This wait pauses till apollo query is returning data
        await wait()
        // Test that the component has rendered correctly with data
        await waitFor(() => expect(screen.queryByText('testPod')).toBeTruthy())
    })
})
