/* Copyright Contributors to the Open Cluster Management project */
import { isMatch } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'

export const isBMPlatform = (infrastructure?: CIM.InfrastructureK8sResource) =>
    ['BareMetal', 'None', 'OpenStack', 'VSphere'].includes(infrastructure?.status?.platform)

export const isProvisioningNetworkDisabled = (provisioning?: CIM.ProvisioningK8sResource) =>
    provisioning?.spec?.provisioningNetwork?.toLowerCase() === 'disabled'

export const getInfraEnvNMStates = (infraEnv: CIM.InfraEnvK8sResource, nmStateConfigs: CIM.NMStateK8sResource[]) =>
    nmStateConfigs.filter((nmStateConfig) => {
        if (!Object.keys(infraEnv?.spec?.nmStateConfigLabelSelector?.matchLabels || {}).length) return false
        return isMatch(nmStateConfig.metadata.labels, infraEnv?.spec?.nmStateConfigLabelSelector?.matchLabels)
    })
