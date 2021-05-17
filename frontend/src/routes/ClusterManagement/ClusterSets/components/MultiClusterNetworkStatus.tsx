/* Copyright Contributors to the Open Cluster Management project */

import { AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { ManagedClusterSet } from '../../../../resources/managed-cluster-set'
import { managedClusterAddonsState } from '../../../../atoms'
import { NavigationPath } from '../../../../NavigationPath'
import { submarinerHealthCheck } from '../ClusterSetDetails/ClusterSetSubmariner/ClusterSetSubmariner'
import { useClusters } from './useClusters'

export function MultiClusterNetworkStatus(props: { clusterSet: ManagedClusterSet }) {
    const { t } = useTranslation(['cluster'])
    const { clusterSet } = props
    const [managedClusterAddons] = useRecoilState(managedClusterAddonsState)

    const clusters = useClusters(clusterSet)
    const submarinerAddons = managedClusterAddons.filter(
        (mca) => mca.metadata.name === 'submariner' && clusters?.find((c) => c.namespace === mca.metadata.namespace)
    )

    let type: StatusType = StatusType.pending
    let status = ''
    let message = ''
    let path = NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!)
    let linkText = t('view.submariner')

    if (clusters.length < 2) {
        type = StatusType.pending
        status = t('status.submariner.network.insufficientClusters')
        message = t('status.submariner.network.insufficientClusters.message')
        path = NavigationPath.clusterSetManage.replace(':id', clusterSet!.metadata.name!)
        linkText = t('page.header.cluster-set.manage-assignments')
    } else if (submarinerAddons.length < 2) {
        type = StatusType.pending
        status = t('status.submariner.network.insufficientSubmariners')
        message = t('status.submariner.network.insufficientSubmariners.message')
    } else {
        const unhealthySubmariners = submarinerAddons!.filter((mca) => !submarinerHealthCheck(mca))
        if (unhealthySubmariners.length > 0) {
            type = StatusType.danger
            status = t('status.submariner.network.degraded')
            message = t('status.submariner.network.degraded.message')
        } else {
            type = StatusType.healthy
            status = t('status.submariner.network.healthy')
            message = t('status.submariner.network.healthy.message')
        }
    }

    return (
        <AcmInlineStatus
            type={type}
            status={status}
            popover={{ bodyContent: message, footerContent: <Link to={path}>{linkText}</Link> }}
        />
    )
}
