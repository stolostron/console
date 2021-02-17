import React, { useContext } from 'react'
import {
    AcmDescriptionList,
    AcmLabels,
    AcmButton,
    AcmInlineProvider,
    AcmInlineCopy,
    AcmErrorBoundary,
    AcmDrawerContext,
} from '@open-cluster-management/ui-components'
import { PageSection, ButtonVariant } from '@patternfly/react-core'
import { PencilAltIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from 'react-i18next'
import { ClusterContext } from '../ClusterDetails'
import { DistributionField } from '../../components/DistributionField'
import { StatusField } from '../../components/StatusField'
import { LoginCredentials } from '../../components/LoginCredentials'
import { HiveNotification } from '../../components/HiveNotification'
import { EditLabels } from '../../components/EditLabels'
import { ImportCommandContainer } from '../../../Clusters/components/ImportCommand'
import { StatusSummaryCount } from '../../components/StatusSummaryCount'
import { ClusterStatus } from '../../../../../lib/get-cluster'

export function ClusterOverviewPageContent(props: {
    getSecretAccessRestriction?: boolean
    editLabelAccessRestriction?: boolean
}) {
    const { cluster } = useContext(ClusterContext)
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const { t } = useTranslation(['cluster', 'common'])
    return (
        <PageSection>
            <AcmErrorBoundary>
                <HiveNotification />
                <ImportCommandContainer />
                <AcmDescriptionList
                    title={t('table.details')}
                    leftItems={[
                        { key: t('table.status'), value: cluster?.status && <StatusField cluster={cluster} /> },
                        {
                            key: t('table.provider'),
                            value: cluster?.provider && <AcmInlineProvider provider={cluster.provider} />,
                        },
                        {
                            key: t('table.distribution'),
                            value: cluster?.distribution?.displayVersion && <DistributionField cluster={cluster} />,
                        },
                        {
                            key: t('table.labels'),
                            value: cluster?.labels && <AcmLabels labels={cluster?.labels} />,
                            keyAction: (
                                <AcmButton
                                    onClick={() => {
                                        if (cluster) {
                                            setDrawerContext({
                                                isExpanded: true,
                                                title: t('labels.edit.title'),
                                                onCloseClick: () => setDrawerContext(undefined),
                                                panelContent: (
                                                    <EditLabels
                                                        cluster={cluster}
                                                        close={() => setDrawerContext(undefined)}
                                                    />
                                                ),
                                                panelContentProps: { minSize: '600px' },
                                            })
                                        }
                                    }}
                                    variant={ButtonVariant.plain}
                                    aria-label={t('common:labels.edit.title')}
                                    isDisabled={props.editLabelAccessRestriction}
                                    tooltip={props.editLabelAccessRestriction ? t('common:rbac.unauthorized') : ''}
                                >
                                    <PencilAltIcon
                                        color={
                                            props.editLabelAccessRestriction
                                                ? 'var(--pf-global--disabled-color--200)'
                                                : 'var(--pf-global--primary-color--100)'
                                        }
                                    />
                                </AcmButton>
                            ),
                        },
                    ]}
                    rightItems={[
                        {
                            key: t('table.kubeApiServer'),
                            value: cluster?.kubeApiServer && (
                                <AcmInlineCopy text={cluster?.kubeApiServer} id="kube-api-server" />
                            ),
                        },
                        {
                            key: t('table.consoleUrl'),
                            value: cluster?.consoleURL && (
                                <a href={cluster?.consoleURL} target="_blank" rel="noreferrer">
                                    {cluster?.consoleURL}
                                </a>
                            ),
                        },
                        {
                            key: t('table.clusterId'),
                            value: cluster?.labels?.clusterID && (
                                <>
                                    <div>{cluster?.labels?.clusterID}</div>
                                    <a
                                        href={`https://cloud.redhat.com/openshift/details/${cluster?.labels?.clusterID}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {t('common:openshift.cluster.manager')} <ExternalLinkAltIcon />
                                    </a>
                                </>
                            ),
                        },
                        {
                            key: t('table.credentials'),
                            value: <LoginCredentials accessRestriction={props.getSecretAccessRestriction} />,
                        },
                    ]}
                />
                {cluster?.status === ClusterStatus.ready && <StatusSummaryCount />}
            </AcmErrorBoundary>
        </PageSection>
    )
}
