/* Copyright Contributors to the Open Cluster Management project */
import { getVersionFromReleaseImage } from '@openshift-assisted/ui-lib/cim'
import { TFunction } from 'i18next'
import { FieldName } from '../types'

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
  const majorInt = Number.parseInt(major)
  const minorInt = Number.parseInt(minor)

  if (majorInt === 4 && minorInt <= 10) {
    return 'OpenShiftSDN'
  }
  return 'OVNKubernetes'
}

export const getFieldLabels = (t: TFunction): Partial<{ [K in FieldName]: string }> => ({
  name: t('Name'),
  baseDnsDomain: t('Base DNS domain'),
  releaseImage: t('cluster.create.ocp.image'),
  pullSecret: t('Pull secret'),
  openshiftVersion: t('OpenShift version'),
  cpuArchitecture: t('CPU architecture'),
  controlPlaneCount: t('Number of control plane nodes'),
  platform: t('Integrate with external partner platforms'),
})

export type PlatformType = 'none' | 'baremetal' | 'vsphere' | 'nutanix' | 'external'

const CIMPlatforms: { [key in PlatformType]: string } = {
  none: 'None',
  baremetal: 'BareMetal',
  vsphere: 'VSphere',
  nutanix: 'Nutanix',
  external: 'External',
}

const CIMPlatformsLabels: { [key in PlatformType]: string } = {
  none: 'No platform integration',
  baremetal: 'No platform integration',
  vsphere: 'vSphere',
  nutanix: 'Nutanix',
  external: 'External cloud provider',
}

export const getPlatform = (a: PlatformType) => (a ? CIMPlatforms[a] : CIMPlatforms['none'])

export const getPlatformLabel = (a: PlatformType) => (a ? CIMPlatformsLabels[a] : CIMPlatformsLabels['none'])
