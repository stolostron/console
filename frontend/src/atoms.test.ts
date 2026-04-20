/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import React, { ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { MutableSnapshot, RecoilRoot } from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { settingsState, useEventStreamIdleTimeout, useEventStreamIdleGracePeriod } from './atoms'

function wrapper(settings: Record<string, string> = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      RecoilRoot,
      {
        initializeState: (snapshot: MutableSnapshot) => {
          snapshot.set(settingsState, settings)
        },
      } as React.ComponentProps<typeof RecoilRoot>,
      children
    )
  }
}

describe('useEventStreamIdleTimeout', () => {
  it('returns default (30 minutes in ms) when no setting is configured', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), { wrapper: wrapper() })
    expect(result.current).toBe(30 * 60 * 1000)
  })

  it('returns default when setting is empty string', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_TIMEOUT: '' }),
    })
    expect(result.current).toBe(30 * 60 * 1000)
  })

  it('parses a valid timeout in minutes', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_TIMEOUT: '5' }),
    })
    expect(result.current).toBe(5 * 60 * 1000)
  })

  it('parses fractional minutes', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_TIMEOUT: '0.5' }),
    })
    expect(result.current).toBe(0.5 * 60 * 1000)
  })

  it('returns 0 when set to 0 (disabled)', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_TIMEOUT: '0' }),
    })
    expect(result.current).toBe(0)
  })

  it('returns 0 when set to a negative value (disabled)', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_TIMEOUT: '-5' }),
    })
    expect(result.current).toBe(0)
  })

  it('returns default when set to non-numeric string', () => {
    const { result } = renderHook(() => useEventStreamIdleTimeout(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_TIMEOUT: 'abc' }),
    })
    expect(result.current).toBe(30 * 60 * 1000)
  })
})

describe('useEventStreamIdleGracePeriod', () => {
  it('returns default (2 minutes in ms) when no setting is configured', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), { wrapper: wrapper() })
    expect(result.current).toBe(2 * 60 * 1000)
  })

  it('returns default when setting is empty string', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_GRACE_PERIOD: '' }),
    })
    expect(result.current).toBe(2 * 60 * 1000)
  })

  it('parses a valid grace period in minutes', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_GRACE_PERIOD: '3' }),
    })
    expect(result.current).toBe(3 * 60 * 1000)
  })

  it('parses fractional minutes', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_GRACE_PERIOD: '0.25' }),
    })
    expect(result.current).toBe(0.25 * 60 * 1000)
  })

  it('returns 0 when set to 0 (no grace period)', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_GRACE_PERIOD: '0' }),
    })
    expect(result.current).toBe(0)
  })

  it('returns 0 when set to a negative value', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_GRACE_PERIOD: '-1' }),
    })
    expect(result.current).toBe(0)
  })

  it('returns default when set to non-numeric string', () => {
    const { result } = renderHook(() => useEventStreamIdleGracePeriod(), {
      wrapper: wrapper({ EVENT_STREAM_IDLE_GRACE_PERIOD: 'xyz' }),
    })
    expect(result.current).toBe(2 * 60 * 1000)
  })
})
