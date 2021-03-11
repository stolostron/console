/* Copyright Contributors to the Open Cluster Management project */

import {
    EmptyState,
    EmptyStateIcon,
    EmptyStateBody,
    EmptyStateSecondaryActions,
    Title,
    Spinner,
    PageSection,
} from '@patternfly/react-core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
    max: {
        maxWidth: '335px',
    },
})

export function LoadingPage(props: {
    title?: string | React.ReactNode
    message?: string | React.ReactNode
    primaryAction?: React.ReactNode
    secondaryActions?: React.ReactNode
}) {
    const classes = useStyles()
    return (
        <PageSection variant="light" isFilled>
            <EmptyState>
                <EmptyStateIcon variant="container" component={Spinner} />
                <div className={classes.max}>
                    <Title size="lg" headingLevel="h4">
                        {props.title ?? 'Loading'}
                    </Title>
                    <EmptyStateBody>{props.message}</EmptyStateBody>
                </div>
                {props.primaryAction}
                <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions>
            </EmptyState>
        </PageSection>
    )
}
