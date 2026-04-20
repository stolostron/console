/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { defaultContext, PluginData, PluginDataContext } from '../lib/PluginDataContext'
import { PluginContext, defaultPlugin } from '../lib/PluginContext'
import { LoadPluginData } from './LoadPluginData'

jest.mock('../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

function renderWithContext(contextOverrides: Partial<PluginData>, children = 'Page Content') {
  const ctx: PluginData = { ...defaultContext, ...contextOverrides }
  return render(
    <MemoryRouter>
      <PluginContext.Provider value={{ ...defaultPlugin, dataContext: PluginDataContext }}>
        <PluginDataContext.Provider value={ctx}>
          <LoadPluginData>{children}</LoadPluginData>
        </PluginDataContext.Provider>
      </PluginContext.Provider>
    </MemoryRouter>
  )
}

describe('LoadPluginData', () => {
  it('shows loading page when loadCompleted and loadStarted are false', () => {
    renderWithContext({ loadCompleted: false, loadStarted: false })
    expect(screen.queryByText('Page Content')).not.toBeInTheDocument()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('shows children when loadCompleted is true', () => {
    renderWithContext({ loadCompleted: true })
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('shows idle overlay when isStreamIdle is true and loaded', () => {
    const { container } = renderWithContext({ loadCompleted: true, isStreamIdle: true })
    expect(container.querySelector('[data-testid="idle-overlay"]')).toBeInTheDocument()
  })

  it('does not show idle overlay when isStreamIdle is false', () => {
    const { container } = renderWithContext({ loadCompleted: true, isStreamIdle: false })
    expect(container.querySelector('[data-testid="idle-overlay"]')).not.toBeInTheDocument()
  })

  it('shows reconnecting overlay when isReconnecting is true and loaded', () => {
    const { container } = renderWithContext({ loadCompleted: true, isReconnecting: true })
    expect(container.querySelector('[data-testid="reconnecting-overlay"]')).toBeInTheDocument()
  })

  it('does not show reconnecting overlay when isReconnecting is false', () => {
    const { container } = renderWithContext({ loadCompleted: true, isReconnecting: false })
    expect(container.querySelector('[data-testid="reconnecting-overlay"]')).not.toBeInTheDocument()
  })

  it('calls load() when loadStarted is false', () => {
    const load = jest.fn()
    renderWithContext({ loadCompleted: false, loadStarted: false, load })
    expect(load).toHaveBeenCalled()
  })

  it('does not call load() when loadStarted is true', () => {
    const load = jest.fn()
    renderWithContext({ loadCompleted: true, loadStarted: true, load })
    expect(load).not.toHaveBeenCalled()
  })

  it('calls mount on render and unmount on cleanup', () => {
    const mount = jest.fn()
    const unmount = jest.fn()
    const { unmount: unmountComponent } = renderWithContext({ loadCompleted: true, mount, unmount })
    expect(mount).toHaveBeenCalledTimes(1)
    expect(unmount).not.toHaveBeenCalled()

    unmountComponent()
    expect(unmount).toHaveBeenCalledTimes(1)
  })

  it('renders children alongside overlays without replacing them', () => {
    const { container } = renderWithContext({ loadCompleted: true, isStreamIdle: true })
    expect(screen.getByText('Page Content')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="idle-overlay"]')).toBeInTheDocument()
  })
})
