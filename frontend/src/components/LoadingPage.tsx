/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Bullseye,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core'

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
    <>
      <PageSection hasBodyWrapper={false} isFilled>
        <Bullseye>
          <EmptyState icon={Spinner}>
            <EmptyStateFooter>
              <div className={max}>
                <Title size="lg" headingLevel="h4">
                  {props.title ?? 'Loading'}
                </Title>
                <EmptyStateBody>{props.message}</EmptyStateBody>
              </div>
              {props.primaryAction}
              <EmptyStateActions>{props.secondaryActions}</EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </Bullseye>
      </PageSection>
    </>
  )
}
