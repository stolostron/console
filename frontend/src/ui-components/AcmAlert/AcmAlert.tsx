/* Copyright Contributors to the Open Cluster Management project */

import { Collapse } from '@mui/material'
import { Alert, AlertActionCloseButton, AlertGroup, Flex } from '@patternfly/react-core'
import { createContext, CSSProperties, Fragment, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

export interface AcmAlertInfo {
  type?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  title: ReactNode
  message?: ReactNode
  actions?: ReactNode
  id?: string
  group?: string
  autoClose?: boolean
}

export interface IAlertContext {
  readonly activeAlerts: AcmAlertInfo[]
  readonly alertInfos: AcmAlertInfo[]
  addAlert: (alertInfo: AcmAlertInfo) => void
  removeAlert: (alertInfo: AcmAlertInfo) => void
  removeVisibleAlert: (alertInfo: AcmAlertInfo) => void
  clearAlerts: (matcher?: (alertInfo: AcmAlertInfo) => boolean) => void
}

/* istanbul ignore next */
const noop = () => null

export const AcmAlertContext = createContext<IAlertContext>({
  activeAlerts: [],
  alertInfos: [],
  addAlert: noop,
  removeAlert: noop,
  removeVisibleAlert: noop,
  clearAlerts: noop,
})

export function AcmAlertProvider(props: { children: ReactNode; isToast?: boolean }) {
  const [activeAlerts, setActiveAlerts] = useState<AcmAlertInfo[]>([])
  const [visibleAlerts, setVisibleAlerts] = useState<AcmAlertInfo[]>([])
  const addAlert = useCallback<(alertInfo: AcmAlertInfo) => void>((alert: AcmAlertInfo) => {
    alert.id = Math.random().toString(36).substring(7)
    setActiveAlerts((alerts) => [...alerts, alert])
    setVisibleAlerts((alerts) => [...alerts, alert])
  }, [])
  const removeAlert = useCallback<(alertInfo: AcmAlertInfo) => void>((alertInfo: AcmAlertInfo) => {
    setActiveAlerts((activeAlerts) => {
      const index = activeAlerts.findIndex((ai) => ai.id === alertInfo.id)
      const newAlertInfos = [...activeAlerts]
      /* istanbul ignore else */
      if (index !== -1) newAlertInfos.splice(index, 1)
      return newAlertInfos
    })
  }, [])
  const removeVisibleAlert = useCallback<(alertInfo: AcmAlertInfo) => void>((alertInfo: AcmAlertInfo) => {
    setVisibleAlerts((alertInfos) => {
      const index = alertInfos.findIndex((ai) => ai.id === alertInfo.id)
      const newAlertInfos = [...alertInfos]
      /* istanbul ignore else */
      if (index !== -1) newAlertInfos.splice(index, 1)
      return newAlertInfos
    })
  }, [])
  const clearAlerts = (matcher?: (alertInfo: AcmAlertInfo) => boolean) => {
    if (!matcher) {
      for (const alertInfo of [...activeAlerts]) {
        removeAlert(alertInfo)
      }
    } else {
      const removeAlerts = activeAlerts.filter(matcher)
      for (const alertInfo of removeAlerts) {
        removeAlert(alertInfo)
      }
    }
  }

  return (
    <AcmAlertContext.Provider
      value={{
        activeAlerts: activeAlerts,
        alertInfos: visibleAlerts,
        addAlert,
        removeAlert,
        removeVisibleAlert,
        clearAlerts,
      }}
    >
      {props.children}
    </AcmAlertContext.Provider>
  )
}

export function AcmAlert(props: {
  alertInfo?: AcmAlertInfo
  isInline?: boolean
  title?: ReactNode
  subtitle?: ReactNode
  message?: ReactNode
  noClose?: boolean
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  style?: CSSProperties
  className?: string
}) {
  const alertContext = useContext(AcmAlertContext)
  const { alertInfo } = props
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(true), [])
  useEffect(() => {
    if (alertInfo && !alertContext.activeAlerts.find((a) => a.id === alertInfo.id)) {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertContext])
  return (
    <Collapse
      in={open}
      onExit={() => {
        /* istanbul ignore else */
        if (alertInfo) {
          setTimeout(() => {
            alertContext.removeAlert(alertInfo)
            alertContext.removeVisibleAlert(alertInfo)
          }, 150)
        }
      }}
      timeout={150}
    >
      <Alert
        actionLinks={alertInfo?.actions}
        isInline={props.isInline}
        title={alertInfo?.title || props.title}
        actionClose={!props.noClose && <AlertActionCloseButton onClose={() => setOpen(false)} />}
        variant={alertInfo?.type || props.variant}
        style={props.style}
        className={props.className}
      >
        {alertInfo?.message || props.message || props.subtitle}
      </Alert>
    </Collapse>
  )
}

export type AcmAlertGroupProps = {
  /** Show alerts in the group as inLine alerts */
  isInline?: boolean

  /** Allow alerts in the group to be closed with a close button */
  canClose?: boolean
}

export function AcmAlertGroup(props: AcmAlertGroupProps) {
  const alertContext = useContext(AcmAlertContext)

  const [hasAlerts, setHasAlerts] = useState(false)
  useEffect(() => setHasAlerts(alertContext.alertInfos.length > 0), [alertContext.alertInfos])

  if (!hasAlerts) return <Fragment />

  return (
    <AlertGroup isToast={!props.isInline}>
      <Flex direction={{ default: 'column' }}>
        {alertContext.alertInfos.map((alertInfo) => {
          /* istanbul ignore next */
          return (
            <AcmAlert key={alertInfo.id} alertInfo={alertInfo} isInline={props.isInline} noClose={!props.canClose} />
          )
        })}
      </Flex>
    </AlertGroup>
  )
}
