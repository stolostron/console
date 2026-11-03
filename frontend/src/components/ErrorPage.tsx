/* Copyright Contributors to the Open Cluster Management project */

import { ResourceError, ResourceErrorCode } from '../resources/utils'
import { AcmAlertInfo } from '../ui-components'
import {
  Card,
  CardBody,
  EmptyState,
  EmptyStateBody,
  ExpandableSection,
  PageSection,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core'
import { ReactNode, useContext } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from '../lib/acm-i18next'
import { LoadingPage } from './LoadingPage'
import { PluginContext } from '../lib/PluginContext'

function isResourceError(error: unknown): error is ResourceError {
  return typeof ResourceError === 'function' && error instanceof ResourceError
}

export function isAccessRestrictedError(error: unknown): boolean {
  if (isResourceError(error)) {
    return error.code === ResourceErrorCode.Forbidden || error.code === ResourceErrorCode.Unauthorized
  }
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return /forbidden|unauthorized|permission denied|access is denied/i.test(message)
}

/** Coerce string/Error RBAC failures into ResourceError so shared copy/styling applies. */
export function normalizeAccessRestrictedError(error: unknown): unknown {
  if (isResourceError(error) || !isAccessRestrictedError(error)) {
    return error
  }
  const message = error instanceof Error ? error.message : String(error)
  if (typeof ResourceError !== 'function') {
    return error
  }
  return new ResourceError(ResourceErrorCode.Forbidden, message)
}

export function getRawErrorInfo(error: unknown, t: TFunction): { title: string; message: string; details?: string } {
  let title = t('Error')
  let message = t('Unknown')
  let details
  if (isResourceError(error)) {
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
        title = t('Access Restricted')
        message = t(
          'You do not have the required permissions to perform this action. Please contact your OpenShift administrator if you need access to this resource.'
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
        title = t('Access Restricted')
        message = t(
          'You do not have the required permissions to perform this action. Please contact your OpenShift administrator if you need access to this resource.'
        )
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
  } else if (isAccessRestrictedError(error)) {
    title = t('Access Restricted')
    message = t(
      'You do not have the required permissions to perform this action. Please contact your OpenShift administrator if you need access to this resource.'
    )
    details = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }

  return { title, message, details }
}

export function getErrorInfo(error: unknown, t: TFunction): AcmAlertInfo {
  const normalized = normalizeAccessRestrictedError(error)
  const { title, message, details } = getRawErrorInfo(normalized, t)
  const actions = details ? (
    <ExpandableSection isWidthLimited toggleText={t('Details')}>
      {details}
    </ExpandableSection>
  ) : undefined

  return {
    type: isAccessRestrictedError(normalized) ? 'warning' : 'danger',
    title,
    message,
    actions,
  }
}

export function ErrorState(props: { error: Error; actions?: ReactNode }) {
  const { t } = useTranslation()
  const errorInfo = getErrorInfo(props.error, t)
  return (
    <EmptyState headingLevel="h4" titleText={<>{errorInfo.title}</>}>
      <EmptyStateBody>{errorInfo.message}</EmptyStateBody>
      <EmptyStateFooter>{props.actions && <EmptyStateActions>{props.actions}</EmptyStateActions>}</EmptyStateFooter>
    </EmptyState>
  )
}

export function ErrorPage(props: { error: Error; actions?: ReactNode }) {
  const { dataContext } = useContext(PluginContext)
  const { loadCompleted } = useContext(dataContext)
  return loadCompleted ? (
    <PageSection hasBodyWrapper={false}>
      <Card>
        <CardBody>
          <ErrorState {...props} />
        </CardBody>
      </Card>
    </PageSection>
  ) : (
    <LoadingPage />
  )
}
