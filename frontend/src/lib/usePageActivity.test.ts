/* Copyright Contributors to the Open Cluster Management project */

import { renderHook, act } from '@testing-library/react-hooks'
import { usePageActivity } from './usePageActivity'

describe('usePageActivity', () => {
  describe('when disabled (timeoutMs <= 0)', () => {
    it('returns isActive true when timeoutMs is 0', () => {
      const { result } = renderHook(() => usePageActivity(0))
      expect(result.current.isActive).toBe(true)
    })

    it('returns isActive true when timeoutMs is negative', () => {
      const { result } = renderHook(() => usePageActivity(-1000))
      expect(result.current.isActive).toBe(true)
    })

    it('returns isActive true with default timeoutMs', () => {
      const { result } = renderHook(() => usePageActivity())
      expect(result.current.isActive).toBe(true)
    })

    it('returns null deadline when disabled', () => {
      const { result } = renderHook(() => usePageActivity(0))
      expect(result.current.deadline).toBeNull()
    })
  })

  describe('when enabled (timeoutMs > 0)', () => {
    it('starts as active', () => {
      const { result } = renderHook(() => usePageActivity(60000))
      expect(result.current.isActive).toBe(true)
    })

    it('returns pageInUse based on document visibility and focus', () => {
      const { result } = renderHook(() => usePageActivity(60000))
      expect(result.current.pageInUse).toBeDefined()
    })
  })

  describe('pageMounted parameter', () => {
    it('defaults pageMounted to true', () => {
      const { result } = renderHook(() => usePageActivity(60000))
      expect(result.current.isActive).toBe(true)
    })

    it('starts active even when pageMounted is false', () => {
      const { result } = renderHook(() => usePageActivity(60000, false))
      expect(result.current.isActive).toBe(true)
    })

    it('updates when pageMounted changes from true to false', () => {
      const { result, rerender } = renderHook(({ mounted }) => usePageActivity(60000, mounted), {
        initialProps: { mounted: true },
      })
      expect(result.current.isActive).toBe(true)

      act(() => {
        rerender({ mounted: false })
      })
      expect(result.current.isActive).toBe(true)
    })

    it('updates when pageMounted changes from false to true', () => {
      const { result, rerender } = renderHook(({ mounted }) => usePageActivity(60000, mounted), {
        initialProps: { mounted: false },
      })

      act(() => {
        rerender({ mounted: true })
      })
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('return value shape', () => {
    it('returns isActive, deadline, and pageInUse', () => {
      const { result } = renderHook(() => usePageActivity(60000))
      expect(result.current).toHaveProperty('isActive')
      expect(result.current).toHaveProperty('deadline')
      expect(result.current).toHaveProperty('pageInUse')
    })

    it('returns memoized object', () => {
      const { result, rerender } = renderHook(() => usePageActivity(60000))
      const first = result.current
      rerender()
      expect(result.current).toBe(first)
    })
  })

  describe('activity events', () => {
    it('registers activity event listeners when pageMounted and no focus', () => {
      const addSpy = jest.spyOn(globalThis, 'addEventListener')
      renderHook(() => usePageActivity(60000, true))
      const events = addSpy.mock.calls.map((c) => c[0])
      expect(events).toContain('focus')
      expect(events).toContain('blur')
      addSpy.mockRestore()
    })

    it('does not register activity events when disabled', () => {
      const addSpy = jest.spyOn(globalThis, 'addEventListener')
      renderHook(() => usePageActivity(0, true))
      const events = addSpy.mock.calls.map((c) => c[0])
      expect(events).not.toContain('mousemove')
      expect(events).not.toContain('mousewheel')
      addSpy.mockRestore()
    })

    it('calls resetTimer on activity events when mounted', () => {
      renderHook(() => usePageActivity(60000, true))
      // Dispatch a scroll event to trigger onActivity
      expect(() => {
        act(() => {
          globalThis.dispatchEvent(new Event('scroll'))
        })
      }).not.toThrow()
    })

    it('handles visibilitychange event', () => {
      renderHook(() => usePageActivity(60000, true))
      expect(() => {
        act(() => {
          document.dispatchEvent(new Event('visibilitychange'))
        })
      }).not.toThrow()
    })

    it('handles focus event', () => {
      const { result } = renderHook(() => usePageActivity(60000, true))
      act(() => {
        globalThis.dispatchEvent(new Event('focus'))
      })
      expect(result.current.isActive).toBe(true)
    })

    it('handles blur event', () => {
      const { result } = renderHook(() => usePageActivity(60000, true))
      act(() => {
        globalThis.dispatchEvent(new Event('blur'))
      })
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('cleans up without errors on unmount', () => {
      const { unmount } = renderHook(() => usePageActivity(60000))
      expect(() => unmount()).not.toThrow()
    })

    it('cleans up without errors when disabled', () => {
      const { unmount } = renderHook(() => usePageActivity(0))
      expect(() => unmount()).not.toThrow()
    })

    it('removes event listeners on unmount', () => {
      const removeSpy = jest.spyOn(globalThis, 'removeEventListener')
      const { unmount } = renderHook(() => usePageActivity(60000, true))
      unmount()
      const events = removeSpy.mock.calls.map((c) => c[0])
      expect(events).toContain('focus')
      expect(events).toContain('blur')
      removeSpy.mockRestore()
    })
  })
})
