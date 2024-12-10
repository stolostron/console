/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Spinner,
  Title,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'

const max = css({
  maxWidth: '335px',
})

export function AcmLoadingPage(props: {
  title?: string | React.ReactNode
  message?: string | React.ReactNode
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <EmptyState>
      <EmptyStateHeader icon={<EmptyStateIcon icon={Spinner} />} />
      <EmptyStateFooter>
        <div className={max}>
          <Title size="lg" headingLevel="h4">
            {props.title ?? t('Loading')}
          </Title>
          <EmptyStateBody>{props.message}</EmptyStateBody>
        </div>
        {props.primaryAction}
        <EmptyStateActions>{props.secondaryActions}</EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  )
}
