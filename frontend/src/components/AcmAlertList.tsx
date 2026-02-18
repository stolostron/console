/* Copyright Contributors to the Open Cluster Management project */

import { Alert, AlertGroup, AlertProps } from '@patternfly/react-core'
import { Fragment, ReactNode } from 'react'

export interface AcmAlertListItem extends Omit<AlertProps, 'children'> {
  /** Unique key for the alert */
  key: string
  /** Alert content */
  children?: ReactNode
}

export interface AcmAlertListProps {
  /** Array of alert configurations to render */
  alerts: AcmAlertListItem[]
  /** Render alerts as inline alerts */
  isInline?: boolean
  /** Render alerts in a toast-style AlertGroup */
  isToast?: boolean
  /** Enable live region for accessibility */
  isLiveRegion?: boolean
  /** Custom style for the AlertGroup */
  style?: React.CSSProperties
  /** Custom className for the AlertGroup */
  className?: string
}

export function AcmAlertList(props: AcmAlertListProps) {
  const { alerts, isInline = false, isToast = false, isLiveRegion = false, style, className } = props

  if (!alerts || alerts.length === 0) {
    return <Fragment />
  }

  return (
    <AlertGroup isToast={isToast} isLiveRegion={isLiveRegion} style={style} className={className}>
      {alerts.map(({ key, children, ...alertProps }) => (
        <Alert key={key} isInline={isInline} {...alertProps}>
          {children}
        </Alert>
      ))}
    </AlertGroup>
  )
}
