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
import { useTranslation } from '../../lib/acm-i18next'

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
    const { t } = useTranslation()
    return (
        <EmptyState>
            <EmptyStateIcon variant="container" component={Spinner} />
            <div className={classes.max}>
                <Title size="lg" headingLevel="h4">
                    {props.title ?? t('Loading')}
                </Title>
                <EmptyStateBody>{props.message}</EmptyStateBody>
            </div>
            {props.primaryAction}
            <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions>
        </EmptyState>
    )
}
