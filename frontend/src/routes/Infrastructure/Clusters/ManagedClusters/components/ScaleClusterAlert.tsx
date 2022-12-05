/* Copyright Contributors to the Open Cluster Management project */

import { NodeInfo } from '../../../../../resources'
import { AcmAlert, Provider } from '../../../../../ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext } from 'react'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { useSharedAtoms, useRecoilState } from '../../../../../shared-recoil'

export function ScaleClusterAlert() {
    const { t } = useTranslation()
    const { cluster } = useContext(ClusterContext)
    const { machinePoolsState, submarinerConfigsState } = useSharedAtoms()
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

    // Do not display alert if the deployment does not use MachinePools
    if (machinePools.length === 0) {
        return <Fragment />
    }

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

    if (
        cluster?.isHive &&
        cluster?.nodes?.nodeList.length !== 0 &&
        workerNodeCount !== undefined &&
        workerNodeCount !== totalDesiredReplicas
    ) {
        /*
            t('machinePool.alert.scaling.increase.message')
            t('machinePool.alert.scaling.decrease.message')
        */
        return (
            <AcmAlert
                isInline
                noClose
                style={{ marginBottom: '24px' }}
                variant="info"
                title={
                    totalDesiredReplicas > workerNodeCount
                        ? t('machinePool.alert.scaling.increase.title')
                        : t('machinePool.alert.scaling.decrease.title')
                }
                message={
                    <>
                        <Trans
                            i18nKey={
                                totalDesiredReplicas > workerNodeCount
                                    ? 'machinePool.alert.scaling.increase.message'
                                    : 'machinePool.alert.scaling.decrease.message'
                            }
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
