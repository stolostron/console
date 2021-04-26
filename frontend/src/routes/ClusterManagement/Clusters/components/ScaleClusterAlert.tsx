/* Copyright Contributors to the Open Cluster Management project */

import { useContext } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { AcmAlert } from '@open-cluster-management/ui-components'
import { useRecoilState } from 'recoil'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { machinePoolsState } from '../../../../atoms'
import { NodeInfo } from '../../../../resources/managed-cluster-info'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export function ScaleClusterAlert() {
    const { t } = useTranslation(['cluster', 'common'])
    const { cluster } = useContext(ClusterContext)
    const [machinePoolState] = useRecoilState(machinePoolsState)
    const machinePools = machinePoolState.filter((mp) => mp.metadata.namespace === cluster!.namespace)

    // check for a scaling in progress
    const workerNodeCount: number | undefined = cluster?.nodes?.nodeList.filter(
        (node: NodeInfo) => node.labels?.['node-role.kubernetes.io/worker'] !== undefined
    )?.length
    let totalDesiredReplicas = 0
    machinePools.forEach((mp) => {
        if (mp.spec?.replicas) {
            totalDesiredReplicas += mp.spec.replicas
        }
    })

    if (workerNodeCount !== undefined && workerNodeCount !== totalDesiredReplicas) {
        return (
            <AcmAlert
                isInline
                noClose
                style={{ marginBottom: '24px' }}
                variant="info"
                title={t('machinePool.alert.scaling.title')}
                message={
                    <>
                        <Trans
                            i18nKey={`cluster:${
                                totalDesiredReplicas > workerNodeCount
                                    ? 'machinePool.alert.scaling.increase.message'
                                    : 'machinePool.alert.scaling.decrease.message'
                            }`}
                            components={{ bold: <strong /> }}
                        />
                        <a
                            href={`${cluster!.consoleURL}/k8s/all-namespaces/machine.openshift.io~v1beta1~Machine`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block' }}
                        >
                            {t('machinePool.view.machines')} <ExternalLinkAltIcon />
                        </a>
                    </>
                }
            />
        )
    }

    return null
}
