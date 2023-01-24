/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody } from '@patternfly/react-core'
import { AcmInlineStatusGroup } from './AcmInlineStatusGroup'

export default {
  title: 'InlineStatusGroup',
  component: AcmInlineStatusGroup,
  argTypes: {
    showZeroes: { type: 'boolean' },
    healthy: { type: 'number' },
    running: { type: 'number' },
    warning: { type: 'number' },
    danger: { type: 'number' },
    progress: { type: 'number' },
    sleep: { type: 'number' },
    detached: { type: 'number' },
    pending: { type: 'number' },
    unknown: { type: 'number' },
  },
}

export const InlineStatusGroup = (args: any) => {
  return (
    <Card>
      <CardBody>
        <AcmInlineStatusGroup {...args} />
      </CardBody>
    </Card>
  )
}
InlineStatusGroup.args = {
  showZeroes: true,
  healthy: 3,
  running: 8,
  warning: 2,
  danger: 1,
  progress: 4,
  sleep: 1,
  detached: 2,
  pending: 5,
  unknown: 0,
}
