import React from 'react'
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    PageSection,
    Title,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon'
import { ApolloError } from '@apollo/client'
import { ServerParseError } from '@apollo/client'

export interface ErrorPageProps {
    error: ApolloError
}

export function ErrorPage(props: ErrorPageProps) {
    const { error } = props
    if (error.networkError?.name === 'ServerParseError') {
        const serverParseError = error.networkError as ServerParseError
        if (serverParseError.statusCode === 401) {
            window.location.href = `${process.env.REACT_APP_BACKEND}/login`
            return <></>
        }
    }
    return (
        <PageSection>
            <Card>
                <CardHeader></CardHeader>
                <CardBody>
                    <EmptyState>
                        <EmptyStateIcon icon={ExclamationCircleIcon} />
                        <Title size="lg" headingLevel="h4">
                            Error
                        </Title>
                        <EmptyStateBody>{JSON.stringify(error)}</EmptyStateBody>
                    </EmptyState>
                </CardBody>
                <CardFooter></CardFooter>
            </Card>
        </PageSection>
    )
}
