/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import {
    Card,
    CardActions,
    CardActionsProps,
    CardBody,
    CardFooter,
    CardHeader,
    CardHeaderMain,
    CardProps,
    CardTitle,
    Dropdown,
    DropdownItem,
    KebabToggle,
    Skeleton,
} from '@patternfly/react-core'
import { ReactNode, useState } from 'react'
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
}

type SkeletonCard = CardProps & {
    id?: string
}

const useStyles = makeStyles({
    card: {
        height: (props: AcmCountCardProps) => (props.cardFooter ? 'auto' : '250px'),
    },
    cardHeader: {
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
    },
    headerDescription: {
        fontSize: 'var(--pf-global--FontSize--sm)',
        lineHeight: '1.4',
        overflowWrap: 'anywhere',
        display: '-webkit-box',
        '-webkit-line-clamp': '4',
        '-webkit-box-orient': 'vertical',
        overflow: 'hidden',
    },
    tooltip: {},
    actions: {
        width: '1rem',
        padding: '0',
        '&& ul': {
            right: '-1rem',
        },
    },
    body: {
        position: (props: AcmCountCardProps) => (props.cardHeader ? 'absolute' : 'relative'),
        bottom: '0',
    },
    countTitle: {
        fontSize: 'var(--pf-global--FontSize--sm)',
        fontWeight: 700,
    },
    footer: {
        linkStyle: 'none',
    },
})

export function CardDropdown(props: CardDropdownProps & CardActionsProps) {
    const useStyles = makeStyles({
        dropdown: {
            width: '10rem',
        },
    })
    const classes = useStyles()
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
                <DropdownItem className={classes.dropdown} key={item.text} onClick={item.handleAction}>
                    {item.text}
                </DropdownItem>
            ))}
            position={'right'}
        />
    )
}

export const LoadingCard = (props: SkeletonCard) => {
    const useStyles = makeStyles({
        cardSkeleton: {
            height: '250px',
        },
    })
    const classes = useStyles(props)
    return (
        <Card id={props.id} className={classes.cardSkeleton}>
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
    const classes = useStyles(props)
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
                <CardHeader>
                    {cardHeader.actions && cardHeader.actions.length > 0 && (
                        <CardActions className={classes.actions}>
                            <CardDropdown dropdownItems={cardHeader.actions} />
                        </CardActions>
                    )}
                    <CardHeaderMain className={classes.cardHeader}>
                        {cardHeader.hasIcon && <AcmIcon icon={AcmIconVariant.template} />}
                        <CardTitle>{cardHeader.title}</CardTitle>
                        <p className={classes.headerDescription}>{cardHeader.description}</p>
                    </CardHeaderMain>
                </CardHeader>
            )}
            <CardBody className={classes.body}>
                {props.count !== 0 ? (
                    <div
                        style={{ color: 'var(--pf-global--link--Color)', fontSize: 'var(--pf-global--FontSize--3xl)' }}
                    >
                        {count}
                    </div>
                ) : (
                    <div style={{ fontSize: 'var(--pf-global--FontSize--3xl)' }}>{count}</div>
                )}
                <div className={classes.countTitle}>{countTitle}</div>
            </CardBody>
            {cardFooter && (
                <CardFooter className={classes.footer}>
                    {cardFooter.countDescription || null}
                    {cardFooter.countLink || null}
                </CardFooter>
            )}
        </Card>
    )
}
