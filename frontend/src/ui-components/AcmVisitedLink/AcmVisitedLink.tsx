/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { Link, LinkProps } from 'react-router-dom-v5-compat'
import { css } from '@emotion/css'
import { getItemWithExpiration, setItemWithExpiration } from '../AcmTable/AcmTableStateProvider'

const visitedLinkClass = css`
  color: var(--pf-v5-global--link--Color--visited) !important;
  span {
    color: var(--pf-v5-global--link--Color--visited) !important;
  }
`
const visitedLinksKey = 'visited-links'

/**
 * A wrapper around react-router-dom-v5-compat Link component
 * that provides visited link styling support.
 */
export function AcmVisitedLink({ to, ...props }: LinkProps) {
  // Try to handle both string and object types for 'to'
  let pathname: string | undefined
  if (typeof to === 'string') {
    pathname = to
  } else if (typeof to === 'object' && to !== null && 'pathname' in to) {
    const toObj = to as { pathname: string; search?: string }
    pathname = toObj.pathname + (toObj.search ?? '')
  }

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (pathname) {
      // Get existing visited values using expiration helper
      const storedValue = getItemWithExpiration(visitedLinksKey)
      let visitedValues: string[] = []

      if (storedValue) {
        try {
          const parsed = JSON.parse(storedValue)
          if (Array.isArray(parsed)) {
            visitedValues = parsed
          }
        } catch {
          // If parsing fails, start with empty array
        }
      }

      // Add current value if not already present
      if (!visitedValues.includes(pathname)) {
        visitedValues.push(pathname)
      }

      // Store updated array with expiration helper
      setItemWithExpiration(visitedLinksKey, JSON.stringify(visitedValues))
    }
    props.onClick?.(event)
  }

  // Check if this link value was visited before
  let wasVisited = false
  if (pathname) {
    const storedValue = getItemWithExpiration(visitedLinksKey)
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue)
        if (Array.isArray(parsed)) {
          wasVisited = parsed.includes(pathname)
        }
      } catch {
        // If parsing fails, assume not visited
      }
    }
  }
  const linkClassName = wasVisited ? visitedLinkClass : ''

  return <Link to={to} onClick={handleClick} {...props} className={linkClassName} />
}
