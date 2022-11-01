/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { waitForNotText, waitForText } from '../lib/test-util'
import { PluginContextProvider } from './PluginContextProvider'

const TestPluginContextProvider = () => {
    return <PluginContextProvider>Main Content</PluginContextProvider>
}

describe('PluginContextProvider', () => {
    it('does not render content without resolved context provider extension', async () => {
        render(<TestPluginContextProvider />)
        await waitForText('Loading')
        await waitForNotText('Main Content')
    })
})
