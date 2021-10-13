/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody, CardHeader, CardTitle, Divider, Title, Tooltip } from '@patternfly/react-core'
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon'
import ChevronCircleDownIcon from '@patternfly/react-icons/dist/esm/icons/chevron-circle-down-icon'
import ChevronCircleUpIcon from '@patternfly/react-icons/dist/esm/icons/chevron-circle-up-icon'
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon'
import OutlinedCircleIcon from '@patternfly/react-icons/dist/esm/icons/outlined-circle-icon'
import QuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/question-circle-icon'
import { ReactNode } from 'react'
import { NoWrap } from '../../../components/NoWrap'
import { IPolicyRisks } from '../useGovernanceData'

const green = '#5BA352'
const red = '#C9190B'
const orange = '#EC7A08'
const yellow = '#F0AB00'
const grey = '#CCCCCC'

export function RisksCard(props: { title: string; risks: IPolicyRisks; singular: string; plural: string }) {
    return (
        <Card isRounded isHoverable style={{ transition: 'box-shadow 0.25s', cursor: 'pointer', height: '100%' }}>
            <CardHeader>
                <CardTitle>
                    <Title headingLevel="h3" style={{ color: 'black' }}>
                        {props.title}
                    </Title>
                </CardTitle>
            </CardHeader>
            <Divider />
            <CardBody>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                    <RisksGauge risks={props.risks} />
                    <div style={{ alignSelf: 'center' }}>
                        <PolicyRiskLabels
                            risks={props.risks}
                            isVertical
                            showLabels
                            singular={props.singular}
                            plural={props.plural}
                        />
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}

export function RisksIcon(props: { risks: IPolicyRisks }) {
    if (props.risks.high > 0) {
        return (
            <span style={{ color: red }}>
                <ChevronCircleUpIcon />
            </span>
        )
    }

    if (props.risks.medium > 0) {
        return (
            <span style={{ color: orange }}>
                <MinusCircleIcon />
            </span>
        )
    }

    if (props.risks.low > 0) {
        return (
            <span style={{ color: yellow }}>
                <ChevronCircleDownIcon />
            </span>
        )
    }

    if (props.risks.unknown > 0) {
        return (
            <span style={{ color: grey }}>
                <QuestionCircleIcon />
            </span>
        )
    }

    if (props.risks.synced > 0) {
        return (
            <span style={{ color: green }}>
                <CheckCircleIcon />
            </span>
        )
    }

    return <OutlinedCircleIcon color="lightgrey" style={{ opacity: 0 }} />
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
