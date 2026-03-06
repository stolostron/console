/* Copyright Contributors to the Open Cluster Management project */

import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ClusterImageSetK8sResource, HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NodePool } from '../../../../../resources'
import { AcmModal } from '../../../../../ui-components'
import { NodePoolForm } from './NodePoolForm'
import { Cluster } from '../../../../../resources/utils/get-cluster'

export interface IManageNodePoolNodesModalProps {
  close: () => void
  open: true
  cluster: Cluster
  hostedCluster: HostedClusterK8sResource
  clusterImages?: ClusterImageSetK8sResource[]
  refNodepool?: NodePool
  nodepool?: NodePool
}

export function ManageNodePoolNodesModal(props: IManageNodePoolNodesModalProps | { open: false }) {
  const { t } = useTranslation()

  if (props.open === false) {
    return <></>
  }

  return (
    <AcmModal variant={ModalVariant.medium} title={t('Manage node pool')} isOpen={true} onClose={props.close}>
      <NodePoolForm
        cluster={props.cluster}
        hostedCluster={props.hostedCluster}
        nodepool={props.nodepool}
        refNodepool={props.refNodepool}
        close={props.close}
      />
    </AcmModal>
  )
}
