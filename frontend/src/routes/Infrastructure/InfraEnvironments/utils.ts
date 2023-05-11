/* Copyright Contributors to the Open Cluster Management project */
import { InfraEnvK8sResource, InfrastructureK8sResource, NMStateK8sResource } from '@openshift-assisted/ui-lib/cim'
import { isMatch } from 'lodash'

export const isBMPlatform = (infrastructure?: InfrastructureK8sResource) =>
  ['BareMetal', 'None', 'OpenStack', 'VSphere'].includes(infrastructure?.status?.platform || '')

export const getInfraEnvNMStates = (nmStateConfigs: NMStateK8sResource[], infraEnv?: InfraEnvK8sResource) =>
  nmStateConfigs.filter((nmStateConfig) => {
    if (!Object.keys(infraEnv?.spec?.nmStateConfigLabelSelector?.matchLabels || {}).length) return false
    return isMatch(nmStateConfig.metadata?.labels || {}, infraEnv?.spec?.nmStateConfigLabelSelector?.matchLabels || {})
  })
