/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useEffect, useRef, useState } from 'react'

/** Default idle timeout in minutes when EVENT_STREAM_IDLE_TIMEOUT is not configured. */
export const DEFAULT_EVENT_STREAM_IDLE_TIMEOUT_MINUTES = 15

/** Default inactivity timeout before the page is considered idle. */
export const DEFAULT_INACTIVITY_TIMEOUT_MS = DEFAULT_EVENT_STREAM_IDLE_TIMEOUT_MINUTES * 60 * 1000

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
export function usePageActivity(
  timeoutMs: number = DEFAULT_INACTIVITY_TIMEOUT_MS,
  pageActiveRef?: { current: number }
): boolean {
  const [isActive, setIsActive] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const isActiveRef = useRef(true)

  const resetTimer = useCallback(() => {
    if (pageActiveRef && pageActiveRef.current <= 0) return

    if (timerRef.current) clearTimeout(timerRef.current)

    if (!isActiveRef.current) {
      isActiveRef.current = true
      setIsActive(true)
    }

    if (process.env.NODE_ENV === 'test') return

    timerRef.current = setTimeout(function onTimeout() {
      if (!document.hidden && document.hasFocus() && (!pageActiveRef || pageActiveRef.current > 0)) {
        timerRef.current = setTimeout(onTimeout, timeoutMs)
        return
      }
      isActiveRef.current = false
      setIsActive(false)
    }, timeoutMs)
  }, [timeoutMs, pageActiveRef])

  useEffect(() => {
    resetTimer()

    for (const event of ACTIVITY_EVENTS) {
      globalThis.addEventListener(event, resetTimer, { passive: true })
    }

    const onVisibilityChange = () => {
      if (!document.hidden) resetTimer()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    globalThis.addEventListener('focus', resetTimer)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const event of ACTIVITY_EVENTS) {
        globalThis.removeEventListener(event, resetTimer)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      globalThis.removeEventListener('focus', resetTimer)
    }
  }, [resetTimer])

  return isActive
}
