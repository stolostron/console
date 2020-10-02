import { Card, CardBody, Page, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React, { ReactNode } from 'react'

export function AcmPage(props: { children: ReactNode }) {
    return <Page> {props.children}</Page>
}

export function AcmPageHeader(props: { title: string }) {
    return (
        <PageSection variant={PageSectionVariants.light}>
            <TextContent>
                <Text component="h1">{props.title}</Text>
            </TextContent>
        </PageSection>
    )
}

export function AcmPageCard(props: { children: ReactNode }) {
    return (
        <PageSection>
            <Card>
                <CardBody>{props.children}</CardBody>
            </Card>
        </PageSection>
    )
}
