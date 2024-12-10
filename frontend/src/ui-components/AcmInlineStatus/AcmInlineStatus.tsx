/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Button, Icon, Popover, PopoverProps, Spinner } from '@patternfly/react-core'
import {
  AsleepIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  UnknownIcon,
  ResourcesEmptyIcon,
  RunningIcon,
  FileAltIcon,
} from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'

import { AcmIcon, AcmIconVariant } from '../AcmIcons/AcmIcons'

const container = css({
  display: 'flex',
})
const icon = css({
  width: '18px', // Progress size md is 18px
})

const button = css({
  padding: 0,
  fontSize: 'inherit',
})

export enum StatusType {
  'healthy' = 'healthy',
  'danger' = 'danger',
  'warning' = 'warning',
  'progress' = 'progress',
  'detached' = 'detached',
  'pending' = 'pending',
  'unknown' = 'unknown',
  'sleep' = 'sleep',
  'empty' = 'empty',
  'draft' = 'draft',
  'running' = 'running',
}

export const getStatusLabel = (status: StatusType, t: TFunction) => {
  switch (status) {
    case StatusType.danger:
      return t('status.subtitle.danger')
    case StatusType.empty:
      return t('status.subtitle.empty')
    case StatusType.healthy:
      return t('status.subtitle.healthy')
    case StatusType.pending:
      return t('status.subtitle.pending')
    case StatusType.progress:
      return t('status.subtitle.progress')
    default:
      return t('status.unknown')
  }
}

export const getNodeStatusLabel = (status: StatusType, t: TFunction) => {
  switch (status) {
    case StatusType.healthy:
      return t('node.status.ready')
    case StatusType.danger:
      return t('node.status.unhealthy')
    default:
      return t('node.status.unknown')
  }
}

export function AcmInlineStatus(props: { type: StatusType; status: string | React.ReactNode; popover?: PopoverProps }) {
  return (
    <div className={container} style={{ alignItems: 'baseline' }}>
      <div className={icon}>
        <StatusIcon type={props.type} />
      </div>
      <span style={{ marginLeft: props.popover ? 'inherit' : '.4rem' }}>
        {props.popover ? (
          <Popover hasAutoWidth {...props.popover}>
            <Button variant="link" className={button} style={{ paddingLeft: '5px' }}>
              {props.status}
            </Button>
          </Popover>
        ) : (
          props.status
        )}
      </span>
    </div>
  )
}

function StatusIcon(props: { type: StatusType }) {
  switch (props.type) {
    case StatusType.healthy:
      return (
        <Icon status="success">
          <CheckCircleIcon />
        </Icon>
      )
    case StatusType.danger:
      return (
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      )
    case StatusType.warning:
      return (
        <Icon status="warning">
          <ExclamationTriangleIcon />
        </Icon>
      )
    case StatusType.progress:
      return <Spinner size="md" style={{ verticalAlign: 'middle' }} />
    case StatusType.detached:
      return <AcmIcon icon={AcmIconVariant.brokenlink} />
    case StatusType.pending:
      return (
        <span style={{ color: 'var(--pf-v5-global--disabled-color--100)' }}>
          <Icon isInline>
            <MinusCircleIcon />
          </Icon>
        </span>
      )
    case StatusType.sleep:
      return (
        <span style={{ color: 'var(--pf-v5-global--palette--purple-500)' }}>
          <Icon isInline>
            <AsleepIcon />
          </Icon>
        </span>
      )
    case StatusType.empty:
      return (
        <span style={{ color: 'var(--pf-v5-global--disabled-color--100)' }}>
          <Icon isInline>
            <ResourcesEmptyIcon />
          </Icon>
        </span>
      )
    case StatusType.draft:
      return (
        <span style={{ color: 'var(--pf-v5-global--disabled-color--100)' }}>
          <Icon isInline>
            <FileAltIcon />
          </Icon>
        </span>
      )
    case StatusType.running:
      return (
        <Icon status="success">
          <RunningIcon />
        </Icon>
      )
    case 'unknown':
    default:
      return (
        <span style={{ color: 'var(--pf-v5-global--disabled-color--100)' }}>
          <Icon isInline>
            <UnknownIcon />
          </Icon>
        </span>
      )
  }
}
