/* Copyright Contributors to the Open Cluster Management project */
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import HypershiftClusterInstallProgress from './HypershiftClusterInstallProgress'
import { AcmExpandableCard } from '../../../../../ui-components'
import { useSharedAtoms, useRecoilValue } from '../../../../../shared-recoil'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterImageSetK8sResource } from '@openshift-assisted/ui-lib/cim'

const HypershiftClusterDetails = (props: { handleModalToggle: () => void }) => {
  const { t } = useTranslation()
  const { hostedCluster } = useClusterDetailsContext()
  const { clusterImageSetsState, nodePoolsState } = useSharedAtoms()
  const nodePools = useRecoilValue(nodePoolsState)
  const clusterImageSets = useRecoilValue(clusterImageSetsState)

  const clusterNodePools = nodePools.filter(
    (np) =>
      np.metadata?.namespace === hostedCluster?.metadata?.namespace &&
      np.spec.clusterName === hostedCluster?.metadata?.name
  )

  if (hostedCluster) {
    return (
      <>
        <div style={{ marginBottom: '24px' }}>
          <AcmExpandableCard title={t('Control plane status')} id="hypershift-progress">
            <HypershiftClusterInstallProgress
              hostedCluster={hostedCluster}
              nodePools={clusterNodePools}
              clusterImages={clusterImageSets as ClusterImageSetK8sResource[]}
              handleModalToggle={props.handleModalToggle}
            />
          </AcmExpandableCard>
        </div>
      </>
    )
  }
  return null
}

export default HypershiftClusterDetails
