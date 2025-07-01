/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'

export function useMigrationFormState() {
  const [srcCluster] = useState('sno-2-b9657')
  const [srcNs] = useState('Namespace')

  const [dstCluster, setDstCluster] = useState('sno-2-cb7dv')
  const [dstNamespace, setDstNamespace] = useState('')

  const [srcNetwork, setSrcNetwork] = useState('network1')
  const [dstNetwork, setDstNetwork] = useState('')
  const [srcStorage, setSrcStorage] = useState('')
  const [dstStorage, setDstStorage] = useState('')
  const [srcCompute, setSrcCompute] = useState('')
  const [dstCompute, setDstCompute] = useState('')
  const [storageUsed, setStorageUsed] = useState(111)
  const [storageReserved, setStorageReserved] = useState(6)
  const [storageTotal, setStorageTotal] = useState(238)

  const [openDstCluster, setOpenDstCluster] = useState(false)
  const [openDstNamespace, setOpenDstNamespace] = useState(false)

  return {
    srcCluster,
    srcNs,
    dstCluster,
    setDstCluster,
    dstNamespace,
    setDstNamespace,
    srcNetwork,
    setSrcNetwork,
    dstNetwork,
    setDstNetwork,
    srcStorage,
    setSrcStorage,
    dstStorage,
    setDstStorage,
    srcCompute,
    setSrcCompute,
    dstCompute,
    setDstCompute,
    openDstCluster,
    setOpenDstCluster,
    openDstNamespace,
    setOpenDstNamespace,
    storageUsed,
    setStorageUsed,
    storageReserved,
    setStorageReserved,
    storageTotal,
    setStorageTotal,
  }
}
