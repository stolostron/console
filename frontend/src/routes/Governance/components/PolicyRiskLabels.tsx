/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardTitle, Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon'
import ChevronCircleDownIcon from '@patternfly/react-icons/dist/esm/icons/chevron-circle-down-icon'
import ChevronCircleUpIcon from '@patternfly/react-icons/dist/esm/icons/chevron-circle-up-icon'
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon'
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon'
import { Children, Fragment, isValidElement, ReactElement, ReactNode } from 'react'
import { NoWrap } from '../../../components/NoWrap'
import { IPolicyRisks } from '../useGovernanceData'

const green = '#5BA352'
const red = '#C9190B'
const orange = '#EC7A08'
const yellow = '#F0AB00'
const grey = '#CCCCCC'

function FlexWithDividers(props: { children?: ReactNode }) {
    const children: ReactElement[] = []
    let needsDivider = false
    Children.forEach(props.children, (child) => {
        if (!isValidElement(child)) return
        if (child.type === Fragment) return
        if (needsDivider) children.push(<Divider isVertical />)
        needsDivider = true
        children.push(child as ReactElement)
    })
    return <Flex display={{ default: 'inlineFlex' }}>{children}</Flex>
}

export function RiskIcons(props: { risks: IPolicyRisks }) {
    return (
        <FlexWithDividers>
            {props.risks.synced !== 0 ? (
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                        <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                    </FlexItem>
                    <FlexItem>
                        <a href="#">{props.risks.synced}</a>
                    </FlexItem>
                </Flex>
            ) : (
                <Fragment />
            )}
            {props.risks.low ? (
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                        <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
                    </FlexItem>
                    <FlexItem>
                        <a href="#">{props.risks.low}</a>
                    </FlexItem>
                </Flex>
            ) : (
                <Fragment />
            )}
            {props.risks.medium !== 0 ? (
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                        <ExclamationTriangleIcon color="#EC7A08" />
                    </FlexItem>
                    <FlexItem>
                        <a href="#">{props.risks.medium}</a>
                    </FlexItem>
                </Flex>
            ) : (
                <Fragment />
            )}
            {props.risks.high !== 0 ? (
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                        <ExclamationTriangleIcon color="var(--pf-global--danger-color--100)" />
                    </FlexItem>
                    <FlexItem>
                        <a href="#">{props.risks.high}</a>
                    </FlexItem>
                </Flex>
            ) : (
                <Fragment />
            )}
        </FlexWithDividers>
    )
}

export function RisksCard(props: { title: string; risks: IPolicyRisks; singular: string; plural: string }) {
    if (props.risks.synced + props.risks.low + props.risks.medium + props.risks.high + props.risks.unknown === 0) {
        return <Fragment />
    }
    return (
        <Card
            isRounded
            isHoverable
            style={{ transition: 'box-shadow 0.25s', cursor: 'pointer', height: '100%', textAlign: 'center' }}
        >
            <CardTitle>{props.title}</CardTitle>
            <CardBody>
                <RiskIcons risks={props.risks} />
            </CardBody>
        </Card>
    )
}

