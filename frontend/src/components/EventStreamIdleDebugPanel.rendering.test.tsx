/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import React, { createElement, ReactElement } from 'react'
import { MutableSnapshot, RecoilRoot } from 'recoil'
import { settingsState } from '../atoms'
import { PluginDataContext, defaultContext } from '../lib/PluginDataContext'
import { EventStreamIdleDebugPanel } from './EventStreamIdleDebugPanel'

// Set env to enable the debug panel
const originalEnv = process.env.DEBUG_EVENT_STREAM_IDLE
beforeAll(() => {
  process.env.DEBUG_EVENT_STREAM_IDLE = 'true'
})
afterAll(() => {
  process.env.DEBUG_EVENT_STREAM_IDLE = originalEnv
})

jest.mock('../lib/usePageActivity', () => ({
  usePageActivity: () => ({ isActive: true, deadline: null, pageInUse: true }),
}))

function wrapper({ children }: { children: ReactElement }) {
  return createElement(
    PluginDataContext.Provider,
    { value: { ...defaultContext, loadCompleted: true, loadStarted: true } },
    createElement(
      RecoilRoot,
      {
        initializeState: (snapshot: MutableSnapshot) => {
          snapshot.set(settingsState, { EVENT_STREAM_IDLE_TIMEOUT: '1', EVENT_STREAM_IDLE_GRACE_PERIOD: '0.5' })
        },
      } as React.ComponentProps<typeof RecoilRoot>,
      children
    )
  )
}

describe('EventStreamIdleDebugPanel rendering', () => {
  it('renders expected ACTIVE state text', () => {
    const { container } = render(createElement(EventStreamIdleDebugPanel), { wrapper })
    expect(container.textContent).toContain('state: ACTIVE')
  })

  it('displays timeout and grace period values', () => {
    const { container } = render(createElement(EventStreamIdleDebugPanel), { wrapper })
    expect(container.textContent).toContain('idleTimeout:')
    expect(container.textContent).toContain('gracePeriod:')
  })

  it('displays all state fields', () => {
    const { container } = render(createElement(EventStreamIdleDebugPanel), { wrapper })
    const text = container.textContent ?? ''
    expect(text).toContain('isActive:')
    expect(text).toContain('doc.hidden:')
    expect(text).toContain('doc.hasFocus:')
    expect(text).toContain('mounted:')
    expect(text).toContain('isStreamIdle:')
    expect(text).toContain('isReconnecting:')
    expect(text).toContain('loadStarted:')
    expect(text).toContain('loadCompleted:')
  })

  it('shows IDLE (grace) state when stream is idle', () => {
    const idleCtx = { ...defaultContext, isStreamIdle: true, loadCompleted: true, loadStarted: true }
    const idleWrapper = ({ children }: { children: ReactElement }) =>
      createElement(
        PluginDataContext.Provider,
        { value: idleCtx },
        createElement(
          RecoilRoot,
          {
            initializeState: (snapshot: MutableSnapshot) => {
              snapshot.set(settingsState, { EVENT_STREAM_IDLE_TIMEOUT: '1', EVENT_STREAM_IDLE_GRACE_PERIOD: '0.5' })
            },
          } as React.ComponentProps<typeof RecoilRoot>,
          children
        )
      )

    const { container } = render(createElement(EventStreamIdleDebugPanel), { wrapper: idleWrapper })
    expect(container.textContent).toContain('IDLE (grace)')
  })

  it('shows RECONNECTING state when reconnecting', () => {
    const reconnCtx = { ...defaultContext, isReconnecting: true, loadCompleted: true, loadStarted: true }
    const reconnWrapper = ({ children }: { children: ReactElement }) =>
      createElement(
        PluginDataContext.Provider,
        { value: reconnCtx },
        createElement(
          RecoilRoot,
          {
            initializeState: (snapshot: MutableSnapshot) => {
              snapshot.set(settingsState, { EVENT_STREAM_IDLE_TIMEOUT: '1', EVENT_STREAM_IDLE_GRACE_PERIOD: '0.5' })
            },
          } as React.ComponentProps<typeof RecoilRoot>,
          children
        )
      )

    const { container } = render(createElement(EventStreamIdleDebugPanel), { wrapper: reconnWrapper })
    expect(container.textContent).toContain('RECONNECTING')
  })

  it('displays progress bars', () => {
    const { container } = render(createElement(EventStreamIdleDebugPanel), { wrapper })
    const text = container.textContent ?? ''
    expect(text).toContain('idle')
    expect(text).toContain('grace')
    expect(text).toContain('%')
  })
})
