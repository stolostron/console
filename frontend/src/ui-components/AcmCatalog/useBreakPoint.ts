/* Copyright Contributors to the Open Cluster Management project */

import breakpoint2xl from '@patternfly/react-tokens/dist/esm/t_global_breakpoint_2xl'
import breakpointLg from '@patternfly/react-tokens/dist/esm/t_global_breakpoint_lg'
import breakpointMd from '@patternfly/react-tokens/dist/esm/t_global_breakpoint_md'
import breakpointSm from '@patternfly/react-tokens/dist/esm/t_global_breakpoint_sm'
import breakpointXl from '@patternfly/react-tokens/dist/esm/t_global_breakpoint_xl'
import breakpointXs from '@patternfly/react-tokens/dist/esm/t_global_breakpoint_xs'
import { useEffect, useState } from 'react'

export enum WindowSize {
  xs,
  sm,
  md,
  lg,
  xl,
  '2xl',
}

const toPixels = (value: string) => (value.endsWith('rem') ? parseFloat(value) * 16 : parseFloat(value))
const breakpoints = [breakpointXs, breakpointSm, breakpointMd, breakpointLg, breakpointXl, breakpoint2xl].map((token) =>
  toPixels(token.value)
)

function getWindowSize() {
  for (let size = WindowSize['2xl']; size >= WindowSize.sm; size--) {
    if (window.innerWidth >= breakpoints[size]) return size
  }
  return WindowSize.xs
}

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(getWindowSize)
  useEffect(() => {
    const onResize = () => setWindowSize(getWindowSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return windowSize
}
