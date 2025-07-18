/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'

export function useReadinessChecks() {
  const [networkCheckStatus, setNetworkCheckStatus] = useState(true)
  const [storageCheckStatus, setStorageCheckStatus] = useState(true)
  const [computeCheckStatus, setComputeCheckStatus] = useState(true)
  const [versionCheckStatus, setVersionCheckStatus] = useState(true)
  const [resourceCheckStatus, setResourceCheckStatus] = useState(true)

  const readyToMigrate =
    networkCheckStatus && storageCheckStatus && computeCheckStatus && versionCheckStatus && resourceCheckStatus

  return {
    networkCheckStatus,
    storageCheckStatus,
    computeCheckStatus,
    versionCheckStatus,
    resourceCheckStatus,
    readyToMigrate,
    setters: {
      setNetworkCheckStatus,
      setStorageCheckStatus,
      setComputeCheckStatus,
      setVersionCheckStatus,
      setResourceCheckStatus,
    },
  }
}
