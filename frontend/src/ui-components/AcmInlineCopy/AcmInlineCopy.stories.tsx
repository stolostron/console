/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody } from '@patternfly/react-core'
import { AcmInlineCopy } from './AcmInlineCopy'

export default {
  title: 'InlineCopy',
  component: AcmInlineCopy,
}

export const InlineCopy = () => {
  return (
    <Card>
      <CardBody>
        <AcmInlineCopy id="example-1" text="Copy me" />
      </CardBody>
    </Card>
  )
}

export const InlineCopyWithDisplayText = () => {
  return (
    <Card>
      <CardBody>
        <AcmInlineCopy id="example-2" text="Copy me" displayText="Non-copy text" />
      </CardBody>
    </Card>
  )
}
