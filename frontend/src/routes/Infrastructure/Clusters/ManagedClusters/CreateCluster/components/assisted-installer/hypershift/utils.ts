/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'

const { getVersionFromReleaseImage } = CIM

export const getClusterImageSet = (clusterImageSets: any[], versionName = '') =>
    clusterImageSets.find((clusterImageSet) => clusterImageSet.metadata?.name == versionName)

export const getClusterImageVersion = (clusterImageSets: any[], versionName = '') => {
    const clusterImage = clusterImageSets.find((clusterImageSet) => clusterImageSet.metadata?.name == versionName)
    return getVersionFromReleaseImage(clusterImage?.spec?.releaseImage) || versionName
}
