/* Copyright Contributors to the Open Cluster Management project */

import { Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core'
import { ExclamationTriangleIcon, QuestionCircleIcon, TimesCircleIcon } from '@patternfly/react-icons'
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon'
import { Fragment, ReactNode } from 'react'

export function StatusIcons(props: {
    ready?: number
    low?: number
    medium?: number
    high?: number
    unknown?: number
    readyTooltip?: string
    lowTooltip?: string
    mediumTooltip?: string
    highTooltip?: string
    unknownTooltip?: string
}) {
    const statuses: { key: string; count: number; icon: ReactNode; tooltip?: string }[] = []

    if (props.ready !== undefined && props.ready) {
        statuses.push({
            key: 'ready',
            count: props.ready,
            icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
            tooltip: props.readyTooltip,
        })
    }

    if (props.low !== undefined && props.low) {
        statuses.push({
            key: 'low',
            count: props.low,
            icon: <CheckCircleIcon color="var(--pf-global--info-color--100)" />,
            tooltip: props.lowTooltip,
        })
    }
    if (props.medium !== undefined && props.medium) {
        statuses.push({
            key: 'medium',
            count: props.medium,
            icon: <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />,
            tooltip: props.mediumTooltip,
        })
    }
    if (props.high !== undefined && props.high) {
        statuses.push({
            key: 'high',
            count: props.high,
            icon: <TimesCircleIcon color="var(--pf-global--danger-color--100)" />,
            tooltip: props.highTooltip,
        })
    }

    if (props.unknown !== undefined && props.unknown) {
        statuses.push({
            key: 'ready',
            count: props.unknown,
            icon: <QuestionCircleIcon color="var(--pf-global--icon--Color--light)" />,
            tooltip: props.unknownTooltip,
        })
    }

    return (
        <Flex display={{ default: 'inlineFlex' }}>
            {statuses.map(({ key, icon, count, tooltip }, index) => (
                <Fragment key={key}>
                    {index !== 0 && <Divider key={`${key}_d`} isVertical />}
                    <Tooltip content={tooltip}>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                            <FlexItem>{icon}</FlexItem>
                            <FlexItem>
                                <a href="#">{count}</a>
                            </FlexItem>
                        </Flex>
                    </Tooltip>
                </Fragment>
            ))}
        </Flex>
    )
}
