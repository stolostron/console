/* Copyright Contributors to the Open Cluster Management project */

import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { PageSection } from '@patternfly/react-core'
import { AcmPageContent, AcmEmptyState } from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import { ClustersTable } from '../../../Clusters/Clusters'
import { RbacButton } from '../../../../../components/Rbac'
import { ManagedClusterSetDefinition } from '../../../../../resources/managed-cluster-set'
import { rbacCreate } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'

export function ClusterSetClustersPageContent() {
    const { t } = useTranslation(['cluster'])
    const { clusterSet, clusters } = useContext(ClusterSetContext)
    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <ClustersTable
                    clusters={clusters}
                    emptyState={
                        <AcmEmptyState
                            key="mcEmptyState"
                            title={t('managed.clusterSets.clusters.emptyStateHeader')}
                            message={
                                <Trans
                                    i18nKey={'cluster:managed.clusterSets.clusters.emptyStateMsg'}
                                    components={{ bold: <strong /> }}
                                />
                            }
                            action={
                                <RbacButton
                                    component={Link}
                                    to={NavigationPath.clusterSetManage.replace(':id', clusterSet!.metadata.name!)}
                                    variant="primary"
                                    rbac={[
                                        rbacCreate(
                                            ManagedClusterSetDefinition,
                                            undefined,
                                            clusterSet!.metadata.name,
                                            'join'
                                        ),
                                    ]}
                                >
                                    {t('managed.clusterSets.clusters.emptyStateButton')}
                                </RbacButton>
                            }
                        />
                    }
                />
            </PageSection>
        </AcmPageContent>
    )
}
