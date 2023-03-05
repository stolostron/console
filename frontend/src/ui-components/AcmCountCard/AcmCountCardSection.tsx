/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { Grid, GridItem, gridItemSpanValueShape, Skeleton } from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'

import { AcmExpandableCard } from '../AcmExpandable'

const useStyles = makeStyles({
  section: {
    '& > .pf-c-card__body': {
      padding: '0 !important',
    },
    '& > .pf-c-card__expandable-content': {
      padding: '0px',
    },
  },
  card: {
    height: '159px',
    padding: '32px 0 24px 24px',
    borderLeft: '1px solid rgba(0,0,0,0.1)',
    marginTop: '-1px',
  },
  cardFirst: {
    borderLeft: '0',
  },
  countContainer: {
    fontSize: '36px',
  },
  count: {
    textDecoration: 'none !important',
    fontWeight: 100,
  },
  countDanger: {
    color: 'var(--pf-global--danger-color--100)',
    textDecoration: 'none !important',
    fontWeight: 100,
    '&:hover': {
      color: 'var(--pf-global--palette--red-300)',
    },
  },
  title: {
    fontSize: '14px !important',
    fontWeight: 600,
  },
  titleIcon: {
    marginRight: '8px',
  },
  description: {
    opacity: 0.7,
    marginTop: '8px',
    fontSize: '14px',
  },
  link: {
    marginTop: '8px',
    fontSize: '14px',
  },
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
  const classes = useStyles()
  const cardCount = props.cards.length
  // Grid uses a 12 column layout - here we find the number of coulumns to evenly use per item
  // If 12 / cardCount doesnt come out to a whole number we round up and the extra card will be displayed on a second row
  const gridNum = Math.ceil(12 / cardCount) as gridItemSpanValueShape

  return (
    <AcmExpandableCard title={props.title} className={classes.section} id={props.id}>
      <Grid sm={gridNum}>
        {props.cards.map((card, i) => {
          return (
            <GridItem key={i}>
              {props.loading ? (
                <LoadingCard {...card} loadingAriaLabel={props.loadingAriaLabel} />
              ) : (
                <div id={card.id} className={`${classes.card} ${i === 0 ? classes.cardFirst : ''}`}>
                  <div className={classes.countContainer}>
                    {card.countClick && card.count > 0 ? (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                      <a onClick={card.countClick} className={card.isDanger ? classes.countDanger : classes.count}>
                        {card.count}
                      </a>
                    ) : (
                      card.count
                    )}
                  </div>
                  <div className={classes.title}>
                    <span>
                      {card.isDanger && card.count > 0 && (
                        <ExclamationCircleIcon
                          color="var(--pf-global--danger-color--100)"
                          className={classes.titleIcon}
                        />
                      )}
                      {card.title}
                    </span>
                  </div>
                  {card.description && <div className={classes.description}>{card.description}</div>}
                  {card.linkText && (
                    <div className={classes.link}>
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
  const classes = useStyles()
  return (
    <div id={props.id} className={classes.card} role="progressbar" aria-label={props.loadingAriaLabel}>
      <div className={classes.countContainer}>
        <Skeleton style={{ width: '44px', height: '48px', marginBottom: '12px' }} />
      </div>
      <div className={classes.title} style={{ marginBottom: '12px' }}>
        <span>
          <Skeleton style={{ width: '130px', height: '21px', padding: '3px 0' }} />
        </span>
      </div>
      {props.description && (
        <div className={classes.description}>
          <Skeleton style={{ width: '130px', height: '21px', padding: '3px 0' }} />
        </div>
      )}
      {props.linkText && (
        <div className={classes.link}>
          <Skeleton style={{ width: '130px', height: '21px', padding: '3px 0' }} />
        </div>
      )}
    </div>
  )
}
