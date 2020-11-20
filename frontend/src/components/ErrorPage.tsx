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

export function ErrorState(props: { error: Error; actions?: ReactNode }) {
    let errorTitle = 'Error'
    let errorMessage = props.error.message
    if (props.error instanceof ResourceError) {
        switch (props.error.code) {
            case ResourceErrorCode.BadGateway:
                errorTitle = 'Bad gateway'
                errorMessage = 'Error accessing resources due to a bad gateway.'
                break
            case ResourceErrorCode.BadRequest:
                errorTitle = 'Bad request'
                errorMessage = 'There was bad data sent for accessing resources.'
                break
            case ResourceErrorCode.Conflict:
                errorTitle = 'Conflict'
                errorMessage = 'There was a conflict when updating the resources.'
                break
            case ResourceErrorCode.ConnectionReset:
                errorTitle = 'Connection reset'
                errorMessage = 'The network connection was reset when accessing resources.'
                break
            case ResourceErrorCode.Forbidden:
                errorTitle = 'Forbidden'
                errorMessage = 'Access to the resources is forbidden.'
                break
            case ResourceErrorCode.GatewayTimeout:
                errorTitle = 'Gateway timeout'
                errorMessage = 'Error accessing resources due to a gateway timeout.'
                break
            case ResourceErrorCode.InternalServerError:
                errorTitle = 'Internal server error'
                errorMessage = 'There was an unforseen error when accessing resources.'
                break
            case ResourceErrorCode.NetworkError:
                errorTitle = 'Network error'
                errorMessage = 'There was a network error when accessing resources.'
                break
            case ResourceErrorCode.NotFound:
                errorTitle = 'Not found'
                errorMessage = 'The resource being accessed was not found.'
                break
            case ResourceErrorCode.NotImplemented:
                errorTitle = 'Not implemented'
                errorMessage = 'The resource access is not implemented.'
                break
            case ResourceErrorCode.RequestCancelled:
                errorTitle = 'Request cancelled'
                errorMessage = 'The resource access was cancelled.'
                break
            case ResourceErrorCode.ServiceUnavailable:
                errorTitle = 'Service unavilable'
                errorMessage = 'Error accessing resources due to the service being unavailable.'
                break
            case ResourceErrorCode.Timeout:
                errorTitle = 'Timeout'
                errorMessage = 'Error accessing resources due to a network timeout.'
                break
            case ResourceErrorCode.TooManyRequests:
                errorTitle = 'Too many requests'
                errorMessage = 'Error accessing resources due to too many requests for resources.'
                break
            case ResourceErrorCode.Unauthorized:
                errorTitle = 'Unauthorized'
                errorMessage = 'You are not authorized to perform this operation. Authorization needed.'
                break
            case ResourceErrorCode.Unknown:
                errorTitle = 'Unknown error'
                errorMessage = 'An unknown error occurred.'
                break
            default:
                errorTitle = 'Unknown error'
                errorMessage = 'An unknown error occurred.'
                break
        }
    }
    return (
        <EmptyState>
            <Title size="lg" headingLevel="h4">
                {errorTitle}
            </Title>
            <EmptyStateBody>{errorMessage}</EmptyStateBody>
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
