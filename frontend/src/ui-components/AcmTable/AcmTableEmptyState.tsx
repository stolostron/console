/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateIcon,
  Split,
  SplitItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon'

export interface AcmTableEmptyStateProps {
  title: string
  message: string
  action?: string
}

export function AcmTableEmptyState(props: { title: string; message: string; action?: string }) {
  return (
    <EmptyState variant={EmptyStateVariant.small}>
      <EmptyStateIcon icon={SearchIcon} />
      <Title headingLevel="h2" size="lg">
        {props.title}
      </Title>
      <EmptyStateBody>{props.message}</EmptyStateBody>
      <EmptyStateBody>
        {props.action ? (
          <Split>
            <SplitItem isFilled></SplitItem>
            <SplitItem>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem>
                    <Button>{props.action}</Button>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </SplitItem>
            <SplitItem isFilled></SplitItem>
          </Split>
        ) : (
          <></>
        )}
      </EmptyStateBody>
    </EmptyState>
  )
}
