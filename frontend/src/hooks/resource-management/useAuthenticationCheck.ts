/* Copyright Contributors to the Open Cluster Management project */
import { useEffect } from 'react'
import { getBackendUrl } from '../../resources/utils'
import { tokenExpired } from '../../logout'

interface UseAuthenticationCheckOptions {
  enabled?: boolean
  checkInterval?: number
}

/**
 * Custom hook that periodically checks authentication status to ensure
 * the user's session is still valid. Redirects to login if expired.
 */
export function useAuthenticationCheck(options: UseAuthenticationCheckOptions = {}) {
  const {
    enabled = process.env.MODE !== 'plugin',
    checkInterval = 30 * 1000, // 30 seconds
  } = options

  useEffect(() => {
    if (!enabled) return

    const checkLoggedIn = () => {
      fetch(`${getBackendUrl()}/authenticated`, {
        credentials: 'include',
        headers: { accept: 'application/json' },
      })
        .then((res) => {
          switch (res.status) {
            case 200:
              // Authentication successful, continue
              break
            default:
              // Handle authentication failure
              /* istanbul ignore if */
              if (process.env.NODE_ENV === 'development' && res.status === 504) {
                // In development, a 504 might indicate backend restart
                window.location.reload()
              } else {
                // In production or other status codes, treat as auth failure
                tokenExpired()
              }
              break
          }
        })
        .catch(() => {
          // Network error or other failure, treat as auth failure
          tokenExpired()
        })
        .finally(() => {
          // Schedule the next check
          setTimeout(checkLoggedIn, checkInterval)
        })
    }

    // Start the first authentication check
    checkLoggedIn()

    // No cleanup needed since setTimeout handles scheduling
    // and the component unmounting will stop future checks
  }, [enabled, checkInterval])
} 