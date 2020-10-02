import React from 'react'
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    EmptyState,
    EmptyStateBody,
    EmptyStateVariant,
    PageSection,
    Split,
    SplitItem,
    Title,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
} from '@patternfly/react-core'

export interface EmptyPageProps {
    title: string
    message: string
    action?: string
}
export function EmptyPage(props: EmptyPageProps) {
    return (
        <PageSection>
            <Card>
                <CardHeader></CardHeader>
                <CardBody>
                    <EmptyState variant={EmptyStateVariant.xl}>
                        <Title size="4xl" headingLevel="h5">
                            {props.title}
                        </Title>
                        <EmptyStateBody>{props.message}</EmptyStateBody>
                        <EmptyStateBody>
                            {props.action ? (
                                <Split>
                                    <SplitItem isFilled></SplitItem>
                                    <SplitItem>
                                        <Toolbar>
                                            <ToolbarContent>
                                                <ToolbarItem>
                                                    <Button>{props.action}</Button>
                                                </ToolbarItem>
                                            </ToolbarContent>
                                        </Toolbar>
                                    </SplitItem>
                                    <SplitItem isFilled></SplitItem>
                                </Split>
                            ) : (
                                <></>
                            )}
                        </EmptyStateBody>
                    </EmptyState>
                </CardBody>
                <CardFooter></CardFooter>
            </Card>
        </PageSection>
    )
}
