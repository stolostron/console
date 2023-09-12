/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { useRecoilState, useSharedAtoms } from '../shared-recoil'

export const useIsHypershiftEnabled = () => {
  const [isHypershiftEnabled, setIsHypershiftEnabled] = useState<boolean>(false)
  const { managedClusterAddonsState, multiClusterEnginesState } = useSharedAtoms()
  const [managedClusterAddOns] = useRecoilState(managedClusterAddonsState)
  const [[multiClusterEngine]] = useRecoilState(multiClusterEnginesState)
  const hypershiftAddon = managedClusterAddOns.find(
    (mca) => mca.metadata.namespace === 'local-cluster' && mca.metadata.name === 'hypershift-addon'
  )
  useEffect(() => {
    const getHypershiftStatus = async () => {
      try {
        const components = multiClusterEngine?.spec?.overrides?.components
        const hypershift = components?.find((component) => component.name === 'hypershift')
        const hypershiftLocalHosting = components?.find((component) => component.name === 'hypershift-local-hosting')
        setIsHypershiftEnabled(
          !!hypershift?.enabled &&
            !!hypershiftLocalHosting?.enabled &&
            hypershiftAddon?.status?.conditions?.find((c) => c.reason === 'ManagedClusterAddOnLeaseUpdated')?.status ===
              'True'
        )
      } catch {
        // nothing to do
      }
    }
    getHypershiftStatus()
  }, [hypershiftAddon?.status?.conditions, multiClusterEngine?.spec?.overrides?.components])
  return isHypershiftEnabled
}
