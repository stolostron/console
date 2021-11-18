/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSet } from '../../../../../resources'
import { AcmButton, AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { Popover } from '@patternfly/react-core'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { managedClusterAddonsState } from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'
import { submarinerHealthCheck, SubmarinerStatus } from '../ClusterSetDetails/ClusterSetSubmariner/ClusterSetSubmariner'
import { useClusters } from './useClusters'

export function MultiClusterNetworkStatus(props: { clusterSet: ManagedClusterSet }) {
    const { t } = useTranslation()
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
    let linkText = t('View Submariner add-ons')

    if (clusters.length < 2 || submarinerAddons.length < 2) {
        if (clusters.length < 2) {
            status = t('Add clusters')
            message = t(
                'At least two clusters must be added to the cluster set in order to begin forming a multi-cluster network.'
            )
            path = NavigationPath.clusterSetManage.replace(':id', clusterSet!.metadata.name!)
            linkText = t('Manage resource assignments')
        } else {
            status = t('Install add-ons')
            message = t(
                'At least two clusters in the cluster set must have the Submariner add-on installed in order to begin forming a multi-cluster network.'
            )
            path = NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!)
            linkText = t('Go to Submariner add-ons')
        }

        return (
            <Popover bodyContent={message} footerContent={<Link to={path}>{linkText}</Link>}>
                <AcmButton variant="link" style={{ fontSize: 'inherit', padding: 0 }}>
                    {status}
                </AcmButton>
            </Popover>
        )
    } else {
        const unhealthySubmariners = submarinerAddons!.filter(
            (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.degraded
        )
        if (unhealthySubmariners.length > 0) {
            type = StatusType.danger
            status = t('Degraded')
            message = t(
                'One or more of the Submariner add-ons installed in the multi-cluster network are in a degraded state.'
            )
        } else {
            const hasProgressingSubmariners = submarinerAddons!.filter(
                (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.progressing
            )
            if (hasProgressingSubmariners.length > 0) {
                type = StatusType.progress
                status = t('Progressing')
                message = t(
                    'One or more of the Submariner add-ons installed in the multi-cluster network are in a progressing state.'
                )
            } else {
                // healthy
                type = StatusType.healthy
                status = t('Healthy')
                message = t('All Submariner add-ons installed in the multi-cluster network are in a healthy state.')
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
}
