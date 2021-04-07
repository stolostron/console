/* Copyright Contributors to the Open Cluster Management project */

import { AcmSelect, AcmInlineProvider, AcmModal, AcmButton } from '@open-cluster-management/ui-components'
import { SelectOption, ModalVariant } from '@patternfly/react-core'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BulkActionModel } from '../../../../components/BulkActionModel'
import { patchClusterSetLabel } from '../../../../lib/patch-cluster'
import { Cluster } from '../../../../lib/get-cluster'
import { StatusField } from './StatusField'
import { useCanJoinClusterSets } from '../../ClusterSets/components/useCanJoinClusterSets'

export function ManagedClusterSetModal(props: { close: () => void; open: boolean; clusters: Cluster[] }) {
    const { t } = useTranslation(['cluster', 'common'])
    const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
    const { canJoinClusterSets } = useCanJoinClusterSets()

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (cluster: Cluster) => <span style={{ whiteSpace: 'nowrap' }}>{cluster.name}</span>,
                sort: 'name',
            },
            {
                header: t('table.status'),
                sort: 'status',
                cell: (cluster: Cluster) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StatusField cluster={cluster} />
                    </span>
                ),
            },
            {
                header: t('table.provider'),
                sort: 'provider',
                cell: (cluster: Cluster) =>
                    cluster?.provider ? <AcmInlineProvider provider={cluster?.provider} /> : '-',
            },
            {
                header: t('table.set'),
                cell: () => {
                    return (
                        <AcmSelect
                            id="managedClusterSet"
                            maxHeight={'6em'}
                            isRequired
                            label=""
                            placeholder={t('common:select')}
                            value={managedClusterSet}
                            onChange={(mcs) => {
                                setManagedClusterSet(mcs)
                            }}
                        >
                            {canJoinClusterSets?.map((mcs) => (
                                <SelectOption key={mcs.metadata.name} value={mcs.metadata.name}>
                                    {mcs.metadata.name}
                                </SelectOption>
                            ))}
                        </AcmSelect>
                    )
                },
            },
        ],
        [t, managedClusterSet, canJoinClusterSets]
    )

    if (canJoinClusterSets === undefined) {
        return null
    }

    if (canJoinClusterSets.length === 0) {
        return (
            <AcmModal
                variant={ModalVariant.small}
                title={t('bulk.title.addSet')}
                isOpen={props.open}
                onClose={props.close}
                actions={[
                    <AcmButton key="okay" onClick={props.close}>
                        {t('common:close')}
                    </AcmButton>,
                ]}
            >
                {t('bulk.message.addSet.empty')}
            </AcmModal>
        )
    }

    return (
        <BulkActionModel<Cluster>
            open={props.open}
            title={t('bulk.title.addSet')}
            action={t('add')}
            processing={t('adding')}
            resources={props.clusters}
            close={() => {
                props.close()
                setManagedClusterSet(undefined)
            }}
            description={t('bulk.message.addSet')}
            columns={modalColumns}
            keyFn={(cluster) => cluster.name as string}
            actionFn={(cluster) => patchClusterSetLabel(cluster.name!, 'add', managedClusterSet)}
        />
    )
}
