/* Copyright Contributors to the Open Cluster Management project */

import { ResourceError, ResourceErrorCode } from '../resources'
import { AcmAlertInfo } from '../ui-components'
import {
  Card,
  CardBody,
  EmptyState,
  EmptyStateBody,
  EmptyStatePrimary,
  ExpandableSection,
  PageSection,
  Title,
} from '@patternfly/react-core'
import { ReactNode } from 'react'
import { TFunction } from 'i18next'
import { useTranslation } from '../lib/acm-i18next'

export function getRawErrorInfo(error: unknown, t: TFunction): { title: string; message: string; details?: string } {
  let title = t('Error')
  let message = t('Unknown')
  let details
  if (error instanceof ResourceError) {
    /* istanbul ignore next */
    switch (error.code) {
      case ResourceErrorCode.BadGateway:
        title = t('Bad gateway')
        message = t('Unable to communicate with the server because of a bad gateway.')
        break
      case ResourceErrorCode.BadRequest:
        title = t('Bad request')
        message = t('Could not process request because of invalid data.')

        break
      case ResourceErrorCode.Conflict:
        title = t('Conflict')
        message = t('Unable to update the resource because of a resource conflict.')
        break
      case ResourceErrorCode.UnprocessableEntity:
        title = t('Unprocessable entity')
        message = error.message
        break
      case ResourceErrorCode.ConnectionReset:
        title = t('Connection reset')
        message = t('Unable to communicate with the server because the network connection was reset.')
        break
      case ResourceErrorCode.Forbidden:
        title = t('Forbidden')
        message = t(
          'You are not authorized to complete this action.  See your cluster administrator for role-based access control information.'
        )
        break
      case ResourceErrorCode.GatewayTimeout:
        title = t('Gateway timeout')
        message = t('Unable to communicate with the server due to a gateway timeout.')
        break
      case ResourceErrorCode.InternalServerError:
        title = t('Internal server error')
        message = t('Unable to communicate with the server because of an unexpected error.')
        break
      case ResourceErrorCode.NetworkError:
        title = t('Network error')
        message = t('Unable to communicate with the server because of a network error.')
        break
      case ResourceErrorCode.NotFound:
        title = t('Not found')
        message = t('The resource was not found.')
        break
      case ResourceErrorCode.NotImplemented:
        title = t('Not implemented')
        message = t('The resource access is not implemented.')
        break
      case ResourceErrorCode.RequestAborted:
        title = t('Request cancelled')
        message = t('The request was cancelled.')
        break
      case ResourceErrorCode.ServiceUnavailable:
        title = t('Service unavailable')
        message = t('Unable to communicate with the server because the service is unavailable.')
        break
      case ResourceErrorCode.Timeout:
        title = t('Timeout')
        message = t('Failed to communicate with the server because of a network timeout.')
        break
      case ResourceErrorCode.TooManyRequests:
        title = t('Too many requests')
        message = t('Request failed because of too many requests. Please retry.')
        break
      case ResourceErrorCode.Unauthorized:
        title = t('Unauthorized')
        message = t('You are not authorized to perform this operation.')
        break
      case ResourceErrorCode.Unknown:
        title = t('Unknown error')
        message = t('An unknown error occurred.')
        break
      default:
        title = t('Unknown error')
        message = t('An unknown error occurred.')
        break
    }
    details = error.message
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }

  return { title, message, details }
}

export function getErrorInfo(error: unknown, t: TFunction): AcmAlertInfo {
  const { title, message, details } = getRawErrorInfo(error, t)
  const actions = details ? (
    <ExpandableSection isWidthLimited toggleText={t('Details')}>
      {details}
    </ExpandableSection>
  ) : undefined

  return { type: 'danger', title, message, actions }
}

export function ErrorState(props: { error: Error; actions?: ReactNode }) {
  const { t } = useTranslation()
  const errorInfo = getErrorInfo(props.error, t)
  return (
    <EmptyState>
      <Title size="lg" headingLevel="h4">
        {errorInfo.title}
      </Title>
      <EmptyStateBody>{errorInfo.message}</EmptyStateBody>
      {props.actions && <EmptyStatePrimary>{props.actions}</EmptyStatePrimary>}
    </EmptyState>
  )
}

export function ErrorPage(props: { error: Error; actions?: ReactNode }) {
  return (
    <PageSection>
      <Card>
        <CardBody>
          <ErrorState {...props} />
        </CardBody>
      </Card>
    </PageSection>
  )
}
