/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'

export const isBMPlatform = (infrastructure?: CIM.InfrastructureK8sResource) =>
    ['BareMetal', 'None', 'OpenStack', 'VSphere', 'AWS'].includes(infrastructure?.status?.platform)
