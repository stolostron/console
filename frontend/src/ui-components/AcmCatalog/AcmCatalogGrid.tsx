/* Copyright Contributors to the Open Cluster Management project */

import useResizeObserver from '@react-hook/resize-observer'
import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useWindowSize, WindowSize } from './useBreakPoint'

export function AcmCatalogGrid({
  children,
  size = 470,
  maxColumns = 12,
}: {
  children: ReactNode
  size?: number
  maxColumns?: number
}) {
  const target = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)
  const windowSize = useWindowSize()
  const resize = useCallback(
    (width: number) => setColumns(Math.min(maxColumns, Math.max(Math.floor(width / size), 1))),
    [maxColumns, size]
  )

  useResizeObserver(target, (entry) => resize(entry.contentRect.width))
  useLayoutEffect(() => resize(target.current?.clientWidth ?? 0), [resize])

  return (
    <div
      ref={target}
      style={{
        display: 'grid',
        gridAutoRows: '1fr',
        gridTemplateColumns: new Array(columns).fill('1fr').join(' '),
        gap: windowSize <= WindowSize.xs ? 8 : windowSize <= WindowSize.lg ? 16 : 24,
      }}
    >
      {children}
    </div>
  )
}
