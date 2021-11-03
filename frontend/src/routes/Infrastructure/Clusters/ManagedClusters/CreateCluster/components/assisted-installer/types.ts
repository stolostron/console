/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'

export type FormControl = {
  active?: CIM.ClusterDeploymentHostsSelectionValues
  agentClusterInstall: CIM.AgentClusterInstallK8sResource
  validate?: VoidFunction
  summary?: VoidFunction
  resourceJSON?: any
  step?: any
}

export type CIMHostsFormProps = {
  control: FormControl
  resourceJSON: any
  handleChange: (control: FormControl) => void
}

export type AIHostsFormProps = CIMHostsFormProps;

export type ModalProps = {
  bmh?: CIM.BareMetalHostK8sResource
  nmState?: CIM.NMStateK8sResource
  secret?: CIM.SecretK8sResource
}
