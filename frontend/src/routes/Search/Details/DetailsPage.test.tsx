/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockDelete, nockGet } from '../../../lib/nock-util'
import { waitForNocks } from '../../../lib/test-util'
import DetailsPage from './DetailsPage'

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')
    return {
        __esModule: true,
        ...originalModule,
        useLocation: () => ({
            pathname: '/multicloud/resources',
            search: '?cluster=testCluster&kind=pods&apiversion=v1&namespace=testNamespace&name=testPod',
        }),
        useHistory: () => ({
            push: jest.fn(),
        }),
    }
})
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/multicloud/resources',
        search: '?cluster=testCluster&kind=pods&apiversion=v1&namespace=testNamespace&name=testPod',
    },
})
jest.mock('./YAMLPage', () => {
    // TODO replace with actual YAML Page when Monaco editor is imported correctly
    return function YAMLPage() {
        return <div />
    }
})

const getResourceRequest = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: 'afd0d7d61f43f99d50d6e5a0ed365f202b0e4699',
        namespace: 'testCluster',
        labels: {
            viewName: 'afd0d7d61f43f99d50d6e5a0ed365f202b0e4699',
        },
    },
    spec: {
        scope: {
            name: 'testPod',
            resource: 'v1',
        },
    },
}

const getResourceResponse = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: 'afd0d7d61f43f99d50d6e5a0ed365f202b0e4699',
        namespace: 'testCluster',
        labels: {
            viewName: 'afd0d7d61f43f99d50d6e5a0ed365f202b0e4699',
        },
    },
    spec: {
        scope: {
            name: 'testPod',
            resource: 'v1',
        },
    },
    status: {
        conditions: [
            {
                message: 'Watching resources successfully',
                reason: 'GetResourceProcessing',
                status: 'True',
                type: 'Processing',
            },
        ],
    },
}

const deleteMCVRequest = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: 'afd0d7d61f43f99d50d6e5a0ed365f202b0e4699',
        namespace: 'testCluster',
        labels: {
            viewName: 'afd0d7d61f43f99d50d6e5a0ed365f202b0e4699',
        },
    },
}

describe('DetailsPage', () => {
    it('should render details page correctly', async () => {
        const deleteResourceNock = nockGet(getResourceRequest, getResourceResponse)
        const deleteMCV = nockDelete(deleteMCVRequest)
        render(
            <RecoilRoot>
                <Router history={createBrowserHistory()}>
                    <DetailsPage />
                </Router>
            </RecoilRoot>
        )

        // Wait for delete resource requests to finish
        await waitForNocks([deleteResourceNock])

        // Wait for deletion of MCV now that we got a successful response
        await waitForNocks([deleteMCV])

        // Test that the component has rendered correctly with data
        await waitFor(() => expect(screen.queryByText('testPod')).toBeTruthy())
    })
})
