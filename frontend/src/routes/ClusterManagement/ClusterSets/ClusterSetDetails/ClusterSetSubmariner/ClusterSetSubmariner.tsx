/* Copyright Contributors to the Open Cluster Management project */

import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { useTranslation, Trans } from 'react-i18next'
import { PageSection } from '@patternfly/react-core'
import { AcmPageContent, AcmExpandableCard, AcmEmptyState, AcmTable } from '@open-cluster-management/ui-components'
import { ClusterSetContext } from '../ClusterSetDetails'
import { RbacButton } from '../../../../../components/Rbac'
import { rbacCreate } from '../../../../../lib/rbac-util'
import { ManagedClusterAddOn } from '../../../../../resources/managed-cluster-add-on'
import { managedClusterAddonsState } from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'

type SubmarinerType = 'submariner'
const submariner: SubmarinerType = 'submariner'

export function ClusterSetClustersPageContent() {
    const { t } = useTranslation(['cluster'])
    const { clusterSet, clusters } = useContext(ClusterSetContext)
    const [managedClusterAddons] = useRecoilState(managedClusterAddonsState)

    const submarinerAddons = managedClusterAddons.filter(
        (mca) => mca.metadata.name === submariner && clusters?.find((c) => c.namespace === mca.metadata.namespace)
    )

    function keyFn(mca: ManagedClusterAddOn) {
        return mca.metadata.namespace!
    }

    return (
        <AcmPageContent id="clusters">
            <PageSection>
                <AcmExpandableCard title={t('clusters')}>
                    <AcmTable<ManagedClusterAddOn>
                        plural="submariner addons"
                        items={submarinerAddons}
                        columns={[
                            {
                                header: t('table.clusterName'),
                                sort: 'metadata.namespace',
                                search: 'metadata.namespace',
                                cell: 'metadata.namespace',
                            },
                        ]}
                        keyFn={keyFn}
                        key="submarinerTable"
                        bulkActions={[]}
                        tableActions={[]}
                        emptyState={
                            <AcmEmptyState
                                key="mcEmptyState"
                                title={t('managed.clusterSets.emptyStateHeader')}
                                message={
                                    <Trans
                                        i18nKey={'cluster:managed.clusterSets.emptyStateMsg'}
                                        components={{ bold: <strong />, p: <p /> }}
                                    />
                                }
                                // action={
                                //     <AcmButton
                                //         role="link"
                                //         onClick={() => setCreateClusterSetModalOpen(true)}
                                //         isDisabled={!canCreateClusterSet}
                                //         tooltip={t('common:rbac.unauthorized')}
                                //     >
                                //         {t('managed.createClusterSet')}
                                //     </AcmButton>
                                // }
                            />
                        }
                    />
                </AcmExpandableCard>
            </PageSection>
        </AcmPageContent>
    )
}
