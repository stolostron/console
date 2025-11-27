/* Copyright Contributors to the Open Cluster Management project */
import { Grid, GridItem, gridSpans, Stack } from '@patternfly/react-core'
import useResizeObserver from '@react-hook/resize-observer'
import { Children, Dispatch, ReactNode, SetStateAction, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LoadingPage } from './LoadingPage'

export function AcmMasonry(props: { minSize: number; maxColumns?: number; children?: ReactNode }) {
  const target = useRef(null)
  const [columns, setColumns] = useState(1)
  useResizeObserver(target, (entry) => {
    setColumns(Math.min(props.maxColumns ?? 12, Math.max(Math.floor(entry.contentRect.width / props.minSize), 1)))
  })
  const [span, setSpan] = useState<gridSpans>(12)

  const [sizes, setSizes] = useState<Record<string, number>>({})
  const [isReady, setIsReady] = useState(false)
  useLayoutEffect(() => {
    switch (columns) {
      case 1:
        setSpan(12)
        break
      case 2:
        setSpan(6)
        break
      case 3:
        setSpan(4)
        break
      case 4:
        setSpan(3)
        break
      case 5:
        setSpan(2)
        break
      case 6:
        setSpan(2)
        break
      default:
        setSpan(1)
        break
    }
  }, [columns])

  const realColumns = 12 / span

  const childrenCount = Children.count(props.children)

  // create a map of child keys to indices for stable identification
  const childKeyMap = useMemo(() => {
    const map: Record<string, number> = {}
    Children.forEach(props.children, (child, index) => {
      const key =
        child && typeof child === 'object' && 'key' in child && child.key ? (child.key as string) : `index-${index}`
      map[key] = index
    })
    return map
  }, [props.children])

  useLayoutEffect(() => {
    if (childrenCount === 0) {
      setIsReady(true)
      return
    }

    // check if all current children have been measured
    const currentChildKeys = Object.keys(childKeyMap)
    const allMeasured = currentChildKeys.every((key) => sizes[key] !== undefined) && currentChildKeys.length > 0

    setIsReady(allMeasured)
  }, [sizes, childrenCount, childKeyMap])

  const itemColumns = useMemo(() => {
    const itemColumns: ReactNode[][] = new Array(realColumns).fill(0).map(() => [])
    const columnHeights: number[] = new Array(realColumns).fill(0)
    Children.forEach(props.children, (child, index) => {
      const smallest = Math.min(...columnHeights)
      const columnIndex = columnHeights.findIndex((column) => column === smallest)
      if (child && columnIndex !== undefined && columnIndex !== -1) {
        const childKey =
          child && typeof child === 'object' && 'key' in child && child.key ? (child.key as string) : `index-${index}`
        itemColumns[columnIndex].push(
          <MasonryItem key={childKey} childKey={childKey} sizes={sizes} setSizes={setSizes}>
            {child}
          </MasonryItem>
        )
        const height = sizes[childKey]
        if (height !== undefined) {
          columnHeights[columnIndex] += height + 16
        }
      }
    })
    return itemColumns
  }, [props.children, realColumns, sizes])

  return (
    <div ref={target}>
      {!isReady && <LoadingPage />}
      <Grid hasGutter style={{ maxWidth: realColumns * props.minSize, visibility: isReady ? 'visible' : 'hidden' }}>
        {itemColumns.map((column, index) => (
          <GridItem span={span} key={index}>
            <Stack hasGutter>{column}</Stack>
          </GridItem>
        ))}
      </Grid>
    </div>
  )
}

function MasonryItem(props: {
  children?: ReactNode
  childKey: string
  sizes: Record<string, number>
  setSizes: Dispatch<SetStateAction<Record<string, number>>>
}) {
  const target = useRef(null)
  useResizeObserver(target, (entry) => {
    props.setSizes((sizes) => {
      if (props.sizes[props.childKey] !== entry.contentRect.height) {
        sizes = { ...sizes }
        sizes[props.childKey] = entry.contentRect.height
      }
      return sizes
    })
  })
  return <div ref={target}>{props.children}</div>
}