export function PolicyRiskLabels(props: {
    risks: IPolicyRisks
    isVertical?: boolean
    showLabels?: boolean
    singular: string
    plural: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: props.isVertical ? 'column' : 'row',
                columnGap: 12,
                rowGap: 4,
                flexWrap: 'wrap',
            }}
        >
            {props.risks.high > 0 && (
                <Tooltip
                    content={
                        `${props.risks.high} ` +
                        (props.risks.high === 1 ? props.singular : props.plural) +
                        ' at high risk'
                    }
                >
                    <NoWrap style={{ color: red }}>
                        <ChevronCircleUpIcon />
                        &nbsp;
                        {props.risks.high}
                        {props.showLabels
                            ? ' ' + (props.risks.high === 1 ? props.singular : props.plural) + ' at high risk'
                            : undefined}
                    </NoWrap>
                </Tooltip>
            )}
            {props.risks.medium > 0 && (
                <Tooltip
                    content={
                        `${props.risks.medium} medium risk ` +
                        (props.risks.medium === 1 ? props.singular : props.plural)
                    }
                >
                    <NoWrap style={{ color: orange }}>
                        <MinusCircleIcon />
                        &nbsp;
                        {props.risks.medium}
                        {props.showLabels
                            ? ' ' + (props.risks.medium === 1 ? props.singular : props.plural) + ' at medium risk'
                            : undefined}
                    </NoWrap>
                </Tooltip>
            )}
            {props.risks.low > 0 && (
                <Tooltip
                    content={`${props.risks.low} low risk ` + (props.risks.low === 1 ? props.singular : props.plural)}
                >
                    <NoWrap style={{ color: yellow }}>
                        <ChevronCircleDownIcon />
                        &nbsp;
                        {props.risks.low}
                        {props.showLabels
                            ? ' ' + (props.risks.low === 1 ? props.singular : props.plural) + ' at low risk'
                            : undefined}
                    </NoWrap>
                </Tooltip>
            )}
            {props.risks.synced > 0 && (
                <Tooltip
                    content={
                        `${props.risks.synced} in sync ` + (props.risks.synced === 1 ? props.singular : props.plural)
                    }
                >
                    <NoWrap style={{ color: green }}>
                        <CheckCircleIcon />
                        &nbsp;
                        {props.risks.synced}
                        {props.showLabels
                            ? ' compliant ' + (props.risks.synced === 1 ? props.singular : props.plural)
                            : undefined}
                    </NoWrap>
                </Tooltip>
            )}
            {props.risks.unknown > 0 && (
                <Tooltip content={`${props.risks.unknown} unknown status`}>
                    <NoWrap style={{ color: grey }}>
                        <QuestionCircleIcon />
                        &nbsp;
                        {props.risks.unknown}
                        {props.showLabels
                            ? ' unknown ' + (props.risks.unknown === 1 ? props.singular : props.plural)
                            : undefined}
                    </NoWrap>
                </Tooltip>
            )}
        </div>
    )
}

export function AcmFlewWrap(props: { children: ReactNode }) {
    return (
        <div
            style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'stretch',
            }}
        >
            {props.children}
        </div>
    )
}

export function RisksGauge(props: { risks: IPolicyRisks }) {
    const total = props.risks.synced + props.risks.high + props.risks.medium + props.risks.low + props.risks.unknown
    const radius = 36
    const width = 36
    return (
        <div style={{ width: 72, height: 72, position: 'relative' }}>
            <ProgressRing
                start={props.risks.synced + props.risks.medium + props.risks.low + props.risks.unknown}
                size={props.risks.high}
                total={total}
                radius={radius}
                strokeWidth={width}
                color={red}
            />
            <ProgressRing
                start={props.risks.synced + props.risks.low + props.risks.unknown}
                size={props.risks.medium}
                total={total}
                radius={radius}
                strokeWidth={width}
                color={orange}
            />
            <ProgressRing
                start={props.risks.synced + props.risks.unknown}
                size={props.risks.low}
                total={total}
                radius={radius}
                strokeWidth={width}
                color={yellow}
            />
            <ProgressRing
                start={props.risks.unknown}
                size={props.risks.synced}
                total={total}
                radius={radius}
                strokeWidth={width}
                color={green}
            />

            <ProgressRing
                start={0}
                size={props.risks.unknown}
                total={total}
                radius={radius}
                strokeWidth={width}
                color={grey}
            />
        </div>
    )
}

function ProgressRing(props: {
    start: number
    size: number
    total: number
    radius: number
    strokeWidth: number
    color: string
}) {
    const { start, size, total, radius, strokeWidth } = props

    const circleRadius = radius - strokeWidth / 2
    const circumference = circleRadius * 2 * Math.PI

    const strokeDashoffset = -(circumference * start) / total + 0.25 * circumference

    return (
        <svg height={radius * 2} width={radius * 2} style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle
                r={circleRadius}
                cx={radius}
                cy={radius}
                stroke={props.color}
                strokeWidth={strokeWidth}
                strokeDasharray={(circumference * size) / total + ' ' + circumference * (1 - size / total)}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
            />
        </svg>
    )
}
