/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { Cluster } from '../../../../../resources/utils/get-cluster'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { getCPUArchFromReleaseImage, getVersionFromReleaseImage } from '../utils/utils'

const isUpdateVersionAcceptable = (currentVersion: string, newVersion: string) => {
  const currentVersionParts = currentVersion.split('.')
  const newVersionParts = newVersion.split('.')

  if (newVersionParts[0] !== currentVersionParts[0]) {
    return false
  }

  if (newVersionParts[0] === currentVersionParts[0] && Number(newVersionParts[1]) > Number(currentVersionParts[1])) {
    return true
  }

  if (
    newVersionParts[0] === currentVersionParts[0] &&
    Number(newVersionParts[1]) === Number(currentVersionParts[1]) &&
    Number(newVersionParts[2]) > Number(currentVersionParts[2])
  ) {
    return true
  }

  return false
}

export const useHypershiftAvailableUpdates = (cluster?: Cluster) => {
  const { clusterImageSetsState } = useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const image = cluster?.distribution?.ocp?.desired?.image
  const archType = getCPUArchFromReleaseImage(image) ?? 'multi'

  const hypershiftAvailableUpdates: Record<string, string> = useMemo(() => {
    if (!(cluster?.isHypershift || cluster?.isHostedCluster)) {
      return {}
    }
    const updates: any = {}
    clusterImageSets.forEach((cis) => {
      if (cis.spec?.releaseImage.includes(archType)) {
        const releaseImageVersion = getVersionFromReleaseImage(cis.spec?.releaseImage)
        if (
          releaseImageVersion &&
          isUpdateVersionAcceptable(cluster?.distribution?.ocp?.version || '', releaseImageVersion)
        ) {
          updates[releaseImageVersion] = cis.spec?.releaseImage
        }
      }
    })

    return updates
  }, [archType, clusterImageSets, cluster?.distribution?.ocp?.version, cluster?.isHostedCluster, cluster?.isHypershift])
  return hypershiftAvailableUpdates
}
