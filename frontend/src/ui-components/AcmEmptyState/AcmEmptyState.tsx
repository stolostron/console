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
  ) : (
    <LoadingPage />
  )
}
