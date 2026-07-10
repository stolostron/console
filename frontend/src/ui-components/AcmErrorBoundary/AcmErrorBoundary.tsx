/* Copyright Contributors to the Open Cluster Management project */

import {
  Card,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
  ExpandableSection,
  Title,
  TitleSizes,
  ClipboardCopy,
  ClipboardCopyVariant,
  Bullseye,
} from '@patternfly/react-core'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { css } from '@emotion/css'
import { Component, ReactNode } from 'react'
import { useTranslation } from '../../lib/acm-i18next'

const card = css({
  margin: '24px',
})
const emptyState = css({
  height: '100%',
  width: '100%',
  maxWidth: 'unset',
  '& .pf-v6-c-empty-state__content': {
    width: '100%',
    maxWidth: 'unset',
  },
})
const actionsStyle = css({
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

interface ErrorBoundaryProps {
  children: ReactNode | ReactNode[]
  actions?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error
  errorInfo: { componentStack: string }
}

function ErrorFallback({
  error,
  errorInfo,
  actions,
}: Readonly<{
  error: Error
  errorInfo: { componentStack: string }
  actions?: ReactNode
}>) {
  const { t } = useTranslation()

  return (
    <Card className={card}>
      <EmptyState
        headingLevel="h4"
        icon={ExclamationTriangleIcon}
        titleText={t('Uh oh, something went wrong...')}
        className={emptyState}
        variant={EmptyStateVariant.lg}
      >
        <EmptyStateBody className={emptyStateBody}>
          <Bullseye className={actionsStyle}>{actions}</Bullseye>
          <ExpandableSection toggleText={t('See error details...')}>
            <div className={errorTitle}>
              <Title headingLevel="h5" size={TitleSizes.xl}>
                {error.name}
              </Title>
            </div>

            <div className={section}>
              <Title headingLevel="h6" size={TitleSizes.lg} className={sectionTitle}>
                {t('Description:')}
              </Title>
              <p>{error.message}</p>
            </div>

            <div className={section}>
              <Title headingLevel="h6" size={TitleSizes.lg} className={sectionTitle}>
                {t('Component trace:')}
              </Title>
              <ClipboardCopy isReadOnly isCode isExpanded variant={ClipboardCopyVariant.expansion}>
                {errorInfo.componentStack}
              </ClipboardCopy>
            </div>

            <div className={section}>
              <Title headingLevel="h6" size={TitleSizes.lg} className={sectionTitle}>
                {t('Stack trace:')}
              </Title>
              <ClipboardCopy isReadOnly isCode isExpanded variant={ClipboardCopyVariant.expansion}>
                {error.stack ?? ''}
              </ClipboardCopy>
            </div>
          </ExpandableSection>
        </EmptyStateBody>
      </EmptyState>
    </Card>
  )
}

export class AcmErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: { message: '', stack: '', name: '' },
    errorInfo: { componentStack: '' },
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ error, errorInfo, hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} actions={this.props.actions} />
    }
    return this.props.children
  }
}
