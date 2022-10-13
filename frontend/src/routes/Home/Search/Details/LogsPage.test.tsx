/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { nockGetTextPlain, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForNocks } from '../../../../lib/test-util'
import LogsPage, { LogsToolbar } from './LogsPage'

// TODO why does the react-log-viewer not work with testing-library render...
jest.mock('@patternfly/react-log-viewer', () => ({
    __esModule: true,
    LogViewer: () => {
        return (
            <div>
                <div>
                    <p>{'Cluster:'}</p>
                    {'testCluster'}
                </div>
                <div>
                    <p>{'Namespace:'}</p>
                    {'testNamespace'}
                </div>
                <div>{'testLogs'}</div>
            </div>
        )
    },
    LogViewerSearch: () => {
        return <div>{'Search'}</div>
    },
}))

jest.mock('screenfull', () => ({
    isEnabled: true,
    on: () => {},
    off: () => {},
}))

URL.createObjectURL = jest.fn(() => '/test/url')

beforeEach(() => {
    sessionStorage.clear()
})

describe('LogsPage', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    it('should correctly render resource error if pod is no longer found', async () => {
        const managedClusterLogs = nockGetTextPlain(
            'testLogs',
            200,
            true,
            '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
        )

        render(
            <RecoilRoot>
                <LogsPage
                    resourceError={'Invalid request'}
                    containers={['testContainer', 'testContainer1']}
                    cluster={'testCluster'}
                    namespace={'testNamespace'}
                    name={'testName'}
                />
            </RecoilRoot>
        )

        await waitForNocks([managedClusterLogs])
        await waitFor(() => expect(screen.getByText('Invalid request')).toBeInTheDocument())
    })

    it('should correctly render log request error', async () => {
        const managedClusterLogs = nockGetTextPlain(
            'testLogs',
            500,
            true,
            '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
        )

        render(
            <RecoilRoot>
                <LogsPage
                    resourceError={''}
                    containers={['testContainer', 'testContainer1']}
                    cluster={'testCluster'}
                    namespace={'testNamespace'}
                    name={'testName'}
                />
            </RecoilRoot>
        )

        await waitForNocks([managedClusterLogs])
        await waitFor(() => expect(screen.getByText('Internal Server Error')).toBeInTheDocument())
    })

    it('should render logs page with data and successfully switch containers', async () => {
        const managedClusterLogs = nockGetTextPlain(
            'testLogs',
            200,
            true,
            '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
        )

        render(
            <RecoilRoot>
                <LogsPage
                    resourceError={''}
                    containers={['testContainer', 'testContainer1']}
                    cluster={'testCluster'}
                    namespace={'testNamespace'}
                    name={'testName'}
                />
            </RecoilRoot>
        )

        await waitForNocks([managedClusterLogs])

        // Wait for request to finish and check logs are displayed correctly
        await waitFor(() => expect(managedClusterLogs.isDone()).toBeTruthy())
        await waitFor(() => expect(screen.getByText('testCluster')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('testNamespace')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('testLogs')).toBeInTheDocument())
    })

    it('should render logs toolbar', async () => {
        render(
            <RecoilRoot>
                <LogsToolbar
                    logs={'testLogs'}
                    name={'testPod'}
                    container={'testContainer'}
                    cluster={'local-cluster'}
                    containers={['testContainer', 'testContainer1', 'testContainer2']}
                    setContainer={() => {}}
                    toggleWrapLines={() => {}}
                    wrapLines={false}
                    toggleFullscreen={() => {}}
                    isFullscreen={false}
                />
            </RecoilRoot>
        )

        await waitFor(() => expect(screen.getByText('testContainer')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('Expand')).toBeInTheDocument())
    })
})
