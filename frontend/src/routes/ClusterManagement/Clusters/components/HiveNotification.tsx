import React, { Fragment, useContext } from 'react'
import { AcmAlert, AcmButton } from '@open-cluster-management/ui-components'
import { AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { makeStyles } from '@material-ui/styles'
import { useTranslation } from 'react-i18next'
import { ClusterStatus } from '../../../../lib/get-cluster'
import { getHivePod } from '../../../../resources/pod'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

const useStyles = makeStyles({
    logsButton: {
        padding: 0,
        fontSize: '14px',
        marginLeft: '4px',
        '& svg': {
            width: '12px',
        },
    },
})

export function HiveNotification() {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster'])
    const classes = useStyles()

    const onClick = () => {
        const openShiftConsoleUrlNode: HTMLInputElement | null = document.querySelector('#openshift-console-url')
        /* istanbul ignore next */
        const openShiftConsoleUrl = openShiftConsoleUrlNode ? openShiftConsoleUrlNode.value : ''
        /* istanbul ignore next */
        const name = cluster?.name ?? ''
        /* istanbul ignore next */
        const namespace = cluster?.namespace ?? ''
        /* istanbul ignore next */
        const status = cluster?.status ?? ''
        /* istanbul ignore else */
        if (name && namespace) {
            const response = getHivePod(namespace, name, status)
            response.then((job) => {
                const podName = job?.metadata.name
                podName && window.open(`${openShiftConsoleUrl}/k8s/ns/${namespace}/pods/${podName}/logs?container=hive`)
            })
        }
    }

    const provisionStatuses: string[] = [ClusterStatus.creating, ClusterStatus.destroying, ClusterStatus.failed]

    if (!provisionStatuses.includes(/* istanbul ignore next */ cluster?.status ?? '')) {
        return null
    }

    return (
        <div style={{ marginBottom: '1rem' }} id={`hive-notification-${cluster?.status}`}>
            <AcmAlert
                isInline
                variant={cluster?.status === ClusterStatus.failed ? AlertVariant.danger : AlertVariant.info}
                title={
                    <Fragment>
                        {t(`provision.notification.${cluster?.status}`)}
                        <AcmButton
                            onClick={onClick}
                            variant={ButtonVariant.link}
                            role="link"
                            id="view-logs"
                            className={classes.logsButton}
                        >
                            {t('view.logs')}
                            <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </AcmButton>
                    </Fragment>
                }
            />
        </div>
    )
}
