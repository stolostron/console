/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Grid, GridItem, gridItemSpanValueShape, Skeleton } from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'

import { AcmExpandableCard } from '../AcmExpandable'

const section = css({
  '& > .pf-c-card__body': {
    padding: '0 !important',
  },
  '& > .pf-c-card__expandable-content': {
    padding: '0px',
  },
})
const card = css({
  height: '159px',
  padding: '32px 0 24px 24px',
  borderLeft: '1px solid rgba(0,0,0,0.1)',
  marginTop: '-1px',
})
const cardFirst = css({
  borderLeft: '0',
})
const countContainer = css({
  fontSize: '36px',
})
const count = css({
  textDecoration: 'none !important',
  fontWeight: 100,
})
const countDanger = css({
  color: 'var(--pf-global--danger-color--100)',
  textDecoration: 'none !important',
  fontWeight: 100,
  '&:hover': {
    color: 'var(--pf-global--palette--red-300)',
  },
})
const title = css({
  fontSize: '14px !important',
  fontWeight: 600,
})
const titleIcon = css({
  marginRight: '8px',
})
const description = css({
  opacity: 0.7,
  marginTop: '8px',
  fontSize: '14px',
})
const link = css({
  marginTop: '8px',
  fontSize: '14px',
})

export type AcmCountCardSection = {
  id?: string
  title: string
  cards: AcmCountCardSectionCard[]
  loading?: boolean
  loadingAriaLabel?: string
}

export type AcmCountCardSectionCard = {
  id?: string
  count: number
  countClick?: () => void
  title: string
  description?: string | React.ReactNode
  linkText?: string
  onLinkClick?: () => void
  isDanger?: boolean
}

export const AcmCountCardSection = (props: AcmCountCardSection) => {
  const cardCount = props.cards.length
  // Grid uses a 12 column layout - here we find the number of coulumns to evenly use per item
  // If 12 / cardCount doesnt come out to a whole number we round up and the extra card will be displayed on a second row
  const gridNum = Math.ceil(12 / cardCount) as gridItemSpanValueShape

  return (
    <AcmExpandableCard title={props.title} className={section} id={props.id}>
      <Grid sm={gridNum}>
        {props.cards.map((card, i) => {
          return (
            <GridItem key={i}>
              {props.loading ? (
                <LoadingCard {...card} loadingAriaLabel={props.loadingAriaLabel} />
              ) : (
                <div id={card.id} className={`${card} ${i === 0 ? cardFirst : ''}`}>
                  <div className={countContainer}>
                    {card.countClick && card.count > 0 ? (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                      <a onClick={card.countClick} className={card.isDanger ? countDanger : count}>
                        {card.count}
                      </a>
                    ) : (
                      card.count
                    )}
                  </div>
                  <div className={title}>
                    <span>
                      {card.isDanger && card.count > 0 && (
                        <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" className={titleIcon} />
                      )}
                      {card.title}
                    </span>
                  </div>
                  {card.description && <div className={description}>{card.description}</div>}
                  {card.linkText && (
                    <div className={link}>
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                      <a onClick={card.onLinkClick}>{card.linkText}</a>
                    </div>
                  )}
                </div>
              )}
            </GridItem>
          )
        })}
      </Grid>
    </AcmExpandableCard>
  )
}

const LoadingCard = (props: AcmCountCardSectionCard & { loadingAriaLabel?: string }) => {
  return (
    <div id={props.id} className={card} role="progressbar" aria-label={props.loadingAriaLabel}>
      <div className={countContainer}>
        <Skeleton style={{ width: '44px', height: '48px', marginBottom: '12px' }} />
      </div>
      <div className={title} style={{ marginBottom: '12px' }}>
        <span>
          <Skeleton style={{ width: '130px', height: '21px', padding: '3px 0' }} />
        </span>
      </div>
      {props.description && (
        <div className={description}>
          <Skeleton style={{ width: '130px', height: '21px', padding: '3px 0' }} />
        </div>
      )}
      {props.linkText && (
        <div className={link}>
          <Skeleton style={{ width: '130px', height: '21px', padding: '3px 0' }} />
        </div>
      )}
    </div>
  )
}
