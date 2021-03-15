/* Copyright Contributors to the Open Cluster Management project */

import { AcmInlineStatus, AcmTable, StatusType } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorPage } from '../../../../../components/ErrorPage'
import { Addon, AddonStatus } from '../../../../../lib/get-addons'
import { ClusterContext } from '../ClusterDetails'

export function ClustersSettingsPageContent() {
    const { addons, addonsError } = useContext(ClusterContext)
    return (
        <PageSection variant="light">
            <ClusterSettingsTable addons={addons} addonsError={addonsError} />
        </PageSection>
    )
}

export function ClusterSettingsTable(props: { addons: Addon[] | undefined; addonsError: Error | undefined }) {
    const { t } = useTranslation(['cluster'])

    if (props.addonsError) {
        return <ErrorPage error={props.addonsError} />
    }

    return (
        <AcmTable<Addon>
            plural="add-ons"
            items={props.addons}
            columns={[
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
                        switch (item.status) {
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
                                type = StatusType.pending
                                break
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
                    cell: 'message',
                },
            ]}
            keyFn={(addon: Addon) => addon.name}
            tableActions={[]}
            bulkActions={[]}
            rowActions={[]}
        />
    )
}
