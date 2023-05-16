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
import { CubesIcon, SearchIcon } from '@patternfly/react-icons'

export function AcmEmptyState(props: {
  title: string
  message?: string | ReactNode
  action?: ReactNode
  showSearchIcon?: boolean
}) {
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      {props.showSearchIcon ? (
        <EmptyStateIcon icon={SearchIcon}></EmptyStateIcon>
      ) : (
        <EmptyStateIcon icon={CubesIcon}></EmptyStateIcon>
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
