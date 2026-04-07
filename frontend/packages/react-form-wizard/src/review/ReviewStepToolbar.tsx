/* Copyright Contributors to the Open Cluster Management project */
import { Button, Flex, FlexItem, Toolbar, ToolbarContent } from '@patternfly/react-core'
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
