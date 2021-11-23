/* Copyright Contributors to the Open Cluster Management project */
import { AcmAlert } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { Cluster, clusterDangerStatuses, ClusterStatus } from '../../../../../resources'

export function ClusterStatusMessageAlert(props: {
    cluster: Cluster
    action?: React.ReactNode
    padTop?: boolean
    padBottom?: boolean
}) {
    const { t } = useTranslation()

    function getClusterStatus(clusterStatus: ClusterStatus, t: (string: String) => string) {
        switch (clusterStatus) {
            case 'unknown':
                return t('The cluster is not reachable')
            case 'offline':
                return t('The cluster is not available')
            case 'prehookfailed':
                return t('The cluster prehook jobs failed')
            case 'posthookfailed':
                return t('The cluster posthook jobs failed')
            case 'importfailed':
                return t('The cluster failed to import to the hub')
            case 'failed':
                return t('The cluster failed to upgrade')
            case 'provisionfailed':
                return t('The cluster creation failed')
            default:
                break
        }
    }

    if (props.cluster.statusMessage) {
        return (
            <AcmAlert
                style={{
                    marginTop: props.padTop ? '16px' : undefined,
                    marginBottom: props.padBottom ? '16px' : undefined,
                }}
                isInline
                noClose
                variant={clusterDangerStatuses.includes(props.cluster.status) ? 'danger' : 'info'}
                title={getClusterStatus(props.cluster!.status, t)}
                message={
                    <>
                        <div>{props.cluster.statusMessage}</div>
                        {props.action}
                    </>
                }
            />
        )
    } else {
        return null
    }
}
