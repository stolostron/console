/* Copyright Contributors to the Open Cluster Management project */
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useContext } from 'react'
import HypershiftClusterInstallProgress from './HypershiftClusterInstallProgress'
import { AcmExpandableCard } from '../../../../../ui-components'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../../../shared-recoil'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { CIM } from 'openshift-assisted-ui-lib'

const HypershiftClusterDetails = (props: { handleModalToggle: () => void }) => {
  const { t } = useTranslation()
  const { hostedCluster } = useContext(ClusterContext)
  const { waitForAll } = useSharedRecoil()
  const { agentMachinesState, clusterImageSetsState, configMapsState, nodePoolsState } = useSharedAtoms()
  const [nodePools, clusterImageSets] = useRecoilValue(
    waitForAll([nodePoolsState, clusterImageSetsState, agentMachinesState, configMapsState])
  )

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
              clusterImages={clusterImageSets as CIM.ClusterImageSetK8sResource[]}
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
