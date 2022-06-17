/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateSecondaryActions,
    Spinner,
    Title,
} from '@patternfly/react-core'


const useStyles = makeStyles({
    max: {
        maxWidth: '335px',
    },
})

export function AcmLoadingPage(props: {
    title?: string | React.ReactNode
    message?: string | React.ReactNode
    primaryAction?: React.ReactNode
    secondaryActions?: React.ReactNode
}) {
    const classes = useStyles()
    return (
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
    )
}
