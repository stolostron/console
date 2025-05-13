/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { ProviderProps } from 'react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { nockRequest } from '../lib/nock-util'
import { defaultContext, PluginData } from '../lib/PluginDataContext'
import { waitForText } from '../lib/test-util'
import { LoadPluginData } from './LoadPluginData'
import { PluginDataContextProvider } from './PluginDataContextProvider'

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
      loadStarted: false,
      load: jest.fn(),
    }
    render(
      <MemoryRouter>
        <TestPluginDataContextProvider value={pluginData} />
      </MemoryRouter>
    )
    await new Promise((resolve) => setTimeout(resolve, 500))
    // await waitForText('Loading')
    expect(pluginData.load).toHaveBeenCalled()
  })
  it('renders LoadData when requested', async () => {
    const mockGlobalHubReq: any = { isGlobalHub: true }
    nockRequest('/hub', mockGlobalHubReq)
    const pluginData: PluginData = {
      ...defaultContext,
      startLoading: true,
      load: jest.fn(),
    }
    render(
      <MemoryRouter>
        <TestPluginDataContextProvider value={pluginData} />
      </MemoryRouter>
    )

    await waitForText('Main Content')
    expect(pluginData.load).not.toHaveBeenCalled()
  })
})
