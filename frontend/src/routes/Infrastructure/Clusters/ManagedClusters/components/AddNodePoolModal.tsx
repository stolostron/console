/* Copyright Contributors to the Open Cluster Management project */

import { ModalVariant } from '@patternfly/react-core'
import { ClusterImageSetK8sResource, HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NodePool } from '../../../../../resources'
import { AcmModal } from '../../../../../ui-components'
import { NodePoolForm } from './NodePoolForm'

export function AddNodePoolModal(props: {
  close: () => void
  open: boolean
  hostedCluster: HostedClusterK8sResource
  clusterImages?: ClusterImageSetK8sResource[]
  refNodepool?: NodePool
  nodepool?: NodePool
}): JSX.Element {
  const { t } = useTranslation()

  if (props.open === false) {
    return <></>
  }

  return (
    <AcmModal variant={ModalVariant.medium} title={t('Add node pool')} isOpen={true} onClose={props.close}>
      <NodePoolForm
        hostedCluster={props.hostedCluster}
        nodepool={props.nodepool}
        refNodepool={props.refNodepool}
        close={props.close}
        clusterImages={props.clusterImages}
      />
    </AcmModal>
  )
}
