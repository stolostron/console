/* Copyright Contributors to the Open Cluster Management project */

import {
  EmptyState,
  EmptyStateBody,
  EmptyStatePrimary,
  EmptyStateVariant,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core'
import { ReactNode } from 'react'
import Folder from '../assets/Folder.png'

import { CubesIcon } from '@patternfly/react-icons'

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
      <EmptyStateIcon icon={CubesIcon}></EmptyStateIcon>
      <Title headingLevel="h4" size="lg">
        {props.title}
      </Title>
      <EmptyStateBody>{props.message}</EmptyStateBody>
      <EmptyStatePrimary>{props.action}</EmptyStatePrimary>
      {/* <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions> */}
    </EmptyState>
  )
}
