/* Copyright Contributors to the Open Cluster Management project */

import { Card, CardBody } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmInlineStatus, StatusType } from './AcmInlineStatus'

export default {
  title: 'InlineStatus',
  component: AcmInlineStatus,
  argTypes: {
    type: {
      control: { type: 'select', options: Object.values(StatusType) },
    },
    status: { type: 'string' },
  },
}

export const InlineStatus = (args: any) => {
  return (
    <Card>
      <CardBody>
        <AcmInlineStatus type={args.type} status={args.status} />
      </CardBody>
    </Card>
  )
}

export const InlineStatusWithPopover = () => {
  return (
    <Card>
      <CardBody>
        <AcmInlineStatus
          type={StatusType.healthy}
          status="Ready"
          popover={{
            headerContent: 'Status header',
            bodyContent: 'Some information about the status here.',
            footerContent: (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a href="#">
                Status link <ExternalLinkAltIcon />
              </a>
            ),
          }}
        />
      </CardBody>
    </Card>
  )
}

InlineStatus.args = {
  status: 'Ready',
  type: StatusType.healthy,
}
