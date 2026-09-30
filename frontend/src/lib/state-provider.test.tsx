/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useContext } from 'react'
import { useRecoilValue, useSharedAtoms } from '../shared-recoil'
import { defaultContext, PluginDataContext } from './PluginDataContext'
import { defaultPlugin, PluginContext } from './PluginContext'
import { StateProvider } from './state-provider'

function StateProviderConsumer() {
  const plugin = useContext(PluginContext)
  const pluginData = useContext(PluginDataContext)
  const { settingsState } = useSharedAtoms()
  const settings = useRecoilValue(settingsState)

  return (
    <div>
      <p>{String(plugin.isSearchAvailable)}</p>
      <p>{pluginData.backendUrl}</p>
      <p>{settings.SAVED_SEARCH_LIMIT}</p>
    </div>
  )
}

describe('StateProvider', () => {
  it('inherits plugin contexts and initializes Recoil state', async () => {
    const pluginContext = { ...defaultPlugin, isSearchAvailable: false }
    const pluginDataContext = { ...defaultContext, backendUrl: 'https://backend.example.com' }
    expect(defaultPlugin.dataContext).toBe(PluginDataContext)

    const { container } = render(
      <PluginContext.Provider value={pluginContext}>
        <PluginDataContext.Provider value={pluginDataContext}>
          <StateProvider
            initializeStore={(store) => store.set(defaultContext.atoms.settingsState, { SAVED_SEARCH_LIMIT: '7' })}
          >
            <StateProviderConsumer />
          </StateProvider>
        </PluginDataContext.Provider>
      </PluginContext.Provider>
    )

    expect(screen.getByText('false')).toBeInTheDocument()
    expect(screen.getByText('https://backend.example.com')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
