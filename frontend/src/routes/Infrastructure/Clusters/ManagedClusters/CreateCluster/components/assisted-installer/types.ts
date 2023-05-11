/* Copyright Contributors to the Open Cluster Management project */
import { BareMetalHostK8sResource, NMStateK8sResource, SecretK8sResource } from '@openshift-assisted/ui-lib/cim'

export type ModalProps = {
  bmh?: BareMetalHostK8sResource
  nmState?: NMStateK8sResource
  secret?: SecretK8sResource
}
