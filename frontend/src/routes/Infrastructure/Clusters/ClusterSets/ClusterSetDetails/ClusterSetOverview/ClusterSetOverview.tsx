/* Copyright Contributors to the Open Cluster Management project */

import { clusterDangerStatuses } from '../../../../../../resources'
import {
    AcmButton,
    AcmCountCardSection,
    AcmDescriptionList,
    AcmLabels,
    AcmPageContent,
} from '@open-cluster-management/ui-components'
import { PageSection, Popover } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useContext } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../../../NavigationPath'
import { MultiClusterNetworkStatus } from '../../components/MultiClusterNetworkStatus'
import { ClusterSetContext } from '../ClusterSetDetails'
import { submarinerHealthCheck, SubmarinerStatus } from '../ClusterSetSubmariner/ClusterSetSubmariner'

export function ClusterSetOverviewPageContent() {
    const { t } = useTranslation(['cluster'])
    const { push } = useHistory()
    const { clusterSet, clusters, clusterPools, submarinerAddons, clusterSetBindings } = useContext(ClusterSetContext)

    const unhealthySubmariners = submarinerAddons!.filter(
        (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.degraded
    )

    return (
        <AcmPageContent id="overview">
            <PageSection>
                <AcmDescriptionList
                    title={t('table.details')}
                    leftItems={[
                        {
                            key: t('table.name'),
                            value: clusterSet?.metadata.name,
                        },
                        {
                            key: t('table.networkStatus'),
                            value: <MultiClusterNetworkStatus clusterSet={clusterSet!} />,
                        },
                    ]}
                    rightItems={[
                        {
                            key: t('table.clusterSetBinding'),
                            keyAction: (
                                <Popover
                                    bodyContent={
                                        <Trans
                                            i18nKey="cluster:clusterSetBinding.edit.message"
                                            components={{ bold: <strong /> }}
                                        />
                                    }
                                >
                                    <AcmButton variant="link" style={{ padding: 0, paddingLeft: '6px' }}>
                                        <OutlinedQuestionCircleIcon />
                                    </AcmButton>
                                </Popover>
                            ),
                            value: clusterSetBindings?.length ? (
                                <AcmLabels
                                    labels={clusterSetBindings?.map((mcsb) => mcsb.metadata.namespace!)}
                                    variant="outline"
                                />
                            ) : (
                                '-'
                            ),
                        },
                    ]}
                />
                <div style={{ marginTop: '24px' }}>
                    <AcmCountCardSection
                        id="summary-status"
                        title={t('summary.status')}
                        cards={[
                            {
                                id: 'submariners',
                                count: submarinerAddons!.length,
                                title: t('submariner.addons'),
                                linkText: t('summary.submariner.launch'),
                                onLinkClick: () =>
                                    push(
                                        NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!)
                                    ),
                                countClick: () =>
                                    push(
                                        NavigationPath.clusterSetSubmariner.replace(':id', clusterSet!.metadata.name!)
                                    ),
                                isDanger: unhealthySubmariners.length > 0,
                            },
                            {
                                id: 'clusters',
                                count: clusters!.length,
                                title: t('clusters'),
                                linkText: t('summary.clusters.launch'),
                                onLinkClick: () =>
                                    push(NavigationPath.clusterSetClusters.replace(':id', clusterSet!.metadata.name!)),
                                countClick: () =>
                                    push(NavigationPath.clusterSetClusters.replace(':id', clusterSet!.metadata.name!)),
                                isDanger:
                                    clusters!.filter((cluster) => clusterDangerStatuses.includes(cluster.status))
                                        .length > 0,
                            },
                            {
                                id: 'clusterPools',
                                count: clusterPools!.length,
                                title: t('clusterPools'),
                                linkText: t('summary.clusterPools.launch'),
                                onLinkClick: () =>
                                    push(
                                        NavigationPath.clusterSetClusterPools.replace(':id', clusterSet!.metadata.name!)
                                    ),
                                countClick: () =>
                                    push(
                                        NavigationPath.clusterSetClusterPools.replace(':id', clusterSet!.metadata.name!)
                                    ),
                            },
                        ]}
                    />
                </div>
            </PageSection>
        </AcmPageContent>
    )
}
