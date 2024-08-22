/* Copyright Contributors to the Open Cluster Management project */

import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
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
    <EmptyState variant={EmptyStateVariant.lg}>
      {props.showSearchIcon ? (
        <EmptyStateIcon icon={SearchIcon}></EmptyStateIcon>
      ) : (
        <EmptyStateIcon icon={CubesIcon}></EmptyStateIcon>
      )}
      <EmptyStateHeader titleText={<>{props.title}</>} headingLevel="h4" />
      <EmptyStateBody>{props.message}</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>{props.action}</EmptyStateActions>
        {/* <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions> */}
      </EmptyStateFooter>
    </EmptyState>
  )
}
