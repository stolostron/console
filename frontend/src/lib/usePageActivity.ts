/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'] as const

/**
 * Tracks user activity and page visibility to determine whether the page is
 * idle. Returns false after the configured timeout elapses under idle
 * conditions, signaling that the event stream should be paused.
 *
 * The page is considered active (timer resets) when any of these hold:
 * - The document is visible, the window is focused, and a relevant page is
 *   mounted (the user may simply be reading without generating events).
 * - The user generates interaction events (mouse, keyboard, scroll, touch)
 *   while a relevant page is mounted.
 *
 * The timer counts down when:
 * - The document is hidden (tab switched, browser minimized).
 * - The window has lost focus (user Alt-Tabbed to another application).
 * - No relevant page is mounted (`pageActiveRef.current <= 0`), e.g. the
 *   user navigated to an unrelated page in the same app.
 *
 * @param timeoutMs  Milliseconds of inactivity before going idle.
 * @param pageActiveRef  Optional ref whose `.current` must be > 0 for
 *   the page to be considered "relevant". When 0, user interactions are
 *   ignored and document visibility alone cannot prevent idle.
 */
export interface PageActivityDebug {
  /** Timestamp (ms) when the current idle timer will fire. null if no timer is running. */
  deadline: number | null
  /** True when the page is visible+focused+mounted; the timer will reschedule rather than trigger idle. */
  suspended: boolean
}

export function usePageActivity(
  timeoutMs: number = 0, // Disabled unless specified
  pageActiveRef?: { current: number },
  debugRef?: { current: PageActivityDebug }
): boolean {
  const disabled = timeoutMs <= 0
  const [isActive, setIsActive] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const isActiveRef = useRef(true)

  const resetTimer = useCallback(() => {
    if (disabled) return

    if (pageActiveRef && pageActiveRef.current <= 0) return

    if (timerRef.current) clearTimeout(timerRef.current)

    if (!isActiveRef.current) {
      isActiveRef.current = true
      setIsActive(true)
    }

    if (process.env.NODE_ENV === 'test') return

    const deadline = Date.now() + timeoutMs
    const suspended = !document.hidden && document.hasFocus() && (!pageActiveRef || pageActiveRef.current > 0)
    if (debugRef) debugRef.current = { deadline, suspended }

    timerRef.current = setTimeout(function onTimeout() {
      if (!document.hidden && document.hasFocus() && (!pageActiveRef || pageActiveRef.current > 0)) {
        const nextDeadline = Date.now() + timeoutMs
        if (debugRef) debugRef.current = { deadline: nextDeadline, suspended: true }
        timerRef.current = setTimeout(onTimeout, timeoutMs)
        return
      }
      if (debugRef) debugRef.current = { deadline: null, suspended: false }
      isActiveRef.current = false
      setIsActive(false)
    }, timeoutMs)
  }, [disabled, timeoutMs, pageActiveRef, debugRef])

  const unsuspend = useCallback(() => {
    if (debugRef) debugRef.current = { ...debugRef.current, suspended: false }
  }, [debugRef])

  useEffect(() => {
    if (disabled) return

    resetTimer()

    for (const event of ACTIVITY_EVENTS) {
      globalThis.addEventListener(event, resetTimer, { passive: true })
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        unsuspend()
      } else {
        resetTimer()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    globalThis.addEventListener('focus', resetTimer)
    globalThis.addEventListener('blur', unsuspend)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of ACTIVITY_EVENTS) {
        globalThis.removeEventListener(event, resetTimer)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      globalThis.removeEventListener('focus', resetTimer)
      globalThis.removeEventListener('blur', unsuspend)
    }
  }, [disabled, resetTimer, unsuspend])

  return isActive
}
