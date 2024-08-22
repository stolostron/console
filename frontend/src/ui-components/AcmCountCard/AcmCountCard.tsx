/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Card,
  CardActionsProps,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Skeleton,
  EmptyStateHeader,
} from '@patternfly/react-core'
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { ReactNode, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmIcon, AcmIconVariant } from '../AcmIcons/AcmIcons'

type CardHeaderActions = {
  text: string
  handleAction: () => void
}

interface CardHeaderProps {
  title: string
  description: string
  actions?: CardHeaderActions[]
  onActionClick?: (event: React.SyntheticEvent) => void
  hasIcon?: boolean
}

interface CardFooterProps {
  countDescription?: string
  countLink?: string | ReactNode
}

interface CardDropdownProps {
  dropdownItems: {
    text: string
    handleAction: () => void
  }[]
  toggle?: React.ReactNode
  onSelect?: (event: React.SyntheticEvent) => void
}

export type AcmCountCardProps = CardProps & {
  key?: number
  id?: string
  label?: string
  loading?: boolean
  onCardClick?: () => void
  cardHeader?: CardHeaderProps
  cardFooter?: CardFooterProps
  count?: number
  countTitle?: string
  isFlat?: boolean
  onKeyPress?: (e: React.KeyboardEvent) => void
  error?: boolean
  errorMessage?: string
}

type SkeletonCard = CardProps & {
  id?: string
}

const styles = {
  cardHeader: css({
    '& > div:first-child': {
      padding: '0',
      marginBottom: '8px',
      overflowWrap: 'anywhere',
      lineHeight: '19px',
      display: '-webkit-box',
      '-webkit-line-clamp': '3',
      '-webkit-box-orient': 'vertical',
      overflow: 'hidden',
    },
    '& > svg': {
      width: '32px',
      height: '32px',
    },
  }),
  headerDescription: css({
    fontSize: 'var(--pf-global--FontSize--sm)',
    lineHeight: '1.4',
    overflowWrap: 'anywhere',
    display: '-webkit-box',
    '-webkit-line-clamp': '4',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  }),
  actions: css({
    width: '1rem',
    padding: '0',
    '&& ul': {
      right: '-1rem',
    },
  }),
  countTitle: css({
    fontSize: 'var(--pf-global--FontSize--sm)',
    fontWeight: 700,
  }),
  footer: css({
    linkStyle: 'none',
  }),
}

const getStyles = (props: AcmCountCardProps) => ({
  card: css({
    height: props.cardFooter ? 'auto' : '250px',
  }),
  body: css({
    position: props.cardHeader ? 'absolute' : 'relative',
    bottom: '0',
  }),
  ...styles,
})

export function CardDropdown(props: CardDropdownProps & CardActionsProps) {
  const [isOpen, setOpen] = useState<boolean>(false)

  return (
    <Dropdown
      className="dropdownMenu"
      onClick={(e) => {
        setOpen(!isOpen)
        e.stopPropagation()
      }}
      toggle={<KebabToggle onToggle={() => setOpen(!isOpen)} />}
      isOpen={isOpen}
      isPlain
      dropdownItems={props.dropdownItems.map((item) => (
        <DropdownItem className={css({ width: '10rem' })} key={item.text} onClick={item.handleAction}>
          {item.text}
        </DropdownItem>
      ))}
      position={'right'}
    />
  )
}

export const LoadingCard = (props: SkeletonCard) => {
  return (
    <Card id={props.id} className={css({ height: '250px' })}>
      <CardHeader>
        <Skeleton width="25%" />
      </CardHeader>
      <CardBody>
        <Skeleton width="100%" />
        <br />
        <Skeleton width="100%" />
      </CardBody>
      <CardFooter>
        <Skeleton width="25%" height="4rem" />
      </CardFooter>
    </Card>
  )
}

export const AcmCountCard = (props: AcmCountCardProps) => {
  const { t } = useTranslation()
  const classes = getStyles(props)
  const { id, loading, countTitle, cardFooter, cardHeader } = props
  let count = `${props.count}`
  if (parseInt(count) >= 1000) {
    count = `${(parseInt(count) - (parseInt(count) % 100)) / 1000}k`
  }
  if (loading) return LoadingCard(props)
  return (
    <Card
      id={id}
      className={classes.card}
      onClick={props.onCardClick}
      isSelectable={!!props.onCardClick}
      isFlat={!props.onCardClick}
      onKeyPress={props.onKeyPress}
    >
      {cardHeader && (
        <CardHeader
          {...(cardHeader.actions &&
            cardHeader.actions.length > 0 && {
              actions: {
                actions: (
                  <>
                    <CardDropdown dropdownItems={cardHeader.actions} />
                  </>
                ),
                hasNoOffset: false,
                className: 'undefined',
              },
            })}
        >
          actions=
          {
            <>
              {cardHeader.hasIcon && <AcmIcon icon={AcmIconVariant.template} />}
              <CardTitle>{cardHeader.title}</CardTitle>
              <p className={classes.headerDescription}>{cardHeader.description}</p>
            </>
          }
        </CardHeader>
      )}
      {!props.error ? (
        <CardBody className={classes.body}>
          {props.count !== 0 ? (
            <div style={{ color: 'var(--pf-global--link--Color)', fontSize: 'var(--pf-global--FontSize--3xl)' }}>
              {count}
            </div>
          ) : (
            <div style={{ fontSize: 'var(--pf-global--FontSize--3xl)' }}>{count}</div>
          )}
          <div className={classes.countTitle}>{countTitle}</div>
        </CardBody>
      ) : (
        <EmptyState style={{ paddingTop: 0, marginTop: 'auto' }}>
          <EmptyStateHeader
            titleText={
              <>
                {t('Error occurred while getting the result count.', {
                  searchName: cardHeader?.title,
                })}
              </>
            }
            icon={
              <EmptyStateIcon
                style={{ fontSize: '36px', marginBottom: '1rem' }}
                icon={ExclamationCircleIcon}
                color={'var(--pf-global--danger-color--100)'}
              />
            }
            headingLevel="h4"
          />
          <EmptyStateBody>{props.errorMessage}</EmptyStateBody>
        </EmptyState>
      )}
      {cardFooter && (
        <CardFooter className={classes.footer}>
          {cardFooter.countDescription || null}
          {cardFooter.countLink || null}
        </CardFooter>
      )}
    </Card>
  )
}
