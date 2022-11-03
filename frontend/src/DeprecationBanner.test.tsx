/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { noop } from 'lodash'
import { MemoryRouter } from 'react-router-dom'
import { DeprecationBanner } from './DeprecationBanner'
import { nockGet } from './lib/nock-util'
import { clickByText, waitForNock, waitForText } from './lib/test-util'
import { AcmAlertContext } from './ui-components'

const mockConfigMap = {
    apiVersion: 'v1',
    data: {
        consoleURL: 'https://example.com',
    },
    kind: 'ConfigMap',
    metadata: {
        name: 'console-public',
        namespace: 'openshift-config-managed',
    },
}

describe('DeprecationBaner', () => {
    it('renders with correct linking behavior', async () => {
        Object.defineProperty(window, 'location', {
            value: {
                href: 'initialURL',
            },
            writable: true,
        })
        const consolePublicNock = nockGet(mockConfigMap)
        render(
            <MemoryRouter initialEntries={['/standalone/route']} initialIndex={0}>
                <DeprecationBanner />
            </MemoryRouter>
        )
        await waitForText(/This web console is deprecated/)
        await clickByText('Openshift console plug-in')
        await waitForNock(consolePublicNock)
        await waitFor(() => expect(location.href).toBe('https://example.com//standalone/route?perspective=acm'))
    })
    it('handles errors', async () => {
        const consolePublicNock = nockGet(mockConfigMap, undefined, 500)
        const addAlert = jest.fn()
        render(
            <MemoryRouter initialEntries={['/standalone/route']} initialIndex={0}>
                <AcmAlertContext.Provider
                    value={{
                        activeAlerts: [],
                        alertInfos: [],
                        addAlert,
                        removeAlert: noop,
                        removeVisibleAlert: noop,
                        clearAlerts: noop,
                    }}
                >
                    <DeprecationBanner />
                </AcmAlertContext.Provider>
            </MemoryRouter>
        )
        await waitForText(/This web console is deprecated/)
        await clickByText('Openshift console plug-in')
        await waitForNock(consolePublicNock)

        await waitFor(() => expect(addAlert).toHaveBeenCalled())
    })
})
