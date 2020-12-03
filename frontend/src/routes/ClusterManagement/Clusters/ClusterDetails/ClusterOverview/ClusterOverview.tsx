import React, { Fragment, useContext, useState, useEffect } from 'react'
import { AcmDescriptionList, AcmLabels, AcmAlert } from '@open-cluster-management/ui-components'
import { PageSection, AlertVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from 'react-i18next'
import { ClusterContext } from '../ClusterDetails'
import { StatusField, DistributionField } from '../../../../../components/ClusterCommon'
import { ClusterStatus } from '../../../../../lib/get-cluster'
import { getHivePod } from '../../../../../resources/pod'

export function ClusterOverviewPageContent() {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster']) 
    return (
        <PageSection>
            <ProvisionNotification />
            <AcmDescriptionList
                title={t('table.details')}
                leftItems={[
                    { key: t('table.name'), value: cluster?.name },
                    { key: t('table.status'), value: cluster?.status && <StatusField status={cluster?.status} /> },
                    { key: t('table.distribution'), value: cluster?.distribution?.displayVersion && <DistributionField data={cluster?.distribution} /> },
                    { key: t('table.labels'), value: cluster?.labels && <AcmLabels labels={cluster?.labels} /> },
                ]}
                rightItems={[
                    { key: t('table.kubeApiServer'), value: cluster?.kubeApiServer },
                    { key: t('table.consoleUrl'), value: cluster?.consoleURL && <a href={cluster?.consoleURL} target="_blank" rel="noreferrer">{cluster?.consoleURL}</a> }
                ]} />
        </PageSection>
    )
}

const provisionStatuses: string[] = [ClusterStatus.creating, ClusterStatus.destroying, ClusterStatus.failed]

export function ProvisionNotification() {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster'])
    const [hiveLink, setHiveLink] = useState<string | undefined>(undefined)

    useEffect(() => {
        const openShiftConsoleUrlNode: HTMLInputElement | null = document.querySelector('#openshift-console-url')
        const openShiftConsoleUrl = openShiftConsoleUrlNode ? openShiftConsoleUrlNode.value : ''
        const name = cluster?.name ?? ''
        const namespace = cluster?.namespace ?? ''
        const status = cluster?.status ?? ''
        if (provisionStatuses.includes(status) && name && namespace) {
            const response = getHivePod(namespace, name, status)
            response.then((job) => {
                const podName = job?.metadata.name
                podName && setHiveLink(`${openShiftConsoleUrl}/k8s/ns/${namespace}/pods/${podName}/logs?container=hive`)
            })
        }
    }, [cluster?.namespace, cluster?.name, cluster?.status])

    if (!provisionStatuses.includes(cluster?.status ?? '') || !hiveLink) {
        return null
    }

    return (
        <div style={{ marginBottom: '1rem' }}>
            <AcmAlert
                isInline
                variant={cluster?.status === ClusterStatus.failed ? AlertVariant.danger : AlertVariant.info}
                title={
                    <Fragment>
                        {t(`provision.notification.${cluster?.status}`)}
                        <a href={hiveLink} target="_blank" rel="noreferrer" style={{ marginLeft: '4px' }}>
                            {t('view.logs')}
                            <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </a>
                    </Fragment>}            
            />
        </div>
    )
}
