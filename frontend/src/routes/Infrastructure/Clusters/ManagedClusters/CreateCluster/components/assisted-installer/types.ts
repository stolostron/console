/* Copyright Contributors to the Open Cluster Management project */
import {
    AgentClusterInstallK8sResource,
    BareMetalHostK8sResource,
    ClusterDeploymentHostsSelectionValues,
    NMStateK8sResource,
    SecretK8sResource,
} from 'openshift-assisted-ui-lib/cim'

export type FormControl = {
    active?: ClusterDeploymentHostsSelectionValues
    agentClusterInstall: AgentClusterInstallK8sResource
    validate?: VoidFunction
    summary?: VoidFunction
    resourceJSON?: any
    step?: any
}

export type CIMHostsFormProps = {
    control: FormControl
    handleChange: (control: FormControl) => void
}

export type AIHostsFormProps = CIMHostsFormProps

export type ModalProps = {
    bmh?: BareMetalHostK8sResource
    nmState?: NMStateK8sResource
    secret?: SecretK8sResource
}
