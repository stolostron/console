/* Copyright Contributors to the Open Cluster Management project */

import { Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core'
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
}) {
    const statuses: { key: string; count: number; icon: ReactNode; tooltip?: string; href?: string }[] = []

    if (props.compliant !== undefined && props.compliant) {
        statuses.push({
            key: 'compliant',
            count: props.compliant,
            icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
            tooltip: props.compliantTooltip,
            href: props.compliantHref,
        })
    }

    if (props.violations !== undefined && props.violations) {
        statuses.push({
            key: 'violations',
            count: props.violations,
            icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />,
            tooltip: props.violationsTooltip,
            href: props.violationHref,
        })
    }

    if (props.unknown !== undefined && props.unknown) {
        statuses.push({
            key: 'unknown',
            count: props.unknown,
            icon: <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />,
            tooltip: props.unknownTooltip,
            href: props.unknownHref,
        })
    }

    return (
        <Flex display={{ default: 'inlineFlex' }}>
            {statuses.map(({ key, icon, count, tooltip, href }, index) => (
                <Fragment key={key}>
                    {index !== 0 && <Divider key={`${key}_d`} isVertical />}
                    <Tooltip content={tooltip}>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>{icon}</FlexItem>
                            <FlexItem>{href ? <Link to={href}>{count}</Link> : count}</FlexItem>
                        </Flex>
                    </Tooltip>
                </Fragment>
            ))}
        </Flex>
    )
}
