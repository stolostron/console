/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { Grid, GridItem, gridSpans, Title } from '@patternfly/react-core'
import useResizeObserver from '@react-hook/resize-observer'
import { Children, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmButton } from '../../AcmButton/AcmButton'

type AcmExpandableWrapperProps = {
  headerLabel?: string
  children: React.ReactNode
  withCount: boolean
  expandable: boolean
  minWidth?: number
  maxItemsPerRow?: gridSpans
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerCount: {
    fontWeight: 'lighter',
  },
  wrapperContainer: {
    margin: '1rem 0',
  },
  showAllButton: {
    margin: '1rem auto',
  },
})

export const AcmExpandableWrapper = (props: AcmExpandableWrapperProps) => {
  const { children, headerLabel, withCount, expandable, minWidth = 300, maxItemsPerRow = 6 } = props
  const classes = useStyles(props)
  const ref = useRef(null)
  const [showAll, setShowAll] = useState<boolean>(false)
  const [columnCount, setColumnCount] = useState(1)
  const { t } = useTranslation()

  const itemCount = useMemo(() => {
    return Children.count(children)
  }, [children])

  useResizeObserver(ref, (entry) => {
    let columns = 1
    while ((columns + 1) * minWidth < entry.contentRect.width) {
      columns++
    }
    if (columns > maxItemsPerRow) {
      columns = maxItemsPerRow
    }
    setColumnCount(columns)
  })
  const spanPerColumn = useMemo(() => Math.floor(12 / columnCount) as gridSpans, [columnCount])

  const visibleItems = useMemo(() => {
    if (expandable) {
      return showAll ? children : Children.toArray(children).slice(0, columnCount)
    }
    return children
  }, [children, expandable, showAll, columnCount])

  return (
    <div className={classes.root}>
      {headerLabel && (
        <Title headingLevel="h4">
          {headerLabel}
          {withCount && <span className={classes.headerCount}> {`( ${itemCount} total )`}</span>}
        </Title>
      )}
      <div ref={ref}>
        <Grid hasGutter className={classes.wrapperContainer}>
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
        <AcmButton className={classes.showAllButton} variant={'secondary'} onClick={() => setShowAll(!showAll)}>
          {showAll
            ? t('Show less')
            : t('Show all ({{count}})', {
                count: itemCount,
              })}
        </AcmButton>
      )}
    </div>
  )
}
