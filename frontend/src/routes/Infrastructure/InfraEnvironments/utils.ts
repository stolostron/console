/* Copyright Contributors to the Open Cluster Management project */
import { isMatch } from 'lodash'
import * as CIM from '@openshift-assisted/ui-lib/cim'

export const isBMPlatform = (infrastructure?: CIM.InfrastructureK8sResource) =>
  ['BareMetal', 'None', 'OpenStack', 'VSphere'].includes(infrastructure?.status?.platform || '')

export const getInfraEnvNMStates = (nmStateConfigs: CIM.NMStateK8sResource[], infraEnv?: CIM.InfraEnvK8sResource) =>
  nmStateConfigs.filter((nmStateConfig) => {
    if (!Object.keys(infraEnv?.spec?.nmStateConfigLabelSelector?.matchLabels || {}).length) return false
    return isMatch(nmStateConfig.metadata?.labels || {}, infraEnv?.spec?.nmStateConfigLabelSelector?.matchLabels || {})
  })
