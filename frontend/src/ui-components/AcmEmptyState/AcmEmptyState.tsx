/* Copyright Contributors to the Open Cluster Management project */

import { EmptyState, EmptyStateBody, EmptyStatePrimary, EmptyStateVariant, Title } from '@patternfly/react-core'
import { ReactNode } from 'react'
import emptyPagePng from '../assets/EmptyPageIcon.png'
import emptyTablePng from '../assets/EmptyTableIcon.png'
import Folder from '../assets/Folder.png'

export enum AcmEmptyStateImage {
    folder = Folder,
}

export function AcmEmptyState(props: {
    title: string
    message?: string | ReactNode
    action?: ReactNode
    showIcon?: boolean
    image?: AcmEmptyStateImage
    isEmptyTableState?: boolean
}) {
    return (
        <EmptyState variant={EmptyStateVariant.large}>
            {props.showIcon !== false && (
                <img
                    src={props.image ?? (props.isEmptyTableState ? emptyTablePng : emptyPagePng)}
                    style={{ width: props.isEmptyTableState ? '65%' : '50%' }}
                    alt="Empty state"
                />
            )}
            <Title headingLevel="h4" size="lg">
                {props.title}
            </Title>
            <EmptyStateBody>{props.message}</EmptyStateBody>
            <EmptyStatePrimary>{props.action}</EmptyStatePrimary>
            {/* <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions> */}
        </EmptyState>
    )
}
