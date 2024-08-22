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
  EmptyStateHeader,
} from '@patternfly/react-core'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { css } from '@emotion/css'
import { Component } from 'react'

const card = css({
  margin: '24px',
})
const emptyState = css({
  height: '100%',
  width: '100%',
  maxWidth: 'unset',
  '& .pf-c-empty-state__content': {
    width: '100%',
    maxWidth: 'unset',
  },
})
const actions = css({
  marginBottom: '12px',
})
const emptyStateBody = css({
  textAlign: 'left',
})
const errorTitle = css({
  marginBottom: '12px',
})
const section = css({
  marginBottom: '24px',
})
const sectionTitle = css({
  marginBottom: '8px',
})

type ErrorBoundaryState = {
  hasError: boolean
  error: Error
  errorInfo: ErrorInfo
}

type ErrorInfo = {
  componentStack: string
}

export class AcmErrorBoundary extends Component<
  { children: React.ReactNode | React.ReactNode[]; actions?: React.ReactNode },
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
    if (this.state.hasError) {
      return (
        <Card className={card}>
          <EmptyState className={emptyState} variant={EmptyStateVariant.lg}>
            <EmptyStateHeader
              titleText="Uh oh, something went wrong..."
              icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />}
              headingLevel="h4"
            />
            <EmptyStateBody className={emptyStateBody}>
              <Bullseye className={actions}>{this.props.actions}</Bullseye>
              <ExpandableSection toggleText="See error details...">
                <div className={errorTitle}>
                  <Title headingLevel="h5" size={TitleSizes.xl}>
                    {this.state.error.name}
                  </Title>
                </div>

                <div className={section}>
                  <Title headingLevel="h6" size={TitleSizes.lg} className={sectionTitle}>
                    Description:
                  </Title>
                  <p>{this.state.error.message}</p>
                </div>

                <div className={section}>
                  <Title headingLevel="h6" size={TitleSizes.lg} className={sectionTitle}>
                    Component trace:
                  </Title>
                  <ClipboardCopy isReadOnly isCode isExpanded variant={ClipboardCopyVariant.expansion}>
                    {this.state.errorInfo.componentStack}
                  </ClipboardCopy>
                </div>

                <div className={section}>
                  <Title headingLevel="h6" size={TitleSizes.lg} className={sectionTitle}>
                    Stack trace:
                  </Title>
                  <ClipboardCopy isReadOnly isCode isExpanded variant={ClipboardCopyVariant.expansion}>
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
