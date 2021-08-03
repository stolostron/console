/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlertInfo } from '@open-cluster-management/ui-components'
import {
    Card,
    CardBody,
    EmptyState,
    EmptyStateBody,
    EmptyStatePrimary,
    PageSection,
    Title,
} from '@patternfly/react-core'
import { ReactNode } from 'react'
import { ResourceError, ResourceErrorCode } from '../lib/resource-request'

export function getErrorInfo(error: unknown): AcmAlertInfo {
    let title = 'Error'
    let message = 'Unknown'
    if (error instanceof ResourceError) {
        /* istanbul ignore next */
        switch (error.code) {
            case ResourceErrorCode.BadGateway:
                title = 'Bad gateway'
                message = 'Unable to communicate with the server because of a bad gateway.'
                break
            case ResourceErrorCode.BadRequest:
                title = 'Bad request'
                message = 'Could not process request because of invalid data.'
                break
            case ResourceErrorCode.Conflict:
                title = 'Conflict'
                message = 'Unable to update the resource because of a resource conflict.'
                break
            case ResourceErrorCode.UnprocessableEntity:
                title = 'Unprocessable entity'
                message = error.message
                break
            case ResourceErrorCode.ConnectionReset:
                title = 'Connection reset'
                message = 'Unable to communicate with the server because the network connection was reset.'
                break
            case ResourceErrorCode.Forbidden:
                title = 'Forbidden'
                message =
                    'You are not authorized to complete this action. See your cluster administrator for role-based access control information.'
                break
            case ResourceErrorCode.GatewayTimeout:
                title = 'Gateway timeout'
                message = 'Unable to communicate with the server due to a gateway timeout.'
                break
            case ResourceErrorCode.InternalServerError:
                title = 'Internal server error'
                message = 'Unable to communicate with the server because of an unforseen error.'
                break
            case ResourceErrorCode.NetworkError:
                title = 'Network error'
                message = 'Unable to communicate with the server because of a network error.'
                break
            case ResourceErrorCode.NotFound:
                title = 'Not found'
                message = 'The resource was not found.'
                break
            case ResourceErrorCode.NotImplemented:
                title = 'Not implemented'
                message = 'The resource access is not implemented.'
                break
            case ResourceErrorCode.RequestAborted:
                title = 'Request cancelled'
                message = 'The request was cancelled.'
                break
            case ResourceErrorCode.ServiceUnavailable:
                title = 'Service unavilable'
                message = 'Unable to communicate with the server because the service is unavailable.'
                break
            case ResourceErrorCode.Timeout:
                title = 'Timeout'
                message = 'Failed to communicate with the server because of a network timeout.'
                break
            case ResourceErrorCode.TooManyRequests:
                title = 'Too many requests'
                message = 'Request failed because of too many requests. Please retry.'
                break
            case ResourceErrorCode.Unauthorized:
                title = 'Unauthorized'
                message = 'You are not authorized to perform this operation.'
                break
            case ResourceErrorCode.Unknown:
                title = 'Unknown error'
                message = 'An unknown error occurred.'
                break
            default:
                title = 'Unknown error'
                message = 'An unknown error occurred.'
                break
        }
    } else if (error instanceof Error) {
        message = error.message
    } else if (typeof error === 'string') {
        message = error
    }

    return { type: 'danger', title, message }
}

export function ErrorState(props: { error: Error; actions?: ReactNode }) {
    const errorInfo = getErrorInfo(props.error)
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
