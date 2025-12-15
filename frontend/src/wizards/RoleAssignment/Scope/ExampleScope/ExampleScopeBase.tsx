/* Copyright Contributors to the Open Cluster Management project */

import { Stack, StackItem, Title, TreeView } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { getExampleTreeData, getExampleTitle } from './ExampleScopeBaseHelper'

interface ExampleScopeBaseProps {
  exampleIndex: number
}

export const ExampleScopeBase = ({ exampleIndex }: ExampleScopeBaseProps) => {
  const { t } = useTranslation()
  const treeData = getExampleTreeData(exampleIndex, t)
  const title = getExampleTitle(exampleIndex, t)

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h3" size="md">
          {title}
        </Title>
      </StackItem>
      <StackItem>
        <TreeView data={treeData} allExpanded hasSelectableNodes={false} hasGuides={false} />
      </StackItem>
    </Stack>
  )
}
