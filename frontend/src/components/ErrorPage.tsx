import {
    Card,
    CardBody,
    EmptyState,
    EmptyStateBody,
    EmptyStatePrimary,
    PageSection,
    Title,
} from '@patternfly/react-core'
import React, { ReactNode } from 'react'
import { ResourceError, ResourceErrorCode } from '../lib/resource-request'

export function getErrorInfo(error: unknown) {
    let title = 'Error'
    let message = 'Unknown'
    if (error instanceof ResourceError) {
        /* istanbul ignore next */
        switch (error.code) {
            case ResourceErrorCode.BadGateway:
                title = 'Bad gateway'
                message = 'Error accessing resources due to a bad gateway.'
                break
            case ResourceErrorCode.BadRequest:
                title = 'Bad request'
                message = 'There was bad data sent for accessing resources.'
                break
            case ResourceErrorCode.Conflict:
                title = 'Conflict'
                message = 'There was a conflict when updating the resources.'
                break
            case ResourceErrorCode.ConnectionReset:
                title = 'Connection reset'
                message = 'The network connection was reset when accessing resources.'
                break
            case ResourceErrorCode.Forbidden:
                title = 'Forbidden'
                message = 'Access to the resources is forbidden.'
                break
            case ResourceErrorCode.GatewayTimeout:
                title = 'Gateway timeout'
                message = 'Error accessing resources due to a gateway timeout.'
                break
            case ResourceErrorCode.InternalServerError:
                title = 'Internal server error'
                message = 'There was an unforseen error when accessing resources.'
                break
            case ResourceErrorCode.NetworkError:
                title = 'Network error'
                message = 'There was a network error when accessing resources.'
                break
            case ResourceErrorCode.NotFound:
                title = 'Not found'
                message = 'The resource being accessed was not found.'
                break
            case ResourceErrorCode.NotImplemented:
                title = 'Not implemented'
                message = 'The resource access is not implemented.'
                break
            case ResourceErrorCode.RequestCancelled:
                title = 'Request cancelled'
                message = 'The resource access was cancelled.'
                break
            case ResourceErrorCode.ServiceUnavailable:
                title = 'Service unavilable'
                message = 'Error accessing resources due to the service being unavailable.'
                break
            case ResourceErrorCode.Timeout:
                title = 'Timeout'
                message = 'Error accessing resources due to a network timeout.'
                break
            case ResourceErrorCode.TooManyRequests:
                title = 'Too many requests'
                message = 'Error accessing resources due to too many requests for resources.'
                break
            case ResourceErrorCode.Unauthorized:
                title = 'Unauthorized'
                message = 'You are not authorized to perform this operation. Authorization needed.'
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

    return { title, message }
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
