/* Copyright Contributors to the Open Cluster Management project */

import { Slide } from '@mui/material'
import { Alert, AlertActionCloseButton, AlertGroup, Flex } from '@patternfly/react-core'
import { createContext, CSSProperties, Fragment, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { AcmAlertInfo, IAlertContext } from './AcmAlert'

/* istanbul ignore next */
const noop = () => null

export const AcmToastContext = createContext<IAlertContext>({
  activeAlerts: [],
  alertInfos: [],
  addAlert: noop,
  removeAlert: noop,
  removeVisibleAlert: noop,
  clearAlerts: noop,
})

export function AcmToastProvider(props: { children: ReactNode }) {
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
    <AcmToastContext.Provider
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
    </AcmToastContext.Provider>
  )
}

export function AcmToastGroup() {
  const alertContext = useContext(AcmToastContext)

  const [hasAlerts, setHasAlerts] = useState(false)
  useEffect(() => setHasAlerts(alertContext.alertInfos.length > 0), [alertContext.alertInfos])

  if (!hasAlerts) return <Fragment />

  return (
    <AlertGroup isToast>
      <Flex direction={{ default: 'column' }}>
        {alertContext.alertInfos.map((alertInfo) => {
          /* istanbul ignore next */
          return <AcmToast key={alertInfo.id} alertInfo={alertInfo} />
        })}
      </Flex>
    </AlertGroup>
  )
}

export function AcmToast(props: {
  alertInfo?: AcmAlertInfo & { autoClose?: boolean }
  title?: ReactNode
  subtitle?: ReactNode
  message?: ReactNode
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  style?: CSSProperties
  className?: string
  autoClose?: boolean
}) {
  const alertContext = useContext(AcmToastContext)
  const { alertInfo } = props
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(true), [])
  useEffect(() => {
    if (alertInfo && !alertContext.activeAlerts.find((a) => a.id === alertInfo.id)) {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertContext])

  useEffect(() => {
    if (alertInfo?.autoClose) {
      setTimeout(() => setOpen(false), 5000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Slide
      in={open}
      direction="left"
      mountOnEnter
      unmountOnExit
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
      <div>
        <Alert
          title={alertInfo?.title || props.title}
          actionClose={<AlertActionCloseButton onClose={() => setOpen(false)} />}
          actionLinks={alertInfo?.actions}
          variant={alertInfo?.type || props.variant}
          style={props.style}
          className={props.className}
        >
          {alertInfo?.message || props.message || props.subtitle}
        </Alert>
      </div>
    </Slide>
  )
}
