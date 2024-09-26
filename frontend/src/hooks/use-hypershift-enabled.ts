/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { useRecoilValue, useSharedAtoms } from '../shared-recoil'

export const useIsHypershiftEnabled = () => {
  const [isHypershiftEnabled, setIsHypershiftEnabled] = useState<boolean>(false)
  const { managedClusterAddonsState, multiClusterEnginesState } = useSharedAtoms()
  const managedClusterAddOns = useRecoilValue(managedClusterAddonsState)
  const [multiClusterEngine] = useRecoilValue(multiClusterEnginesState)
  const hypershiftAddon = (managedClusterAddOns?.['local-cluster'] || []).find(
    (mca) => mca.metadata.name === 'hypershift-addon'
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
