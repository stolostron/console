/* Copyright Contributors to the Open Cluster Management project */
import { AcmAlert } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { Cluster, clusterDangerStatuses } from '../../../../lib/get-cluster'

export function ClusterStatusMessageAlert(props: {
    cluster: Cluster
    action?: React.ReactNode
    padTop?: boolean
    padBottom?: boolean
}) {
    const { t } = useTranslation(['cluster'])
    if (props.cluster.statusMessage) {
        return (
            <AcmAlert
                style={{
                    marginTop: props.padTop && '16px',
                    marginBottom: props.padBottom && '16px',
                }}
                isInline
                noClose
                variant={clusterDangerStatuses.includes(props.cluster.status) ? 'danger' : 'info'}
                title={t(`status.${props.cluster.status}.alert.title`)}
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
