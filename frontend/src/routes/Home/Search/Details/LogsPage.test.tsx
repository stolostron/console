/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render, screen, waitFor } from '@testing-library/react'
import { nockGetTextPlain, nockIgnoreRBAC } from '../../../../lib/nock-util'
import LogsPage from './LogsPage'

beforeEach(() => {
    sessionStorage.clear()
})

describe('LogsPage', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })
    const Component = () => (
        <LogsPage
            resourceError={''} // only used in logs page to catch & display errors
            containers={['testContainer', 'testContainer1']}
            cluster={'testCluster'}
            namespace={'testNamespace'}
            name={'testName'}
        />
    )

    it('should render logs page with data and successfully switch containers', async () => {
        const logs = nockGetTextPlain(
            'testLogs',
            200,
            true,
            '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
        )

        render(<Component />)

        // Wait for request to finish and check logs are displayed correctly
        await waitFor(() => expect(logs.isDone()).toBeTruthy())
        await waitFor(() => expect(screen.getByText('testLogs')).toBeInTheDocument())
    })
})
