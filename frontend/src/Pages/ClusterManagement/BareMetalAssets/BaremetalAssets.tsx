import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    EmptyState,
    EmptyStateBody,
    EmptyStateVariant,
    Page,
    PageSection,
    SearchInput,
    Split,
    SplitItem,
    Title,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
} from '@patternfly/react-core'
import React from 'react'
import { ClusterManagementPageHeader } from '../ClusterManagement'

export function BaremetalAssetsPage() {
    return (
        <Page>
            <ClusterManagementPageHeader />
            <BaremetalAssets />
        </Page>
    )
}

export function BaremetalAssets() {
    // const { loading, error, data } = useManagedClustersQuery({ client: apolloClient, pollInterval: 10 * 1000 })
    // if (loading) {
    //     return <LoadingPage />
    // } else if (error) {
    //     return <ErrorPage error={error} />
    // } else if (!data?.managedClusters || data.managedClusters.length === 0) {
    //     return <EmptyPage />
    // }
    return <BaremetalAssetsTable></BaremetalAssetsTable>
}

export function BaremetalAssetsTable(props: { baremetalAssets?: unknown[] }) {
    return (
        <React.Fragment>
            {/* <PageSection variant={PageSectionVariants.light}>
                <TextContent>
                    <Text component="h1">Bare-metal Assets</Text>
                </TextContent>
            </PageSection> */}
            <PageSection>
                <Card>
                    <CardHeader>
                        {props.baremetalAssets ? (
                            <Split>
                                <SplitItem>
                                    <Toolbar>
                                        <ToolbarContent>
                                            <ToolbarItem>
                                                <SearchInput placeholder="Search" />
                                            </ToolbarItem>
                                        </ToolbarContent>
                                    </Toolbar>
                                </SplitItem>
                                <SplitItem isFilled></SplitItem>
                                <SplitItem>
                                    <Toolbar>
                                        <ToolbarContent>
                                            <ToolbarItem>
                                                <Button>Create asset</Button>
                                            </ToolbarItem>
                                        </ToolbarContent>
                                    </Toolbar>
                                </SplitItem>
                            </Split>
                        ) : (
                            <></>
                        )}
                    </CardHeader>
                    <CardBody>
                        {!props.baremetalAssets ? (
                            <EmptyState variant={EmptyStateVariant.xl}>
                                <Title size="4xl" headingLevel="h5">
                                    No bare-metal assets found.
                                </Title>
                                <EmptyStateBody>Your cluster does not contain any bare-metal assets.</EmptyStateBody>
                            </EmptyState>
                        ) : (
                            <></>
                        )}
                    </CardBody>
                    <CardFooter>
                        <Split>
                            <SplitItem isFilled></SplitItem>
                            <SplitItem>
                                <Toolbar>
                                    <ToolbarContent>
                                        <ToolbarItem>
                                            <Button>Create asset</Button>
                                        </ToolbarItem>
                                    </ToolbarContent>
                                </Toolbar>
                            </SplitItem>
                            <SplitItem isFilled></SplitItem>
                        </Split>
                    </CardFooter>
                </Card>
            </PageSection>
        </React.Fragment>
    )
}
