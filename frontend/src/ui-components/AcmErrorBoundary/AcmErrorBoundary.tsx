/* Copyright Contributors to the Open Cluster Management project */

import {
    Card,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    EmptyStateBody,
    ExpandableSection,
    Title,
    TitleSizes,
    ClipboardCopy,
    ClipboardCopyVariant,
    Bullseye,
} from '@patternfly/react-core'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { withStyles, Styles } from '@mui/styles'
import { Component } from 'react'

type ErrorBoundaryStyles = {
    card: string
    emptyState: string
    actions: string
    emptyStateBody: string
    errorTitle: string
    section: string
    sectionTitle: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: Styles<any, any, string> = {
    card: {
        margin: '24px',
    },
    emptyState: {
        height: '100%',
        width: '100%',
        maxWidth: 'unset',
        '& .pf-c-empty-state__content': {
            width: '100%',
            maxWidth: 'unset',
        },
    },
    actions: {
        marginBottom: '12px',
    },
    emptyStateBody: {
        textAlign: 'left',
    },
    errorTitle: {
        marginBottom: '12px',
    },
    section: {
        marginBottom: '24px',
    },
    sectionTitle: {
        marginBottom: '8px',
    },
}

type ErrorBoundaryState = {
    hasError: boolean
    error: Error
    errorInfo: ErrorInfo
}

type ErrorInfo = {
    componentStack: string
}

class ErrorBoundary extends Component<
    { children: React.ReactNode | React.ReactNode[]; actions?: React.ReactNode; classes: ErrorBoundaryStyles },
    ErrorBoundaryState
> {
    state = {
        hasError: false,
        error: {
            message: '',
            stack: '',
            name: '',
        },
        errorInfo: {
            componentStack: '',
        },
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ error, errorInfo, hasError: true })
    }

    render() {
        const { classes } = this.props
        if (this.state.hasError) {
            return (
                <Card className={classes.card}>
                    <EmptyState className={classes.emptyState} variant={EmptyStateVariant.large}>
                        <EmptyStateIcon icon={ExclamationTriangleIcon} />
                        <Title headingLevel="h4" size={TitleSizes['2xl']}>
                            Uh oh, something went wrong...
                        </Title>
                        <EmptyStateBody className={classes.emptyStateBody}>
                            <Bullseye className={classes.actions}>{this.props.actions}</Bullseye>
                            <ExpandableSection toggleText="See error details...">
                                <div className={classes.errorTitle}>
                                    <Title headingLevel="h5" size={TitleSizes.xl}>
                                        {this.state.error.name}
                                    </Title>
                                </div>

                                <div className={classes.section}>
                                    <Title headingLevel="h6" size={TitleSizes.lg} className={classes.sectionTitle}>
                                        Description:
                                    </Title>
                                    <p>{this.state.error.message}</p>
                                </div>

                                <div className={classes.section}>
                                    <Title headingLevel="h6" size={TitleSizes.lg} className={classes.sectionTitle}>
                                        Component trace:
                                    </Title>
                                    <ClipboardCopy
                                        isReadOnly
                                        isCode
                                        isExpanded
                                        variant={ClipboardCopyVariant.expansion}
                                    >
                                        {this.state.errorInfo.componentStack}
                                    </ClipboardCopy>
                                </div>

                                <div className={classes.section}>
                                    <Title headingLevel="h6" size={TitleSizes.lg} className={classes.sectionTitle}>
                                        Stack trace:
                                    </Title>
                                    <ClipboardCopy
                                        isReadOnly
                                        isCode
                                        isExpanded
                                        variant={ClipboardCopyVariant.expansion}
                                    >
                                        {this.state.error.stack}
                                    </ClipboardCopy>
                                </div>
                            </ExpandableSection>
                        </EmptyStateBody>
                    </EmptyState>
                </Card>
            )
        }

        return this.props.children
    }
}

export const AcmErrorBoundary = withStyles(styles)(ErrorBoundary)
