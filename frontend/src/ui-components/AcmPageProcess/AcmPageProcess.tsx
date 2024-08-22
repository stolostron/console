/* Copyright Contributors to the Open Cluster Management project */

import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Title,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core'
import { css } from '@emotion/css'
import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmLoadingPage } from '../AcmLoadingPage/AcmLoadingPage'
import { TrashIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../lib/acm-i18next'

const container = css({
  '& .pf-c-card': {
    height: '100vh',
  },
})
const body = css({
  maxWidth: '335px',
  margin: '0 auto',
})

export type AcmPageProccessProps = {
  isLoading: boolean
  loadingTitle?: string | React.ReactNode
  loadingMessage?: string | React.ReactNode
  loadingPrimaryAction?: React.ReactNode
  loadingSecondaryActions?: React.ReactNode
  successTitle?: string | React.ReactNode
  successMessage?: string | React.ReactNode
  successAction?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
}

export function AcmPageProcess(props: AcmPageProccessProps) {
  const { t } = useTranslation()

  if (props.isLoading) {
    return (
      <div className={container}>
        <AcmLoadingPage
          title={props.loadingTitle}
          message={props.loadingMessage}
          primaryAction={props.loadingPrimaryAction}
          secondaryActions={props.loadingSecondaryActions}
        />
      </div>
    )
  }

  return (
    <div className={container}>
      <AcmPageCard>
        <EmptyState>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <EmptyStateHeader icon={<EmptyStateIcon icon={TrashIcon} />} />
          <EmptyStateFooter>
            <div className={body}>
              <Title size="lg" headingLevel="h4">
                {props.successTitle ?? t('Success')}
              </Title>
              <EmptyStateBody>{props.successMessage}</EmptyStateBody>
            </div>
            {props.primaryAction}
            <EmptyStateActions>{props.secondaryActions}</EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </AcmPageCard>
    </div>
  )
}
