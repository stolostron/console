/* Copyright Contributors to the Open Cluster Management project */

import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from '@patternfly/react-core'
import { CubesIcon, SearchIcon } from '@patternfly/react-icons'
import { ReactNode, useContext } from 'react'
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
    <EmptyState
      headingLevel="h4"
      titleText={<>{props.title}</>}
      variant={EmptyStateVariant.lg}
      icon={props.showSearchIcon ? SearchIcon : CubesIcon}
    >
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
