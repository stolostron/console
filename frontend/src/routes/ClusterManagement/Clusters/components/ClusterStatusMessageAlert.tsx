import { AcmAlert } from '@open-cluster-management/ui-components'
import { Cluster, clusterDangerStatuses } from '../../../../lib/get-cluster'

export function ClusterStatusMessageAlert(props: {
    cluster: Cluster
    action?: React.ReactNode
    padTop?: boolean
    padBottom?: boolean
}) {
    if (props.cluster.statusMessage) {
        return (
            <AcmAlert
                style={{
                    marginTop: props.padTop && '16px',
                    marginBottom: props.padBottom && '16px',
                }}
                isInline
                title={props.cluster.statusMessage}
                variant={clusterDangerStatuses.includes(props.cluster.status) ? 'danger' : 'info'}
                noClose
                message={props.action}
            />
        )
    } else {
        return null
    }
}
