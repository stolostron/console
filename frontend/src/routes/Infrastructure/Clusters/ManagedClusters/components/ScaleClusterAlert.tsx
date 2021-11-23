/* Copyright Contributors to the Open Cluster Management project */

import { NodeInfo } from '../../../../../resources'
import { AcmAlert, Provider } from '@open-cluster-management/ui-components'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Fragment, useContext } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { machinePoolsState, submarinerConfigsState } from '../../../../../atoms'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

export function ScaleClusterAlert() {
    const { t } = useTranslation()
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
                    totalDesiredReplicas > workerNodeCount ? 'Scaling up in progress' : 'Scaling down in progress'
                )}
                message={
                    <>
                        <Trans
                            i18nKey={`${
                                totalDesiredReplicas > workerNodeCount
                                    ? 'Worker nodes are currently being added to this cluster. Click the <bold>View machines</bold> button to see the status of the scaling operations (it may take a few minutes for the changes to be reflected on this console).'
                                    : 'Worker nodes are currently being removed from this cluster. Click the <bold>View machines</bold> button to see the status of the scaling operations (it may take a few minutes for the changes to be reflected on this console).'
                            }`}
                            components={{ bold: <strong /> }}
                        />
                        <a
                            href={`${cluster!.consoleURL}/k8s/all-namespaces/machine.openshift.io~v1beta1~Machine`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block' }}
                        >
                            {t('View machines')} <ExternalLinkAltIcon />
                        </a>
                    </>
                }
            />
        )
    }

    return <Fragment />
}
