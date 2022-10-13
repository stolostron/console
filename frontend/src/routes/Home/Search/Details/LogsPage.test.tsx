/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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

    it('should correctly render log request error for Non-OCP clusters', async () => {
        const managedClusterLogs = nockGetTextPlain(
            'testLogs',
            400,
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
        await waitFor(() => expect(screen.getByText('Danger alert:')).toBeInTheDocument())
    })

    it('should render logs page with local-cluster logs successfully', async () => {
        const localClusterLogs = nockGetTextPlain(
            'testLogs',
            200,
            true,
            '/api/v1/namespaces/testNamespace/pods/testName/log?container=testContainer&tailLines=1000'
        )

        render(
            <RecoilRoot>
                <LogsPage
                    resourceError={''}
                    containers={['testContainer', 'testContainer1']}
                    cluster={'local-cluster'}
                    namespace={'testNamespace'}
                    name={'testName'}
                />
            </RecoilRoot>
        )

        await waitForNocks([localClusterLogs])

        // Wait for request to finish and check logs are displayed correctly
        await waitFor(() => expect(localClusterLogs.isDone()).toBeTruthy())
        await waitFor(() => expect(screen.getByText('testNamespace')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('testLogs')).toBeInTheDocument())
    })

    it('should render logs page with managed cluster logs successfully', async () => {
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

    it('should render logs toolbar & click wrap lines and raw buttons', async () => {
        window.open = jest.fn()
        document.write = jest.fn()
        const Toolbar = () => {
            const [wrapLines, setWrapLines] = useState<boolean>(false)
            const [container, setContainer] = useState<string>('testContainer')
            return (
                <RecoilRoot>
                    <LogsToolbar
                        logs={'testLogs'}
                        name={'testPod'}
                        container={container}
                        cluster={'local-cluster'}
                        containers={['testContainer', 'testContainer1', 'testContainer2']}
                        setContainer={setContainer}
                        toggleWrapLines={setWrapLines}
                        wrapLines={wrapLines}
                        toggleFullscreen={() => {}}
                        isFullscreen={false}
                    />
                </RecoilRoot>
            )
        }
        render(<Toolbar />)

        await waitFor(() => expect(screen.getByText('testContainer')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('Expand')).toBeInTheDocument())

        // Should toggle wrap lines
        const wrapLinesBtn = screen.getByText(/wrap lines/i)
        await waitFor(() => expect(wrapLinesBtn).toBeInTheDocument())
        userEvent.click(wrapLinesBtn)

        const rawBtn = screen.getByRole('button', {
            name: /raw/i,
        })
        await waitFor(() => expect(rawBtn).toBeInTheDocument())
        userEvent.click(rawBtn)
        expect(window.open).toHaveBeenCalledWith('about:blank')
    })

    it('should render logs toolbar in fullescreen mode', async () => {
        window.open = jest.fn()
        document.write = jest.fn()
        const Toolbar = () => {
            const [wrapLines, setWrapLines] = useState<boolean>(false)
            return (
                <RecoilRoot>
                    <LogsToolbar
                        logs={'testLogs'}
                        name={'testPod'}
                        container={'testContainer'}
                        cluster={'local-cluster'}
                        containers={['testContainer', 'testContainer1', 'testContainer2']}
                        setContainer={() => {}}
                        toggleWrapLines={setWrapLines}
                        wrapLines={wrapLines}
                        toggleFullscreen={() => {}}
                        isFullscreen={true}
                    />
                </RecoilRoot>
            )
        }
        render(<Toolbar />)

        await waitFor(() => expect(screen.getByText('testContainer')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByText('Collapse')).toBeInTheDocument())
    })
})
