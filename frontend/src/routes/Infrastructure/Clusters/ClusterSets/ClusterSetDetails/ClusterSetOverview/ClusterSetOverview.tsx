/* Copyright Contributors to the Open Cluster Management project */

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
import { clusterDangerStatuses } from '../../../../../../resources'
import { MultiClusterNetworkStatus } from '../../components/MultiClusterNetworkStatus'
import { ClusterSetContext } from '../ClusterSetDetails'
import { submarinerHealthCheck, SubmarinerStatus } from '../ClusterSetSubmariner/ClusterSetSubmariner'

export function ClusterSetOverviewPageContent() {
    const { t } = useTranslation()
    const { push } = useHistory()
    const { clusterSet, clusters, clusterPools, submarinerAddons, clusterSetBindings } = useContext(ClusterSetContext)

    const unhealthySubmariners = submarinerAddons!.filter(
        (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.degraded
    )

    return (
        <AcmPageContent id="overview">
            <PageSection>
                <AcmDescriptionList
                    title={t('Details')}
                    leftItems={[
                        {
                            key: t('Name'),
                            value: clusterSet?.metadata.name,
                        },
                        {
                            key: t('Multi-cluster network status'),
                            value: <MultiClusterNetworkStatus clusterSet={clusterSet!} />,
                        },
                    ]}
                    rightItems={[
                        {
                            key: t('Namespace bindings'),
                            keyAction: (
                                <Popover
                                    bodyContent={
                                        <Trans
                                            i18nKey="A <bold>ManagedClusterSetBinding</bold> resource binds a <bold>ManagedClusterSet</bold> resource to a namespace. Placement resources that are created in the same namespace can only access managed clusters that are included in the bound <bold>ManagedClusterSet</bold> resource."
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
                                <AcmLabels labels={clusterSetBindings?.map((mcsb) => mcsb.metadata.namespace!)} />
                            ) : (
                                '-'
                            ),
                        },
                    ]}
                />
                <div style={{ marginTop: '24px' }}>
                    <AcmCountCardSection
                        id="summary-status"
                        title={t('Status')}
                        cards={[
                            {
                                id: 'submariners',
                                count: submarinerAddons!.length,
                                title: t('Submariner add-ons'),
                                linkText: t('Go to Submariner add-ons'),
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
                                title: t('Clusters'),
                                linkText: t('Go to Managed clusters'),
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
                                title: t('Cluster pools'),
                                linkText: t('Go to Cluster pools'),
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
