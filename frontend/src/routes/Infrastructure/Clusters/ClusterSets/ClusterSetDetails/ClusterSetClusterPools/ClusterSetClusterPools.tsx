/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSetDefinition } from '../../../../../../resources'
import { AcmEmptyState, AcmPageContent } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { Trans, useTranslation } from '../../../../../../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { RbacButton } from '../../../../../../components/Rbac'
import { rbacCreate } from '../../../../../../lib/rbac-util'
import { locationWithCancelBack, NavigationPath } from '../../../../../../NavigationPath'
import { ClusterPoolsTable } from '../../../ClusterPools/ClusterPools'
import { ClusterSetContext } from '../ClusterSetDetails'

export function ClusterSetClusterPoolsPageContent() {
    const { t } = useTranslation()
    const { clusterSet, clusterPools } = useContext(ClusterSetContext)
    return (
        <AcmPageContent id="cluster-pools">
            <PageSection>
                <ClusterPoolsTable
                    clusterPools={clusterPools!}
                    emptyState={
                        <AcmEmptyState
                            key="mcEmptyState"
                            title={t('managed.clusterSets.clusterPools.emptyStateHeader')}
                            message={
                                <Trans
                                    i18nKey={'managed.clusterSets.clusterPools.emptyStateMsg'}
                                    components={{ bold: <strong /> }}
                                />
                            }
                            action={
                                <RbacButton
                                    component={Link}
                                    to={locationWithCancelBack(
                                        NavigationPath.createClusterPool,
                                        `?clusterSet=${clusterSet!.metadata.name}`
                                    )}
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
                                    {t('managed.clusterSets.clusterPools.emptyStateButton')}
                                </RbacButton>
                            }
                        />
                    }
                />
            </PageSection>
        </AcmPageContent>
    )
}
