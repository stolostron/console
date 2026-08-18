import { FC, useEffect, useState } from 'react'

/* Copyright Contributors to the Open Cluster Management project */
import { Truncate } from '@patternfly/react-core'
import { useFleetK8sWatchResourceStore } from '../fleetK8sWatchResourceStore'

const TimestampAge: FC<{ timestamp: number }> = ({ timestamp }) => {
  const [now, updateNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => updateNow(Date.now), 100)
    return () => clearInterval(interval)
  }, [])
  return timestamp ? Math.round((now - timestamp) / 1000) : 0
}

export const FleetK8sWatchResourceStoreViewer = () => {
  const cache = useFleetK8sWatchResourceStore((state) => state.cache)
  const keys = Object.keys(cache).sort()
  return (
    <table style={{ tableLayout: 'fixed', width: '100%' }}>
      <tr>
        <th style={{ width: '50%' }}>Key</th>
        <th>Age</th>
        <th>Poll status</th>
        <th>Last poll</th>
        <th>Reference count</th>
        <th>Resource version</th>
        <th>Timeout</th>
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
            <td>{cache[key]?.pollStatus ?? 'Idle'}</td>
            <td>{cache[key]?.lastPollAt ? <TimestampAge timestamp={cache[key].lastPollAt} /> : '—'}</td>
            <td>{cache[key]?.refCount}</td>
            <td>{cache[key]?.resourceVersion}</td>
            <td>{cache[key]?.timeout?.toString() ?? 'N/A'}</td>
          </tr>
        ))}
    </table>
  )
}
