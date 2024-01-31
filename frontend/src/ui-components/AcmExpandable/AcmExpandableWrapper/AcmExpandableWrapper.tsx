/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Grid, GridItem, gridSpans, Title } from '@patternfly/react-core'
import { Children, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmButton } from '../../AcmButton/AcmButton'
import { useViewport } from '../../AcmCharts'

type AcmExpandableWrapperProps = {
  id: string
  headerLabel?: string
  children: React.ReactNode
  withCount: boolean
  expandable: boolean
  minWidth?: number
  maxItemsPerRow?: gridSpans
}

const root = css({
  display: 'flex',
  flexDirection: 'column',
})
const headerCount = css({
  fontWeight: 'lighter',
})
const wrapperContainer = css({
  margin: '1rem 0',
})
const showAllButton = css({
  margin: '1rem auto',
})

export const AcmExpandableWrapper = (props: AcmExpandableWrapperProps) => {
  const { id, children, headerLabel, withCount, expandable, minWidth = 300, maxItemsPerRow = 6 } = props
  const ref = useRef(null)
  const viewPort = useViewport()
  const [showAll, setShowAll] = useState<boolean>(false)
  const [columnCount, setColumnCount] = useState(0)
  const { t } = useTranslation()

  const itemCount = useMemo(() => {
    return Children.count(children)
  }, [children])

  useEffect(() => {
    const section = document.querySelector(`#${id}`)
    let columns = 1
    while ((columns + 1) * minWidth < (section?.clientWidth ?? 0)) {
      columns++
    }
    if (columns > maxItemsPerRow) {
      columns = maxItemsPerRow
    }
    setColumnCount(columns)
  }, [id, maxItemsPerRow, minWidth, viewPort.viewWidth])

  const spanPerColumn = useMemo(() => Math.floor(12 / columnCount) as gridSpans, [columnCount])

  const visibleItems = useMemo(() => {
    if (expandable) {
      return showAll ? children : Children.toArray(children).slice(0, columnCount)
    }
    return children
  }, [children, expandable, showAll, columnCount])

  {
    /* Do not display until column count is calculated to avoid flashing child items */
  }
  return (
    <div id={id} ref={ref}>
      {columnCount > 0 ? (
        <div className={root}>
          {headerLabel && (
            <Title headingLevel="h4">
              {headerLabel}
              {withCount && <span className={headerCount}> {`( ${itemCount} total )`}</span>}
            </Title>
          )}
          <div>
            <Grid hasGutter className={wrapperContainer}>
              {Children.map(visibleItems, (child, idx) => {
                return (
                  <GridItem span={spanPerColumn}>
                    <div key={`item-${idx}`}>{child}</div>
                  </GridItem>
                )
              })}
            </Grid>
          </div>
          {expandable && itemCount > columnCount && (
            <AcmButton className={showAllButton} variant={'secondary'} onClick={() => setShowAll(!showAll)}>
              {showAll
                ? t('Show less')
                : t('Show all ({{count}})', {
                    count: itemCount,
                  })}
            </AcmButton>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}
