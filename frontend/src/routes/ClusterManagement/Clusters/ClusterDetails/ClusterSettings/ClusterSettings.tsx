import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AcmPageCard, AcmTable, IAcmTableColumn, AcmInlineStatus, StatusType } from '@open-cluster-management/ui-components'
import { Addon, AddonStatus } from '../../../../../lib/get-addons'
import { ClusterContext } from '../ClusterDetails'

export function ClustersSettingsPageContent() {
    const { addons } = useContext(ClusterContext)
    return <ClusterSettingsTable addons={addons} />
}

export function ClusterSettingsTable(props: {
    addons: Addon[] | undefined
}) {
    const { t } = useTranslation(['cluster'])
    const columns: IAcmTableColumn<Addon>[] = [
        {
            header: t('table.name'),
            sort: 'name',
            search: 'name',
            cell: 'name',
        },
        {
            header: t('table.status'),
            cell: (item: Addon) => {
                let type
                switch(item.status) {
                case AddonStatus.Available:
                    type = StatusType.healthy
                    break
                case AddonStatus.Degraded:
                    type = StatusType.danger
                    break
                case AddonStatus.Progressing:
                    type = StatusType.progress
                    break
                case AddonStatus.Disabled:
                case AddonStatus.Unknown:
                default:
                    type = StatusType.unknown
                }
                return <AcmInlineStatus type={type} status={item.status} />
            },
            search: 'status',
        },
        {
            header: t('table.message'),
            cell: 'message'
        },
    ]

    return (
        <AcmPageCard>
            <AcmTable<Addon>
                plural="add-ons"
                items={props.addons}
                columns={columns}
                keyFn={(addon: Addon) => addon.name}
                tableActions={[]}
                bulkActions={[]}
                rowActions={[]}
            />
        </AcmPageCard>
    )
}
