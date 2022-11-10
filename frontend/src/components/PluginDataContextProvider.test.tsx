/* Copyright Contributors to the Open Cluster Management project */

import { ProviderProps } from 'react'
import { render } from '@testing-library/react'
import { defaultContext, PluginData } from '../lib/PluginDataContext'
import { LoadPluginData } from './LoadPluginData'
import { PluginDataContextProvider } from './PluginDataContextProvider'
import { waitForText } from '../lib/test-util'

const TestPluginDataContextProvider = (props: ProviderProps<PluginData>) => {
    return (
        <PluginDataContextProvider {...props}>
            <LoadPluginData>Main Content</LoadPluginData>
        </PluginDataContextProvider>
    )
}

describe('PluginDataContextProvider', () => {
    it('does not render LoadData until requested', async () => {
        const pluginData: PluginData = {
            ...defaultContext,
            loaded: false,
            load: jest.fn(),
        }
        render(<TestPluginDataContextProvider value={pluginData} />)
        await waitForText('Loading')
        expect(pluginData.load).toHaveBeenCalled()
    })
    it('renders LoadData when requested', async () => {
        const pluginData: PluginData = {
            ...defaultContext,
            loaded: true,
            startLoading: true,
            load: jest.fn(),
        }
        render(<TestPluginDataContextProvider value={pluginData} />)
        await waitForText('Main Content')
        expect(pluginData.load).not.toHaveBeenCalled()
    })
})
