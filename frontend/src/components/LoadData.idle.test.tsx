/* Copyright Contributors to the Open Cluster Management project */

import { act, render } from '@testing-library/react'
import React, { createElement, ReactElement } from 'react'
import { MutableSnapshot, RecoilRoot } from 'recoil'
import { settingsState } from '../atoms'
import { PluginDataContext, defaultContext, PluginData } from '../lib/PluginDataContext'
import { LoadData } from './LoadData'

let mockIsActive = true
jest.mock('../lib/usePageActivity', () => ({
  usePageActivity: () => ({ isActive: mockIsActive, deadline: null, pageInUse: true }),
}))

jest.mock('../lib/useQuery', () => ({
  useQuery: () => ({ data: undefined, loading: false, startPolling: jest.fn(), stopPolling: jest.fn() }),
}))

jest.mock('../resources/utils', () => ({
  getBackendUrl: () => '',
  getRequest: jest.fn().mockResolvedValue({ data: {} }),
}))

function createTestContext(overrides: Partial<PluginData> = {}): PluginData {
  return {
    ...defaultContext,
    loadStarted: true,
    loadCompleted: true,
    startLoading: true,
    ...overrides,
  }
}

function Wrapper({ ctx, children }: { ctx: PluginData; children: ReactElement }) {
  return createElement(
    PluginDataContext.Provider,
    { value: ctx },
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

function WrapperNoGrace({ ctx, children }: { ctx: PluginData; children: ReactElement }) {
  return createElement(
    PluginDataContext.Provider,
    { value: ctx },
    createElement(
      RecoilRoot,
      {
        initializeState: (snapshot: MutableSnapshot) => {
          snapshot.set(settingsState, { EVENT_STREAM_IDLE_TIMEOUT: '1', EVENT_STREAM_IDLE_GRACE_PERIOD: '0' })
        },
      } as React.ComponentProps<typeof RecoilRoot>,
      children
    )
  )
}

describe('LoadData idle/grace/reconnect', () => {
  beforeEach(() => {
    mockIsActive = true
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders children normally when active', () => {
    const ctx = createTestContext()
    const { getByText } = render(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )
    expect(getByText('content')).toBeInTheDocument()
  })

  it('calls setIsStreamIdle(true) when going inactive', () => {
    const setIsStreamIdle = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle })

    const { rerender } = render(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    mockIsActive = false
    rerender(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    expect(setIsStreamIdle).toHaveBeenCalledWith(true)
  })

  it('calls setIsStreamIdle(false) when returning to active during grace period', () => {
    const setIsStreamIdle = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle })

    const { rerender } = render(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    // Go inactive
    mockIsActive = false
    rerender(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )
    expect(setIsStreamIdle).toHaveBeenCalledWith(true)
    setIsStreamIdle.mockClear()

    // Return to active during grace (before timeout fires)
    mockIsActive = true
    rerender(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    expect(setIsStreamIdle).toHaveBeenCalledWith(false)
  })

  it('triggers reconnection when returning after stream was stopped', () => {
    const setIsStreamIdle = jest.fn()
    const setIsReconnecting = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle, setIsReconnecting })

    const { rerender } = render(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    // Go inactive
    mockIsActive = false
    rerender(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    // Advance past grace period to stop the stream
    act(() => {
      jest.advanceTimersByTime(30001)
    })

    // Return to active after stream was stopped
    mockIsActive = true
    rerender(
      <Wrapper ctx={ctx}>
        <LoadData>content</LoadData>
      </Wrapper>
    )

    expect(setIsReconnecting).toHaveBeenCalledWith(true)
    expect(setIsStreamIdle).toHaveBeenCalledWith(false)
  })

  it('stops stream immediately when grace period is 0', () => {
    const setIsStreamIdle = jest.fn()
    const setIsReconnecting = jest.fn()
    const ctx = createTestContext({ setIsStreamIdle, setIsReconnecting })

    const { rerender } = render(
      <WrapperNoGrace ctx={ctx}>
        <LoadData>content</LoadData>
      </WrapperNoGrace>
    )

    // Go inactive with grace period = 0
    mockIsActive = false
    rerender(
      <WrapperNoGrace ctx={ctx}>
        <LoadData>content</LoadData>
      </WrapperNoGrace>
    )

    expect(setIsStreamIdle).toHaveBeenCalledWith(true)

    // Return to active should trigger reconnection (stream already stopped)
    mockIsActive = true
    rerender(
      <WrapperNoGrace ctx={ctx}>
        <LoadData>content</LoadData>
      </WrapperNoGrace>
    )

    expect(setIsReconnecting).toHaveBeenCalledWith(true)
  })
})
