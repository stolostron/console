/* Copyright Contributors to the Open Cluster Management project */

import { Children, useCallback, useState } from 'react'
import { makeStyles } from '@mui/styles'
import { AcmButton } from '../../AcmButton/AcmButton'
import { Title, Gallery, GalleryItem } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import useResizeObserver from '@react-hook/resize-observer'

type AcmExpandableWrapperProps = {
  headerLabel?: string
  children: React.ReactNode
  maxHeight?: string
  withCount: boolean
  expandable: boolean
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
  gallery: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },
  hideExtras: {
    maxHeight: (props: AcmExpandableWrapperProps) => props.maxHeight,
    overflow: 'hidden',
  },
  showAllButton: {
    margin: '1rem auto',
  },
})

export const AcmExpandableWrapper = (props: AcmExpandableWrapperProps) => {
  const { children, headerLabel, withCount, expandable } = props
  const classes = useStyles(props)
  const [showAll, setShowAll] = useState<boolean>(false)
  const [wrapperDiv, setWrapperDiv] = useState<HTMLDivElement | null>(null)
  const [galleryDiv, setGalleryDiv] = useState<HTMLDivElement | null>(null)
  const wrapperDivRef = useCallback((elem) => setWrapperDiv(elem), [])
  const galleryDivRef = useCallback((elem) => setGalleryDiv(elem), [])
  const [showExpandable, setShowExpandable] = useState<boolean>(false)
  const [wrapperHeight, setWrapperHeight] = useState<number>(0)
  const { t } = useTranslation()

  // Save max height of wrapper when restricted
  if (wrapperDiv && !showAll && !wrapperHeight) {
    setWrapperHeight(wrapperDiv.clientHeight)
  }

  useResizeObserver(galleryDiv, () => {
    setShowExpandable((galleryDiv?.clientHeight || 0) > wrapperHeight)
  })

  return (
    <div className={classes.root}>
      {headerLabel && (
        <Title headingLevel="h4">
          {headerLabel}
          {withCount && <span className={classes.headerCount}> {`( ${Children.count(children)} total )`}</span>}
        </Title>
      )}
      <div
        ref={wrapperDivRef}
        className={showAll ? `${classes.wrapperContainer}` : `${classes.wrapperContainer} ${classes.hideExtras}`}
      >
        <div ref={galleryDivRef}>
          <Gallery hasGutter className={classes.gallery}>
            {Children.map(props.children, (child, idx) => {
              return (
                <GalleryItem>
                  <div key={`item-${idx}`}>{child}</div>
                </GalleryItem>
              )
            })}
          </Gallery>
        </div>
      </div>
      {expandable && showExpandable && (
        <AcmButton className={classes.showAllButton} variant={'secondary'} onClick={() => setShowAll(!showAll)}>
          {showAll
            ? t('Show less')
            : t('Show all ({{count}})', {
                count: Children.count(children),
              })}
        </AcmButton>
      )}
    </div>
  )
}
