/* Copyright Contributors to the Open Cluster Management project */

import { Label, LabelGroup, Popover, PopoverPosition } from '@patternfly/react-core'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  UnknownIcon,
  InProgressIcon,
  AsleepIcon,
  RunningIcon,
} from '@patternfly/react-icons'
import { BrokenLinkIcon } from '../AcmIcons/BrokenLinkIcon'

type AcmInlineStatusGroupProps = {
  healthy?: number
  running?: number
  warning?: number
  progress?: number
  danger?: number
  sleep?: number
  pending?: number
  detached?: number
  unknown?: number
  showZeroes?: boolean
  messages?: Record<string, string>[]
  groupId?: string
}

export function AcmInlineStatusGroup(props: AcmInlineStatusGroupProps) {
  const show = (count?: number) => count !== undefined && (count > 0 || props.showZeroes)
  const messages = props.messages

  const renderPopoverContent = () => {
    return (
      <div style={{ width: '26.75rem' }}>
        {messages &&
          messages.map((message) => {
            // Remove leading underscore and "condition" from the key
            let cleanedKey = message.key.replace(/^_/, '').replace(/^condition/i, '')
            // Add space before each capitalized letter
            cleanedKey = cleanedKey.replace(/([A-Z])/g, ' $1')
            // Capitalize the first letter and trim any leading space
            cleanedKey = cleanedKey.charAt(0).toUpperCase() + cleanedKey.slice(1)
            cleanedKey = cleanedKey.trim()
            return (
              <div key={message.key} style={{ marginBottom: '0.5rem' }}>
                <strong>{cleanedKey}:</strong> {message.value}
              </div>
            )
          })}
      </div>
    )
  }
  const renderInlineStatusGroup = () => {
    return (
      <LabelGroup defaultIsOpen isClosable={false} numLabels={10} id={props.groupId}>
        {show(props.healthy) && (
          <Label color="green" icon={<CheckCircleIcon />}>
            {props.healthy}
          </Label>
        )}
        {show(props.running) && (
          <Label color="green" icon={<RunningIcon />}>
            {props.running}
          </Label>
        )}
        {show(props.progress) && (
          <Label color="grey" icon={<InProgressIcon />}>
            {props.progress}
          </Label>
        )}
        {show(props.warning) && (
          <Label color="orange" icon={<ExclamationTriangleIcon />}>
            {props.warning}
          </Label>
        )}
        {show(props.danger) && (
          <Label color="red" icon={<ExclamationCircleIcon />}>
            {props.danger}
          </Label>
        )}
        {show(props.sleep) && (
          <Label color="purple" icon={<AsleepIcon />}>
            {props.sleep}
          </Label>
        )}
        {show(props.detached) && (
          <Label color="grey" icon={<BrokenLinkIcon style={{ width: '18px', verticalAlign: 'sub' }} />}>
            {props.detached}
          </Label>
        )}
        {show(props.pending) && (
          <Label variant="outline" icon={<MinusCircleIcon color="var(--pf-v5-global--disabled-color--100)" />}>
            {props.pending}
          </Label>
        )}
        {show(props.unknown) && (
          <Label variant="outline" icon={<UnknownIcon />}>
            {props.unknown}
          </Label>
        )}
      </LabelGroup>
    )
  }

  if (Array.isArray(messages) && messages.length > 0) {
    return (
      <Popover
        id={'labels-popover'}
        bodyContent={renderPopoverContent()}
        position={PopoverPosition.bottom}
        flipBehavior={['bottom', 'bottom-end', 'bottom-end']}
        hasAutoWidth
      >
        <Label style={{ width: 'fit-content' }} isOverflowLabel>
          {renderInlineStatusGroup()}
        </Label>
      </Popover>
    )
  } else {
    return renderInlineStatusGroup()
  }
}
