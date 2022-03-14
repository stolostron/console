/* Copyright Contributors to the Open Cluster Management project */

import { Button, ButtonVariant, Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function StatusIcons(props: {
    compliant?: number
    violations?: number
    unknown?: number
    compliantTooltip?: string
    violationsTooltip?: string
    unknownTooltip?: string
    compliantHref?: string
    violationHref?: string
    unknownHref?: string
    compliantOnClick?: () => void
    violationOnClick?: () => void
    unknownOnClick?: () => void
}) {
    const statuses: {
        key: string
        count: number
        icon: ReactNode
        tooltip?: string
        href?: string
        onClick?: () => void
    }[] = []

    if (props.compliant !== undefined && props.compliant) {
        statuses.push({
            key: 'compliant',
            count: props.compliant,
            icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
            tooltip: props.compliantTooltip,
            href: props.compliantHref,
            onClick: props.compliantOnClick,
        })
    }

    if (props.violations !== undefined && props.violations) {
        statuses.push({
            key: 'violations',
            count: props.violations,
            icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />,
            tooltip: props.violationsTooltip,
            href: props.violationHref,
            onClick: props.violationOnClick,
        })
    }

    if (props.unknown !== undefined && props.unknown) {
        statuses.push({
            key: 'unknown',
            count: props.unknown,
            icon: <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />,
            tooltip: props.unknownTooltip,
            href: props.unknownHref,
            onClick: props.unknownOnClick,
        })
    }

    function getCount(count: number, href?: string, onClick?: () => void) {
        if (href) {
            return <Link to={href}>{count}</Link>
        } else if (onClick) {
            return (
                <Button isSmall isInline variant={ButtonVariant.link} onClick={onClick}>
                    {count}
                </Button>
            )
        } else {
            return count
        }
    }

    return (
        <Flex display={{ default: 'inlineFlex' }}>
            {statuses.map(({ key, icon, count, tooltip, href, onClick }, index) => (
                <Fragment key={key}>
                    {index !== 0 && <Divider key={`${key}_d`} isVertical />}
                    <Tooltip content={tooltip}>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>{icon}</FlexItem>
                            <FlexItem>{getCount(count, href, onClick)}</FlexItem>
                        </Flex>
                    </Tooltip>
                </Fragment>
            ))}
        </Flex>
    )
}
