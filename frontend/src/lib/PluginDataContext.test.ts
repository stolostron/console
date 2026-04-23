/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, act } from '@testing-library/react-hooks'
import { defaultContext, usePluginDataContextValue } from './PluginDataContext'

describe('defaultContext', () => {
  it('has mounted false by default', () => {
    expect(defaultContext.mounted).toBe(false)
  })

  it('has isStreamIdle false by default', () => {
    expect(defaultContext.isStreamIdle).toBe(false)
  })

  it('has isReconnecting false by default', () => {
    expect(defaultContext.isReconnecting).toBe(false)
  })

  it('has noop mount and unmount functions', () => {
    expect(() => defaultContext.mount()).not.toThrow()
    expect(() => defaultContext.unmount()).not.toThrow()
  })

  it('has noop load function', () => {
    expect(() => defaultContext.load()).not.toThrow()
  })
})

describe('usePluginDataContextValue', () => {
  it('starts with mounted false', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    expect(result.current.mounted).toBe(false)
  })

  it('sets mounted to true after mount()', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    act(() => {
      result.current.mount()
    })
    expect(result.current.mounted).toBe(true)
  })

  it('sets mounted back to false after unmount()', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    act(() => {
      result.current.mount()
    })
    expect(result.current.mounted).toBe(true)

    act(() => {
      result.current.unmount()
    })
    expect(result.current.mounted).toBe(false)
  })

  it('handles multiple mounts and unmounts correctly', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    act(() => {
      result.current.mount()
      result.current.mount()
    })
    expect(result.current.mounted).toBe(true)

    act(() => {
      result.current.unmount()
    })
    expect(result.current.mounted).toBe(true)

    act(() => {
      result.current.unmount()
    })
    expect(result.current.mounted).toBe(false)
  })

  it('clamps mountCount at zero on extra unmount calls', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    act(() => {
      result.current.unmount()
    })
    expect(result.current.mounted).toBe(false)

    act(() => {
      result.current.mount()
    })
    expect(result.current.mounted).toBe(true)
  })

  it('starts with isStreamIdle false', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    expect(result.current.isStreamIdle).toBe(false)
  })

  it('starts with isReconnecting false', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    expect(result.current.isReconnecting).toBe(false)
  })

  it('sets startLoading via load()', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    expect(result.current.startLoading).toBe(false)

    act(() => {
      result.current.load()
    })
    expect(result.current.startLoading).toBe(true)
  })

  it('provides stable mount and unmount references', () => {
    const { result, rerender } = renderHook(() => usePluginDataContextValue())
    const mount1 = result.current.mount
    const unmount1 = result.current.unmount
    rerender()
    expect(result.current.mount).toBe(mount1)
    expect(result.current.unmount).toBe(unmount1)
  })

  it('updates isStreamIdle via setIsStreamIdle', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    act(() => {
      result.current.setIsStreamIdle(true)
    })
    expect(result.current.isStreamIdle).toBe(true)
  })

  it('updates isReconnecting via setIsReconnecting', () => {
    const { result } = renderHook(() => usePluginDataContextValue())
    act(() => {
      result.current.setIsReconnecting(true)
    })
    expect(result.current.isReconnecting).toBe(true)
  })
})
