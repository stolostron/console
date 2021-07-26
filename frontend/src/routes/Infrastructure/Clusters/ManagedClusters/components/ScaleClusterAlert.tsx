/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useContext } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { AcmAlert, Provider } from '@open-cluster-management/ui-components'
import { useRecoilState } from 'recoil'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { machinePoolsState, submarinerConfigsState } from '../../../../../atoms'
import { NodeInfo } from '../../../../../resources/managed-cluster-info'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export function ScaleClusterAlert() {
    const { t } = useTranslation(['cluster', 'common'])
    const { cluster } = useContext(ClusterContext)
    const [machinePoolState] = useRecoilState(machinePoolsState)
    const [submarinerConfigs] = useRecoilState(submarinerConfigsState)
    const machinePools = machinePoolState.filter((mp) => mp.metadata.namespace === cluster!.namespace)
    const subConfig = submarinerConfigs.find((sc) => sc.metadata.namespace === cluster!.namespace)

    // check for a scaling in progress
    const workerNodeCount: number | undefined = cluster?.nodes?.nodeList.filter(
        (node: NodeInfo) =>
            node.labels?.['node-role.kubernetes.io/worker'] !== undefined &&
            node.labels?.['node-role.kubernetes.io/master'] === undefined
    )?.length
    let totalDesiredReplicas = 0
    machinePools.forEach((mp) => {
        if (mp.status?.replicas) {
            totalDesiredReplicas += mp.status?.replicas ?? 0
        }
    })

    // SubmarinerConfig will only provision new nodes for AWS
    if (subConfig && cluster?.provider === Provider.aws) {
        totalDesiredReplicas += subConfig?.spec?.gatewayConfig?.gateways ?? 1 // gateway is 1 by default
    }

    switch (cluster?.provider) {
        case Provider.baremetal:
            return <Fragment />
    }

    if (
        cluster?.isHive &&
        cluster?.nodes?.nodeList.length !== 0 &&
        workerNodeCount !== undefined &&
        workerNodeCount !== totalDesiredReplicas
    ) {
        return (
            <AcmAlert
                isInline
                noClose
                style={{ marginBottom: '24px' }}
                variant="info"
                title={t(
                    totalDesiredReplicas > workerNodeCount
                        ? 'machinePool.alert.scaling.increase.title'
                        : 'machinePool.alert.scaling.decrease.title'
                )}
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

    return <Fragment />
}
