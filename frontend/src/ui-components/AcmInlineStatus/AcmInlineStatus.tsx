/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { Button, Popover, PopoverProps, Spinner } from '@patternfly/react-core'
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

const useStyles = makeStyles({
  container: {
    display: 'flex',
  },
  icon: {
    width: '18px', // Progress size md is 18px
  },
  iconMargin: {
    margin: '3px 2px 1px 2px',
  },
  button: {
    padding: 0,
    fontSize: 'inherit',
  },
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
  const classes = useStyles()
  return (
    <div className={classes.container}>
      <div className={classes.icon}>
        <StatusIcon type={props.type} />
      </div>
      <span style={{ marginLeft: '.4rem' }}>
        {props.popover ? (
          <Popover hasAutoWidth {...props.popover}>
            <Button variant="link" className={classes.button}>
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
  const classes = useStyles()
  switch (props.type) {
    case StatusType.healthy:
      return <CheckCircleIcon className={classes.iconMargin} color="var(--pf-global--success-color--100)" />
    case StatusType.danger:
      return <ExclamationCircleIcon className={classes.iconMargin} color="var(--pf-global--danger-color--100)" />
    case StatusType.warning:
      return <ExclamationTriangleIcon className={classes.iconMargin} color="var(--pf-global--warning-color--100)" />
    case StatusType.progress:
      return <Spinner size="md" style={{ verticalAlign: 'middle' }} />
    case StatusType.detached:
      return <AcmIcon icon={AcmIconVariant.brokenlink} />
    case StatusType.pending:
      return <MinusCircleIcon className={classes.iconMargin} color="var(--pf-global--disabled-color--100)" />
    case StatusType.sleep:
      return <AsleepIcon className={classes.iconMargin} color="var(--pf-global--palette--purple-500)" />
    case StatusType.empty:
      return <ResourcesEmptyIcon className={classes.iconMargin} color="var(--pf-global--disabled-color--100)" />
    case StatusType.draft:
      return <FileAltIcon className={classes.iconMargin} color="var(--pf-global--disabled-color--100)" />
    case StatusType.running:
      return <RunningIcon className={classes.iconMargin} color="var(--pf-global--success-color--100)" />
    case 'unknown':
    default:
      return <UnknownIcon className={classes.iconMargin} color="var(--pf-global--disabled-color--100)" />
  }
}
