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
import React from 'react'

export interface ErrorPageProps {
    error: Error
}

export function ErrorPage(props: ErrorPageProps) {
    // const { error } = props
    // if (error.networkError?.name === 'ServerParseError') {
    //     const serverParseError = error.networkError as ServerParseError
    //     if (serverParseError.statusCode === 401) {
    //         window.location.href = `${process.env.REACT_APP_BACKEND}/login`
    //         return <></>
    //     }
    // }
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
                        <EmptyStateBody>{props.error.message}</EmptyStateBody>
                    </EmptyState>
                </CardBody>
                <CardFooter></CardFooter>
            </Card>
        </PageSection>
    )
}
