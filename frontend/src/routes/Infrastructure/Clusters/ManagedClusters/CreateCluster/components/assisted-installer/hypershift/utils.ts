/* Copyright Contributors to the Open Cluster Management project */
import { getVersionFromReleaseImage } from '@openshift-assisted/ui-lib/cim'

export const getClusterImageSet = (clusterImageSets: any[], versionName = '') =>
  clusterImageSets.find((clusterImageSet) => clusterImageSet.metadata?.name == versionName)

export const getClusterImageVersion = (clusterImageSets: any[], versionName = '') => {
  const clusterImage = clusterImageSets.find((clusterImageSet) => clusterImageSet.metadata?.name == versionName)
  return getVersionFromReleaseImage(clusterImage?.spec?.releaseImage) || versionName
}

export const getDefaultNetworkType = (
  clusterVersion = '4.11' /* Change if needed. Recent motivation >= 4.11 is with OVN, older with SDN */
): 'OVNKubernetes' | 'OpenShiftSDN' => {
  const [major, minor] = clusterVersion.split('.')
  const majorInt = parseInt(major)
  const minorInt = parseInt(minor)

  if (majorInt === 4 && minorInt <= 10) {
    return 'OpenShiftSDN'
  }
  return 'OVNKubernetes'
}
