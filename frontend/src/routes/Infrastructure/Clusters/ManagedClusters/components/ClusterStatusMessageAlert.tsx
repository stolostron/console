/* Copyright Contributors to the Open Cluster Management project */
import { AcmAlert } from '../../../../../ui-components'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { Cluster, clusterDangerStatuses, getAlertTitle } from '../../../../../resources/utils'

export function ClusterStatusMessageAlert(props: {
  cluster: Cluster
  action?: React.ReactNode
  padTop?: boolean
  padBottom?: boolean
}) {
  const { t } = useTranslation()
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
        title={getAlertTitle(props.cluster.status, t)}
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
