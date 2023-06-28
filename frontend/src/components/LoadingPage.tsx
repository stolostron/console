/* Copyright Contributors to the Open Cluster Management project */

import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  Title,
  Spinner,
  PageSection,
  Bullseye,
  Page,
} from '@patternfly/react-core'
import { css } from '@emotion/css'

const max = css({
  maxWidth: '335px',
})

export function LoadingPage(props: {
  title?: string | React.ReactNode
  message?: string | React.ReactNode
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
}) {
  return (
    <Page>
      <PageSection isFilled>
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon variant="container" component={Spinner} />
            <div className={max}>
              <Title size="lg" headingLevel="h4">
                {props.title ?? 'Loading'}
              </Title>
              <EmptyStateBody>{props.message}</EmptyStateBody>
            </div>
            {props.primaryAction}
            <EmptyStateSecondaryActions>{props.secondaryActions}</EmptyStateSecondaryActions>
          </EmptyState>
        </Bullseye>
      </PageSection>
    </Page>
  )
}
