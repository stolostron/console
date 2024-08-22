/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateIcon,
  Split,
  SplitItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core'
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon'

export interface AcmTableEmptyStateProps {
  title: string
  message: string
  action?: string
}

export function AcmTableEmptyState(props: { title: string; message: string; action?: string }) {
  return (
    <EmptyState variant={EmptyStateVariant.sm}>
      <EmptyStateHeader titleText={<>{props.title}</>} icon={<EmptyStateIcon icon={SearchIcon} />} headingLevel="h2" />
      <EmptyStateBody>{props.message}</EmptyStateBody>
      <EmptyStateFooter>
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
      </EmptyStateFooter>
    </EmptyState>
  )
}
