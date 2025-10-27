/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  MenuToggle,
  Skeleton,
  EmptyStateHeader,
  Icon,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Popper,
  Flex,
  FlexItem,
} from '@patternfly/react-core'
import { EllipsisVIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { ReactNode, useRef, useState } from 'react'
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
  alert?: React.ReactNode
}

type SkeletonCard = CardProps & {
  id?: string
}

const styles = {
  icon: css({
    '& svg': {
      width: '32px',
      height: '32px',
    },
  }),
  headerDescription: css({
    fontSize: 'var(--pf-v5-global--FontSize--sm)',
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
  }),
  countTitle: css({
    fontSize: 'var(--pf-v5-global--FontSize--sm)',
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

export function CardDropdown(props: Readonly<CardDropdownProps>) {
  const [isOpen, setOpen] = useState<boolean>(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const handleToggleClick = (e: React.MouseEvent) => {
    setOpen(!isOpen)
    e.stopPropagation()
  }

  const handleDocumentClick = (event?: MouseEvent) => {
    // ignore clicks on the toggle itself
    if (toggleRef.current?.contains(event?.target as Node)) {
      return
    }
    setOpen(false)
  }

  return (
    <Popper
      trigger={
        <MenuToggle
          ref={toggleRef}
          aria-label="Actions"
          variant="plain"
          onClick={handleToggleClick}
          isExpanded={isOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      }
      isVisible={isOpen}
      enableFlip={true}
      placement="bottom-end"
      onDocumentClick={handleDocumentClick}
      popper={
        <Menu>
          <MenuContent>
            <MenuList>
              {props.dropdownItems.map((item) => (
                <MenuItem
                  key={item.text}
                  onClick={(event) => {
                    item.handleAction()
                    setOpen(false)
                    event?.stopPropagation()
                  }}
                >
                  {item.text}
                </MenuItem>
              ))}
            </MenuList>
          </MenuContent>
        </Menu>
      }
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
  if (Number.parseInt(count) >= 1000) {
    count = `${(Number.parseInt(count) - (Number.parseInt(count) % 100)) / 1000}k`
  }
  if (loading) return LoadingCard(props)
  return (
    <Card id={id} className={classes.card} onClick={props.onCardClick}>
      {cardHeader && (
        <CardHeader
          {...(cardHeader.actions &&
            cardHeader.actions.length > 0 && {
              actions: {
                actions: <CardDropdown dropdownItems={cardHeader.actions} />,
              },
            })}
        >
          {cardHeader.hasIcon && (
            <Icon size="lg" className={classes.icon}>
              <AcmIcon icon={AcmIconVariant.template} />
            </Icon>
          )}
          <CardTitle>
            <Flex rowGap={{ default: 'rowGapNone' }}>
              <FlexItem spacer={{ default: 'spacerSm' }}>{cardHeader.title}</FlexItem>
              {props.alert && <FlexItem>{props.alert}</FlexItem>}
            </Flex>
          </CardTitle>
          <p className={classes.headerDescription}>{cardHeader.description}</p>
        </CardHeader>
      )}
      {!props.error ? (
        <CardBody className={classes.body}>
          {props.count !== 0 ? (
            <div style={{ color: 'var(--pf-v5-global--link--Color)', fontSize: 'var(--pf-v5-global--FontSize--3xl)' }}>
              {count}
            </div>
          ) : (
            <div style={{ fontSize: 'var(--pf-v5-global--FontSize--3xl)' }}>{count}</div>
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
                color={'var(--pf-v5-global--danger-color--100)'}
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
