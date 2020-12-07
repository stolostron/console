import React, { useContext } from 'react'
import { AcmDescriptionList, AcmLabels } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from 'react-i18next'
import { ClusterContext } from '../ClusterDetails'
import { StatusField, DistributionField } from '../../../../../components/ClusterCommon'
import { LoginCredentials } from '../../components/LoginCredentials'
import { HiveNotification } from '../../components/HiveNotification'

export function ClusterOverviewPageContent() {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster']) 
    return (
        <PageSection>
            <HiveNotification />
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
                    { key: t('table.consoleUrl'), value: cluster?.consoleURL && <a href={cluster?.consoleURL} target="_blank" rel="noreferrer">{cluster?.consoleURL}</a> },
                    { key: t('table.credentials'), value: <LoginCredentials /> }
                ]} />
        </PageSection>
    )
}
