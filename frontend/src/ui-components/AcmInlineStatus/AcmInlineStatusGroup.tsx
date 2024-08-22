/* Copyright Contributors to the Open Cluster Management project */

import { Label, LabelGroup } from '@patternfly/react-core'
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
  groupId?: string
}

export function AcmInlineStatusGroup(props: AcmInlineStatusGroupProps) {
  const show = (count?: number) => {
    if (count === undefined) {
      return false
    } else if (count === 0) {
      return props.showZeroes
    } else {
      return true
    }
  }
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
