/* Copyright Contributors to the Open Cluster Management project */
import { Alert, AlertGroup, AlertProps } from '@patternfly/react-core'
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

export interface SearchAlertProps extends AlertProps {
  key: string
}

export interface ISearchAlertContext {
  readonly alerts: SearchAlertProps[]
  addSearchAlert: (alert: SearchAlertProps) => void
  removeSearchAlert: (key: string) => void
}

export const SearchAlertContext = createContext<ISearchAlertContext>({
  alerts: [],
  addSearchAlert: () => null,
  removeSearchAlert: () => null,
})

export function SearchAlertGroupProvider(props: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<SearchAlertProps[]>([])

  const addSearchAlert = useCallback((alert: SearchAlertProps) => {
    setAlerts((prevAlerts) => [alert, ...prevAlerts])
  }, [])

  const removeSearchAlert = useCallback((key: string) => {
    setAlerts((prevAlerts) => [...prevAlerts.filter((alert) => alert.key !== key)])
  }, [])

  return (
    <SearchAlertContext.Provider value={{ alerts, addSearchAlert, removeSearchAlert }}>
      {props.children}
    </SearchAlertContext.Provider>
  )
}

export function SearchAlertGroup() {
  const { alerts } = useContext(SearchAlertContext)

  if (alerts.length === 0) {
    return <></>
  }

  return (
    <AlertGroup style={{ paddingTop: '1rem' }} isLiveRegion>
      {alerts.map((alert) => (
        // key is included in spread
        // eslint-disable-next-line react/jsx-key
        <Alert isInline {...alert}>
          {alert.children}
        </Alert>
      ))}
    </AlertGroup>
  )
}
