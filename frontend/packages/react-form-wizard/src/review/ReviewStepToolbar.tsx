/* Copyright Contributors to the Open Cluster Management project */
import { Button, Flex, FlexItem, Toolbar, ToolbarContent } from '@patternfly/react-core'
import { type Dispatch, type SetStateAction, useCallback } from 'react'
import { useStringContext } from '../contexts/StringContext'

export interface ReviewStepToolbarProps {
  onExpandAll: () => void
  onCollapseAll: () => void
  showExpand: boolean
  showCollapse: boolean
}

export function ReviewStepToolbar(props: ReviewStepToolbarProps) {
  const { reviewExpandAllTooltip, reviewCollapseAllTooltip } = useStringContext()
  const toolbarItems = (
    <Flex direction={{ default: 'row' }} style={{ width: '100%' }}>
      <FlexItem flex={{ default: 'flex_1' }} />
      {props.showExpand ? (
        <FlexItem>
          <Button variant="link" onClick={props.onExpandAll}>
            {reviewExpandAllTooltip}
          </Button>
        </FlexItem>
      ) : null}
      {props.showCollapse ? (
        <FlexItem>
          <Button variant="link" onClick={props.onCollapseAll}>
            {reviewCollapseAllTooltip}
          </Button>
        </FlexItem>
      ) : null}
    </Flex>
  )

  return (
    <Toolbar
      className="pf-m-toggle-group-container"
      style={{
        rowGap: '14px',
        width: '100%',
      }}
    >
      <ToolbarContent>{toolbarItems}</ToolbarContent>
    </Toolbar>
  )
}

export type ReviewToolbarAction = 'expand' | 'collapse'

export function useReviewExpandCollapseHandlers(
  sectionKeys: readonly string[],
  topLevelArrayInstanceKeys: readonly string[],
  setLastToolbarAction: Dispatch<SetStateAction<ReviewToolbarAction>>,
  setSectionExpanded: Dispatch<SetStateAction<Record<string, boolean>>>
) {
  const onExpandAll = useCallback(() => {
    setLastToolbarAction('expand')
    setSectionExpanded(() => {
      const next: Record<string, boolean> = {}
      for (const k of sectionKeys) next[k] = true
      for (const k of topLevelArrayInstanceKeys) next[k] = false
      return next
    })
  }, [sectionKeys, topLevelArrayInstanceKeys, setLastToolbarAction, setSectionExpanded])

  const onCollapseAll = useCallback(() => {
    setLastToolbarAction('collapse')
    setSectionExpanded(() => {
      const next: Record<string, boolean> = {}
      for (const k of sectionKeys) next[k] = false
      for (const k of topLevelArrayInstanceKeys) next[k] = false
      return next
    })
  }, [sectionKeys, topLevelArrayInstanceKeys, setLastToolbarAction, setSectionExpanded])

  return { onExpandAll, onCollapseAll }
}
