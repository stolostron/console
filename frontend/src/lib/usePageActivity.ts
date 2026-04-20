/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'mousewheel', 'scroll', 'touchmove', 'wheel'] as const

/**
 * Tracks user activity and page visibility to determine whether the page is
 * idle. Returns false after the configured timeout elapses under idle
 * conditions, signaling that the event stream should be paused.
 *
 * The page is considered active (timer resets) when any of these hold:
 * - The document is visible, the window is focused, and a relevant page is
 *   mounted (the user may simply be reading without generating events).
 * - The user generates interaction events (mouse, keyboard, scroll, touch)
 *   while a relevant page is mounted but not focused.
 *
 * The timer counts down when:
 * - The document is hidden (tab switched, browser minimized).
 * - The window has lost focus (user Alt-Tabbed to another application).
 * - No relevant page is mounted (`pageMounted` is false), e.g. the
 *   user navigated to an unrelated page in the same app.
 *
 * @param timeoutMs  Milliseconds of inactivity before going idle.
 * @param pageMounted  Whether a relevant page is currently mounted.
 *   When false, user interactions are ignored and document visibility
 *   alone cannot prevent idle.
 */
export function usePageActivity(timeoutMs: number = 0, pageMounted = true) {
  const disabled = timeoutMs <= 0
  const [isActive, setIsActive] = useState(true)
  const [deadline, setDeadline] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const isActiveRef = useRef(true)
  const pageMountedRef = useRef(pageMounted)

  const isPageInUse = useCallback(() => {
    return !document.hidden && document.hasFocus() && pageMountedRef.current
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (disabled) return

    if (!isActiveRef.current) {
      isActiveRef.current = true
      setIsActive(true)
    }

    if (process.env.NODE_ENV === 'test') return

    if (!isPageInUse()) {
      const deadline = Date.now() + timeoutMs
      setDeadline(deadline)

      timerRef.current = setTimeout(function onTimeout() {
        if (!isPageInUse()) {
          isActiveRef.current = false
          setIsActive(false)
        }
      }, timeoutMs)
    }
  }, [disabled, isPageInUse, timeoutMs])

  const [pageInUse, setPageInUse] = useState(isPageInUse())

  const onActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  const updatePageInUse = useCallback(() => {
    const newSuspended = isPageInUse()
    resetTimer()
    setPageInUse(newSuspended)
  }, [isPageInUse, resetTimer])

  useEffect(() => {
    if (pageMounted !== pageMountedRef.current) {
      pageMountedRef.current = pageMounted
      updatePageInUse()
    }
  }, [pageMounted, updatePageInUse])

  // Only listen for activity events if the page is mounted, but not focused
  const trackActivity = pageMounted && !document.hasFocus()

  useEffect(() => {
    if (disabled) return

    resetTimer()

    if (trackActivity) {
      for (const event of ACTIVITY_EVENTS) {
        globalThis.addEventListener(event, onActivity, { passive: true })
      }
    }

    document.addEventListener('visibilitychange', updatePageInUse)
    globalThis.addEventListener('focus', updatePageInUse)
    globalThis.addEventListener('blur', updatePageInUse)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (trackActivity) {
        for (const event of ACTIVITY_EVENTS) {
          globalThis.removeEventListener(event, onActivity)
        }
      }
      document.removeEventListener('visibilitychange', updatePageInUse)
      globalThis.removeEventListener('focus', updatePageInUse)
      globalThis.removeEventListener('blur', updatePageInUse)
    }
  }, [disabled, resetTimer, onActivity, updatePageInUse, trackActivity])

  return useMemo(() => ({ isActive, deadline, pageInUse }), [isActive, deadline, pageInUse])
}
