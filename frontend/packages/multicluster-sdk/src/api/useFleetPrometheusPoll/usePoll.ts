/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useRef } from 'react'

// Slightly modified from Dan Abramov's blog post about using React hooks for polling
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const usePoll = (callback: any, delay: number, ...dependencies: any[]) => {
  const savedCallback = useRef<any>(null)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const tick = () => savedCallback.current()

    tick() // Run first tick immediately.

    if (delay) {
      // Only start interval if a delay is provided.
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...dependencies])
}
