/* Copyright Contributors to the Open Cluster Management project */

import { EmptyState, EmptyStateBody, EmptyStateSecondaryActions, Title } from '@patternfly/react-core'
import { makeStyles } from '@mui/styles'
import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmLoadingPage } from '../AcmLoadingPage/AcmLoadingPage'
import { TrashIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../lib/acm-i18next'

const useStyles = makeStyles({
  container: {
    '& .pf-c-card': {
      height: '100vh',
    },
  },
  body: {
    maxWidth: '335px',
    margin: '0 auto',
  },
  image: {
    width: '323px',
    height: '223px',
    marginBottom: '32px',
  },
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
  const classes = useStyles()
  const { t } = useTranslation()

  if (props.isLoading) {
    return (
      <div className={classes.container}>
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
    <div className={classes.container}>
      <AcmPageCard>
        <EmptyState>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <TrashIcon size="xl" />
          <div className={classes.body}>
            <Title size="lg" headingLevel="h4">
              {props.successTitle ?? t('Success')}
            </Title>
            <EmptyStateBody>{props.successMessage}</EmptyStateBody>
          </div>
          {props.primaryAction}
          <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions>
        </EmptyState>
      </AcmPageCard>
    </div>
  )
}
