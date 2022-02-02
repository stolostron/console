/* Copyright Contributors to the Open Cluster Management project */

import { Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode } from 'react'

export function StatusIcons(props: {
    compliant?: number
    violations?: number
    unknown?: number
    compliantTooltip?: string
    violationsTooltip?: string
    unknownTooltip?: string
}) {
    const statuses: { key: string; count: number; icon: ReactNode; tooltip?: string }[] = []

    if (props.violations !== undefined && props.violations) {
        statuses.push({
            key: 'violations',
            count: props.violations,
            icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />,
            tooltip: props.violationsTooltip,
        })
    }
    if (props.compliant !== undefined && props.compliant) {
        statuses.push({
            key: 'compliant',
            count: props.compliant,
            icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />,
            tooltip: props.compliantTooltip,
        })
    }

    if (props.unknown !== undefined && props.unknown) {
        statuses.push({
            key: 'ready',
            count: props.unknown,
            icon: <ExclamationTriangleIcon color="var(--pf-global--icon--Color--light)" />,
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
                                {/* TODO add custom href capability */}
                                {/* <a href="#">{count}</a> */}
                                {count}
                            </FlexItem>
                        </Flex>
                    </Tooltip>
                </Fragment>
            ))}
        </Flex>
    )
}
