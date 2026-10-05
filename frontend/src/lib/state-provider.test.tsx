/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createContext, useContext } from 'react'
import { useSharedValue, useSharedAtoms } from '../shared-atoms'
import { defaultContext, PluginDataContext } from './PluginDataContext'
import type { PluginData } from './PluginDataContext'
import { defaultPlugin, PluginContext } from './PluginContext'
import { StateProvider } from './state-provider'

function StateProviderConsumer() {
  const plugin = useContext(PluginContext)
  const pluginData = useContext(plugin.dataContext)
  const { settingsState } = useSharedAtoms()
  const settings = useSharedValue(settingsState)

  return (
    <div>
      <p>{String(plugin.isSearchAvailable)}</p>
      <p>{pluginData.backendUrl}</p>
      <p>{settings.SAVED_SEARCH_LIMIT}</p>
    </div>
  )
}

describe('StateProvider', () => {
  it('inherits plugin contexts and initializes Jotai state', async () => {
    const pluginDataContext = createContext<PluginData>(defaultContext)
    const parentData = { ...defaultContext, backendUrl: 'https://backend.example.com' }
    const pluginContext = { ...defaultPlugin, isSearchAvailable: false, dataContext: pluginDataContext }
    expect(defaultPlugin.dataContext).toBe(PluginDataContext)

    const { container } = render(
      <PluginContext.Provider value={pluginContext}>
        <pluginDataContext.Provider value={parentData}>
          <StateProvider
            initializeStore={(store) => store.set(defaultContext.atoms.settingsState, { SAVED_SEARCH_LIMIT: '7' })}
          >
            <StateProvider
              initializeStore={(store) => store.set(defaultContext.atoms.settingsState, { SAVED_SEARCH_LIMIT: '7' })}
            >
              <StateProviderConsumer />
            </StateProvider>
          </StateProvider>
        </pluginDataContext.Provider>
      </PluginContext.Provider>
    )

    expect(screen.getByText('false')).toBeInTheDocument()
    expect(screen.getByText('https://backend.example.com')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
