/* Copyright Contributors to the Open Cluster Management project */
import { Truncate } from '@patternfly/react-core'
import { useFleetK8sWatchResourceStore } from '../fleetK8sWatchResourceStore'
import { FC, useEffect, useState } from 'react'

const TimestampAge: FC<{ timestamp: number }> = ({ timestamp }) => {
  const [now, updateNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => updateNow(Date.now), 100)
    return () => clearInterval(interval)
  }, [])
  return timestamp ? Math.round((now - timestamp) / 1000) : 0
}

export const FleetK8sWatchResourceStoreViewer = () => {
  const { resourceCache, socketCache } = useFleetK8sWatchResourceStore()
  const keys = new Set(Object.keys(resourceCache)).union(new Set(Object.keys(socketCache)))
  return (
    <table style={{ tableLayout: 'fixed', width: '100%' }}>
      <tr>
        <th>Key</th>
        <th>Resource age</th>
        <th>Socket readyState</th>
        <th>Socket age</th>
        <th>Socket refCount</th>
      </tr>
      {Array.from(keys)
        .sort()
        .map((key) => (
          <tr key={key}>
            <td>
              <Truncate position="start" content={key} />
            </td>
            <td>
              <TimestampAge timestamp={resourceCache[key]?.timestamp} />
            </td>
            <td>{socketCache[key]?.socket?.readyState}</td>
            <td>
              <TimestampAge timestamp={socketCache[key]?.timestamp} />
            </td>
            <td>{socketCache[key]?.refCount}</td>
          </tr>
        ))}
    </table>
  )
}
