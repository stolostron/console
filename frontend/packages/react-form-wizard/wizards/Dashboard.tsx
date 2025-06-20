import { Card, CardBody, CardTitle, Page, PageSection, Stack, Text, Title } from '@patternfly/react-core'
import { ReactNode } from 'react'
import { useHistory } from 'react-router-dom'
import { Masonry } from './common/Masonry'
import { RouteE } from './Routes'

export function DashboardCard(props: { title: string; children?: ReactNode; route: RouteE }) {
    const history = useHistory()
    return (
        <Card onClick={() => history.push(props.route)} isSelectable isRounded isLarge isFlat style={{ transition: 'box-shadow 400ms' }}>
            <CardTitle>{props.title}</CardTitle>
            {props.children && <CardBody>{props.children}</CardBody>}
        </Card>
    )
}

export function DashboardPage(props: { title: string; description?: string; children?: ReactNode }) {
    return (
        <Page
            additionalGroupedContent={
                <PageSection variant="light">
                    <Stack hasGutter>
                        <Stack>
                            <Title headingLevel="h2">{props.title}</Title>
                            {props.description && <Text>{props.description}</Text>}
                        </Stack>
                    </Stack>
                </PageSection>
            }
            groupProps={{ stickyOnBreakpoint: { default: 'top' } }}
        >
            <PageSection isWidthLimited variant="light">
                <Masonry size={300}>{props.children}</Masonry>
            </PageSection>
        </Page>
    )
}
