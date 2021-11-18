/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { ClustersTable } from '../../../ManagedClusters/ManagedClusters'
import { ClusterSetContext } from '../ClusterSetDetails'

export function ClusterSetClustersPageContent() {
    const { t } = useTranslation()
    const { clusterSet, clusters } = useContext(ClusterSetContext)
    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <ClustersTable
                    clusters={clusters}
                    emptyState={
                        <AcmEmptyState
                            key="mcEmptyState"
                            title={t("You don't have any clusters assigned to this cluster set")}
                            message={
                                <Trans
                                    i18nKey={
                                        'Select the <bold>Manage resource assignments</bold> button to add a cluster.'
                                    }
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
                                    {t('Manage resource assignments')}
                                </RbacButton>
                            }
                        />
                    }
                />
            </PageSection>
        </AcmPageContent>
    )
}
