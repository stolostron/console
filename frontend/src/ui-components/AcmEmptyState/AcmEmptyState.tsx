/* Copyright Contributors to the Open Cluster Management project */

import {
  EmptyState,
  EmptyStateBody,
  EmptyStatePrimary,
  EmptyStateVariant,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core'
import { ReactNode, useContext } from 'react'
import { CubesIcon, SearchIcon } from '@patternfly/react-icons'
import { LoadingPage } from '../../components/LoadingPage'
import { PluginContext } from '../../lib/PluginContext'

export function AcmEmptyState(props: {
  title: string
  message?: string | ReactNode
  action?: ReactNode
  showSearchIcon?: boolean
  ignoreLoading?: boolean
}) {
  const { dataContext } = useContext(PluginContext)
  const { loadCompleted } = useContext(dataContext)

  return loadCompleted || props.ignoreLoading ? (
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
  ) : (
    <LoadingPage />
  )
}
