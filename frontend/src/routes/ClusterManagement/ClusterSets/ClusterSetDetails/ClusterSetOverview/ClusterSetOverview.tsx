/* Copyright Contributors to the Open Cluster Management project */

import { useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageSection, ButtonVariant } from '@patternfly/react-core'
import { PencilAltIcon } from '@patternfly/react-icons'
import {
    AcmPageContent,
    AcmDescriptionList,
    AcmCountCardSection,
    AcmLabels,
} from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import { RbacButton } from '../../../../../components/Rbac'
import { ManagedClusterSetDefinition } from '../../../../../resources/managed-cluster-set'
import { EditLabels } from '../../../Clusters/components/EditLabels'
import { rbacPatch } from '../../../../../lib/rbac-util'
import { clusterDangerStatuses } from '../../../../../lib/get-cluster'
import { NavigationPath } from '../../../../../NavigationPath'
import { submarinerHealthCheck, SubmarinerStatus } from '../ClusterSetSubmariner/ClusterSetSubmariner'
import { MultiClusterNetworkStatus } from '../../components/MultiClusterNetworkStatus'

export function ClusterSetOverviewPageContent() {
    const { t } = useTranslation(['cluster'])
    const { push } = useHistory()
    const { clusterSet, clusters, clusterPools, submarinerAddons } = useContext(ClusterSetContext)
    const [showEditLabels, setShowEditLabels] = useState<boolean>(false)

    const unhealthySubmariners = submarinerAddons!.filter(
        (mca) => submarinerHealthCheck(mca) === SubmarinerStatus.degraded
    )

    return (
        <AcmPageContent id="overview">
            <PageSection>
                <EditLabels
                    resource={
                        showEditLabels
                            ? {
                                  ...ManagedClusterSetDefinition,
                                  metadata: { name: clusterSet!.metadata.name, labels: clusterSet!.metadata.labels },
                              }
                            : undefined
                    }
                    close={() => setShowEditLabels(false)}
                />
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
                            key: t('table.labels'),
                            value: clusterSet?.metadata.labels && <AcmLabels labels={clusterSet?.metadata.labels} />,
                            keyAction: (
                                <RbacButton
                                    onClick={() => setShowEditLabels(true)}
                                    variant={ButtonVariant.plain}
                                    aria-label={t('common:labels.edit.title')}
                                    rbac={[
                                        rbacPatch(ManagedClusterSetDefinition, undefined, clusterSet?.metadata.name),
                                    ]}
                                >
                                    <PencilAltIcon />
                                </RbacButton>
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
