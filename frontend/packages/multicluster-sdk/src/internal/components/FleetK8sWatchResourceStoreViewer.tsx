/* Copyright Contributors to the Open Cluster Management project */
import { Truncate } from '@patternfly/react-core'
import { FC, useEffect, useState } from 'react'
import { useFleetK8sWatchResourceStore } from '../fleetK8sWatchResourceStore'

const TimestampAge: FC<{ timestamp: number }> = ({ timestamp }) => {
  const [now, updateNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => updateNow(Date.now), 100)
    return () => clearInterval(interval)
  }, [])
  return timestamp ? Math.round((now - timestamp) / 1000) : 0
}

const getWebSocketState = (state?: number) => {
  switch (state) {
    case WebSocket.CONNECTING:
      return 'CONNECTING'
    case WebSocket.OPEN:
      return 'OPEN'
    case WebSocket.CLOSING:
      return 'CLOSING'
    case WebSocket.CLOSED:
      return 'CLOSED'
    default:
      return 'N/A'
  }
}

export const FleetK8sWatchResourceStoreViewer = () => {
  const cache = useFleetK8sWatchResourceStore((state) => state.cache)
  const keys = Object.keys(cache).sort()
  return (
    <table style={{ tableLayout: 'fixed', width: '100%' }}>
      <tr>
        <th style={{ width: '60%' }}>Key</th>
        <th>Age</th>
        <th>Socket readyState</th>
        <th>Reference count</th>
        <th>Resource version</th>
        <th>Timeout</th>
        <th>Monitor</th>
      </tr>
      {Array.from(keys)
        .sort()
        .map((key) => (
          <tr key={key}>
            <td>
              <Truncate position="start" content={key} />
            </td>
            <td>
              <TimestampAge timestamp={cache[key]?.timestamp} />
            </td>
            <td>{getWebSocketState(cache[key]?.socket?.readyState)}</td>
            <td>{cache[key]?.refCount}</td>
            <td>{cache[key]?.resourceVersion}</td>
            <td>{cache[key]?.timeout?.toString() ?? 'N/A'}</td>
            <td>{cache[key]?.monitorTimeout?.toString() ?? 'N/A'}</td>
          </tr>
        ))}
    </table>
  )
}
